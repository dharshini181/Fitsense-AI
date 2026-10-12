"""
Outfit visualization service — Cloudflare Workers AI (FLUX.1-schnell).

Replaces the Hugging Face route. Same public functions, same return contract:
    generate_outfit_image(items, style, occasion) -> "data:image/...;base64,..." | None
    generate_image_from_description(description)  -> "data:image/...;base64,..." | None

so routers/stylist.py and routers/outfits.py do not need to change.

Security:
- CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN come from environment variables
  (or the backend .env via settings). They are never written in source and this
  module only runs on the backend, so the browser never sees them.
- Error messages never include the token.

Behaviour:
- Uses the official REST endpoint:
  POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/black-forest-labs/flux-1-schnell
- Blocking `requests` call is run in a worker thread so FastAPI's event loop is
  not blocked while the image is generated.
- Fails soft for the web app (returns None + logs the reason), but
  `generate_image_bytes()` raises `ImageGenError` with a clear `kind` for scripts
  and tests.
- Every generated image is also saved as a PNG in IMAGE_OUTPUT_DIR
  (default: ./generated_images). Set IMAGE_SAVE_ENABLED=false to disable.
"""

from __future__ import annotations

import base64
import binascii
import io
import logging
import os
import re
import time
import uuid
from pathlib import Path

import requests
from fastapi.concurrency import run_in_threadpool

logger = logging.getLogger("fitsense.image")

MODEL_ID = "@cf/black-forest-labs/flux-1-schnell"
API_BASE = "https://api.cloudflare.com/client/v4"

# Documented limits for this model: prompt 1..2048 chars, steps 1..8 (default 4).
MAX_PROMPT_CHARS = 2048
DEFAULT_STEPS = 4

# (connect timeout, read timeout) in seconds. Image generation usually takes a
# few seconds; 60s read is a generous ceiling.
REQUEST_TIMEOUT = (10, 60)
MAX_ATTEMPTS = 2  # one retry for 429 / 5xx / network blips
MAX_RETRY_WAIT = 8  # never sleep longer than this inside a web request


class ImageGenError(Exception):
    """Raised by generate_image_bytes(). `kind` is a short machine-readable tag."""

    def __init__(self, kind: str, message: str, status: int | None = None):
        super().__init__(message)
        self.kind = kind
        self.status = status


# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

def _credentials() -> tuple[str, str]:
    """Environment variables first, then the backend's settings/.env."""
    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not account_id or not token:
        try:
            from app.config import settings

            account_id = account_id or (getattr(settings, "CLOUDFLARE_ACCOUNT_ID", "") or "").strip()
            token = token or (getattr(settings, "CLOUDFLARE_API_TOKEN", "") or "").strip()
        except Exception:
            pass
    return account_id, token


def _endpoint(account_id: str) -> str:
    # CLOUDFLARE_API_BASE is only for tests (local mock server).
    base = os.environ.get("CLOUDFLARE_API_BASE", API_BASE).rstrip("/")
    return f"{base}/accounts/{account_id}/ai/run/{MODEL_ID}"


# --------------------------------------------------------------------------- #
# Response handling
# --------------------------------------------------------------------------- #

def _error_text(payload) -> str:
    """Pull a readable message out of Cloudflare's {"errors":[{code,message}]}."""
    if isinstance(payload, dict):
        errs = payload.get("errors")
        if isinstance(errs, list) and errs:
            parts = []
            for e in errs:
                if isinstance(e, dict):
                    parts.append(f"{e.get('code', '')} {e.get('message', '')}".strip())
                else:
                    parts.append(str(e))
            return "; ".join(parts)
    return ""


def _sniff_format(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def _decode_image_field(value) -> bytes:
    if not isinstance(value, str) or not value:
        raise ImageGenError("invalid_response", "Response had no base64 'image' string.")
    if value.startswith("data:") and "," in value:  # tolerate data URIs
        value = value.split(",", 1)[1]
    try:
        data = base64.b64decode(value, validate=False)
    except (binascii.Error, ValueError) as exc:
        raise ImageGenError("invalid_response", f"Image field is not valid base64: {exc}")
    if _sniff_format(data) is None:
        raise ImageGenError("invalid_response", "Decoded data is not a PNG/JPEG/WebP image.")
    return data


def _parse_success(resp: requests.Response) -> bytes:
    """Return raw image bytes from a 200 response.

    Cloudflare's REST envelope is {"result": {"image": "<base64>"}, "success": true, ...}.
    We also accept a top-level {"image": ...} and a raw image body, because the
    shape differs between the REST API and Workers bindings.
    """
    ctype = resp.headers.get("content-type", "").lower()
    if ctype.startswith("image/"):
        if _sniff_format(resp.content) is None:
            raise ImageGenError("invalid_response", "Image content-type but body is not an image.")
        return resp.content

    try:
        payload = resp.json()
    except ValueError:
        raise ImageGenError("invalid_response", "Response was not valid JSON.")

    if not isinstance(payload, dict):
        raise ImageGenError("invalid_response", "Unexpected JSON shape (not an object).")

    if payload.get("success") is False:
        raise ImageGenError("api_error", _error_text(payload) or "Cloudflare reported success=false.")

    result = payload.get("result")
    if isinstance(result, dict) and "image" in result:
        return _decode_image_field(result["image"])
    if "image" in payload:
        return _decode_image_field(payload["image"])
    raise ImageGenError("invalid_response", "No 'image' field in response.")


def _raise_for_status(resp: requests.Response) -> None:
    status = resp.status_code
    try:
        detail = _error_text(resp.json())
    except ValueError:
        detail = ""
    suffix = f" ({detail})" if detail else ""

    if status in (401, 403):
        raise ImageGenError(
            "auth",
            f"Cloudflare rejected the credentials (HTTP {status}). Check CLOUDFLARE_API_TOKEN "
            f"has Workers AI Read+Edit permission and CLOUDFLARE_ACCOUNT_ID is correct{suffix}.",
            status,
        )
    if status == 404:
        raise ImageGenError("not_found", f"Endpoint/model not found (HTTP 404). Check the Account ID{suffix}.", status)
    if status == 429:
        raise ImageGenError("rate_limited", f"Rate limit or daily free allowance reached (HTTP 429){suffix}.", status)
    if status == 400 or status == 422:
        raise ImageGenError("bad_request", f"Cloudflare rejected the request (HTTP {status}){suffix}.", status)
    if status >= 500:
        raise ImageGenError("server_error", f"Cloudflare server error (HTTP {status}){suffix}.", status)
    raise ImageGenError("http_error", f"Unexpected HTTP {status}{suffix}.", status)


def _retry_wait(resp: requests.Response | None, attempt: int) -> float:
    if resp is not None:
        ra = resp.headers.get("retry-after", "")
        if ra.isdigit():
            return min(float(ra), MAX_RETRY_WAIT)
    return min(2.0 * attempt, MAX_RETRY_WAIT)


# --------------------------------------------------------------------------- #
# Core call
# --------------------------------------------------------------------------- #

def generate_image_bytes(prompt: str, steps: int = DEFAULT_STEPS, seed: int | None = None) -> bytes:
    """Blocking call. Returns raw image bytes (Cloudflare typically returns JPEG)."""
    account_id, token = _credentials()
    if not account_id or not token:
        raise ImageGenError(
            "not_configured",
            "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must both be set.",
        )
    if not re.fullmatch(r"[0-9a-fA-F]{32}", account_id):
        raise ImageGenError("not_configured", "CLOUDFLARE_ACCOUNT_ID should be a 32-character hex string.")

    prompt = (prompt or "").strip()
    if not prompt:
        raise ImageGenError("bad_request", "Prompt is empty.")
    if len(prompt) > MAX_PROMPT_CHARS:
        prompt = prompt[:MAX_PROMPT_CHARS]

    body: dict = {"prompt": prompt, "steps": max(1, min(int(steps), 8))}
    if seed is not None:
        body["seed"] = int(seed)

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    url = _endpoint(account_id)

    last_error: ImageGenError | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        resp = None
        try:
            resp = requests.post(url, headers=headers, json=body, timeout=REQUEST_TIMEOUT)
            if resp.status_code == 200:
                return _parse_success(resp)
            _raise_for_status(resp)
        except requests.exceptions.Timeout:
            last_error = ImageGenError("timeout", f"Request timed out after {REQUEST_TIMEOUT[1]}s.")
        except requests.exceptions.ConnectionError as exc:
            # str(exc) can contain the URL (which holds the account id, not the token) — fine to log.
            last_error = ImageGenError("network", f"Could not reach Cloudflare: {type(exc).__name__}.")
        except requests.exceptions.RequestException as exc:
            last_error = ImageGenError("network", f"Request failed: {type(exc).__name__}.")
        except ImageGenError as exc:
            last_error = exc

        retryable = last_error.kind in ("rate_limited", "server_error", "timeout", "network")
        # A daily-allowance 429 will not clear in a few seconds; don't hammer it.
        if last_error.kind == "rate_limited" and "4006" in str(last_error):
            retryable = False
        if not retryable or attempt == MAX_ATTEMPTS:
            raise last_error
        time.sleep(_retry_wait(resp, attempt))

    raise last_error or ImageGenError("unknown", "Image generation failed.")


# --------------------------------------------------------------------------- #
# Saving
# --------------------------------------------------------------------------- #

def save_png(image_bytes: bytes, directory: str | os.PathLike | None = None, stem: str | None = None) -> Path:
    """Save image bytes as a real PNG file (converting from JPEG/WebP if needed)."""
    from PIL import Image  # Pillow

    out_dir = Path(directory or os.environ.get("IMAGE_OUTPUT_DIR", "generated_images"))
    out_dir.mkdir(parents=True, exist_ok=True)
    name = f"{stem or 'fitsense_' + time.strftime('%Y%m%d_%H%M%S') + '_' + uuid.uuid4().hex[:6]}.png"
    path = out_dir / name

    if _sniff_format(image_bytes) == "png":
        path.write_bytes(image_bytes)
    else:
        with Image.open(io.BytesIO(image_bytes)) as im:
            im.convert("RGB").save(path, format="PNG")
    return path


def _to_data_uri(image_bytes: bytes) -> str:
    fmt = _sniff_format(image_bytes) or "png"
    return f"data:image/{fmt};base64,{base64.b64encode(image_bytes).decode('ascii')}"


def _generate_sync(prompt: str) -> str | None:
    try:
        data = generate_image_bytes(prompt)
    except ImageGenError as exc:
        logger.warning("[ImageGen] %s: %s", exc.kind, exc)
        print(f"[ImageGen] {exc.kind}: {exc}")
        return None
    except Exception as exc:  # never let image problems break a stylist reply
        logger.exception("[ImageGen] unexpected error")
        print(f"[ImageGen] unexpected error: {type(exc).__name__}")
        return None

    if os.environ.get("IMAGE_SAVE_ENABLED", "true").lower() != "false":
        try:
            save_png(data)
        except Exception as exc:
            print(f"[ImageGen] Could not save PNG (image still returned): {type(exc).__name__}: {exc}")
    return _to_data_uri(data)


# --------------------------------------------------------------------------- #
# Public API — same names/signatures/prompts as before
# --------------------------------------------------------------------------- #

async def _call_cloudflare(prompt: str) -> str | None:
    return await run_in_threadpool(_generate_sync, prompt)


async def generate_outfit_image(items: list[str], style: str = "Minimalist", occasion: str = "Casual") -> str | None:
    item_list = ", ".join(items) if items else "a stylish outfit"
    prompt = (
        f"Professional fashion photography, full-body shot of a model wearing "
        f"{item_list}. {style} style, dressed for a {occasion.lower()} occasion. "
        f"Studio lighting, neutral background, high detail, editorial fashion magazine quality."
    )
    return await _call_cloudflare(prompt)


async def generate_image_from_description(description: str) -> str | None:
    prompt = (
        f"Professional fashion photography, full-body editorial shot of a model. "
        f"{description} "
        f"Studio lighting, neutral background, high detail, fashion magazine quality."
    )
    return await _call_cloudflare(prompt)