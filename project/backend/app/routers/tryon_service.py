"""
Virtual try-on: show the user's OWN photo wearing a suggested outfit.

Two providers (set TRYON_PROVIDER in .env):
  cloudflare (default) - Cloudflare Workers AI FLUX.2 klein 4B image editing.
                         Uses your free daily Neuron allowance, no billing needed.
  gemini               - Gemini "Nano Banana". Better likeness, but Google has no
                         free tier for image output, so it needs billing.

The photo is processed in memory and never saved or logged.
"""

from __future__ import annotations

import base64
import io
import logging
import os
import time

import requests
from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool

from app.config import settings
from app.services import image_service as imgsvc

logger = logging.getLogger("fitsense.tryon")

PROVIDER = os.environ.get("TRYON_PROVIDER", "cloudflare").lower()
CF_MODEL = os.environ.get("TRYON_CF_MODEL", "@cf/black-forest-labs/flux-2-klein-4b")
GEMINI_MODEL = os.environ.get("TRYON_MODEL", "gemini-nano-banana-2.1")

MAX_BYTES = 6 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_DESCRIPTION = 400
CF_INPUT_MAX_SIDE = 500          # Cloudflare: each input image must be under 512x512
CF_TIMEOUT = (10, 90)

# Cap tries per user per day (in memory; resets on restart) to protect the free allowance.
DAILY_LIMIT = int(os.environ.get("TRYON_DAILY_LIMIT", "10"))
_usage: dict[int, tuple[str, int]] = {}


# ----------------------------------------------------------------- limits ---
def _check_quota(user_id: int) -> None:
    today = time.strftime("%Y-%m-%d", time.gmtime())
    day, count = _usage.get(user_id, (today, 0))
    if day != today:
        day, count = today, 0
    if count >= DAILY_LIMIT:
        raise HTTPException(status_code=429, detail=f"You've reached today's limit of {DAILY_LIMIT} try-ons. Please try again tomorrow.")
    _usage[user_id] = (day, count + 1)


def _refund(user_id: int) -> None:
    day, count = _usage.get(user_id, ("", 0))
    if count > 0:
        _usage[user_id] = (day, count - 1)


# ----------------------------------------------------------------- prompts --
def build_prompt(description: str) -> str:
    return (
        "Edit this photo of a person. Keep the SAME person: the same face, hair, body shape, "
        "skin tone, pose and background. Change ONLY their clothing so they are wearing this outfit: "
        f"{description}\n"
        "Make it photorealistic, with a natural fit and the full outfit visible. "
        "Keep it tasteful and fully clothed. Do not change the face or body."
    )


# ------------------------------------------------------ Cloudflare provider --
def prepare_input_image(image_bytes: bytes) -> tuple[bytes, int, int]:
    """Shrink + normalise the photo for Cloudflare. Returns (jpeg_bytes, out_width, out_height)."""
    from PIL import Image, ImageOps, UnidentifiedImageError

    try:
        with Image.open(io.BytesIO(image_bytes)) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            w, h = im.size
            im.thumbnail((CF_INPUT_MAX_SIDE, CF_INPUT_MAX_SIDE))
            buf = io.BytesIO()
            im.save(buf, format="JPEG", quality=90)
    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(status_code=400, detail="I couldn't read that photo. Please try a different JPG or PNG.")

    if h > w * 1.15:
        out = (768, 1024)      # portrait
    elif w > h * 1.15:
        out = (1024, 768)      # landscape
    else:
        out = (1024, 1024)
    return buf.getvalue(), out[0], out[1]


def _cloudflare_call(jpeg: bytes, width: int, height: int, prompt: str) -> bytes:
    account_id, token = imgsvc._credentials()
    if not account_id or not token:
        raise imgsvc.ImageGenError("not_configured", "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must both be set.")
    base = os.environ.get("CLOUDFLARE_API_BASE", imgsvc.API_BASE).rstrip("/")
    url = f"{base}/accounts/{account_id}/ai/run/{CF_MODEL}"
    # Cloudflare's FLUX.2 models take multipart/form-data (even for a text-only prompt).
    fields = {
        "prompt": (None, prompt),
        "input_image_0": ("photo.jpg", jpeg, "image/jpeg"),
        "width": (None, str(width)),
        "height": (None, str(height)),
    }
    try:
        resp = requests.post(url, headers={"Authorization": f"Bearer {token}"}, files=fields, timeout=CF_TIMEOUT)
    except requests.exceptions.Timeout:
        raise imgsvc.ImageGenError("timeout", "Try-on timed out.")
    except requests.exceptions.RequestException as exc:
        raise imgsvc.ImageGenError("network", f"Could not reach Cloudflare: {type(exc).__name__}.")
    if resp.status_code == 200:
        return imgsvc._parse_success(resp)
    imgsvc._raise_for_status(resp)
    raise imgsvc.ImageGenError("http_error", f"Unexpected HTTP {resp.status_code}.")


_CF_ERRORS = {
    "rate_limited": (429, "Today's free image allowance is used up. It resets at 5:30 AM IST. Please try again then."),
    "auth": (503, "Try-on isn't set up correctly on the server (Cloudflare key problem)."),
    "not_configured": (503, "Try-on isn't configured (missing Cloudflare keys)."),
    "timeout": (504, "The try-on took too long. Please try again."),
    "network": (504, "Couldn't reach the image service. Please try again."),
    "bad_request": (502, "The image service rejected that photo. Try a different, clearer photo."),
}


async def _try_on_cloudflare(image_bytes: bytes, description: str) -> bytes:
    jpeg, w, h = prepare_input_image(image_bytes)
    try:
        return await run_in_threadpool(_cloudflare_call, jpeg, w, h, build_prompt(description))
    except imgsvc.ImageGenError as exc:
        logger.warning("tryon cloudflare error: %s", exc.kind)
        code, msg = _CF_ERRORS.get(exc.kind, (502, "The try-on didn't work this time. Please try again."))
        raise HTTPException(status_code=code, detail=msg)


# --------------------------------------------------------- Gemini provider --
def extract_image(interaction) -> bytes:
    """Pull the returned image out of the Gemini Interactions API response."""
    out = getattr(interaction, "output_image", None)
    data = getattr(out, "data", None) if out is not None else None
    if not data:
        for item in getattr(interaction, "outputs", None) or []:
            if getattr(item, "type", "") == "image" and getattr(item, "data", None):
                data = item.data
                break
    if not data:
        raise HTTPException(status_code=502, detail="The AI didn't return a picture. Try a clearer, well-lit photo or a simpler outfit.")
    try:
        return base64.b64decode(data) if isinstance(data, (str, bytes)) else bytes(data)
    except Exception:
        raise HTTPException(status_code=502, detail="The picture that came back was unreadable. Please try again.")


def _is_billing_problem(exc: Exception) -> bool:
    s = str(exc).lower()
    return any(k in s for k in ("free tier", "billing", "resource_exhausted", "quota", "permission_denied", "not available", "403", "429"))


async def _try_on_gemini(image_bytes: bytes, mime_type: str, description: str) -> bytes:
    from google import genai

    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Try-on isn't configured (missing GEMINI_API_KEY).")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        interaction = await client.aio.interactions.create(
            model=GEMINI_MODEL,
            input=[
                {"type": "text", "text": build_prompt(description)},
                {"type": "image", "data": base64.b64encode(image_bytes).decode("ascii"), "mime_type": mime_type},
            ],
        )
        return extract_image(interaction)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("tryon gemini error: %s", type(exc).__name__)
        if _is_billing_problem(exc):
            raise HTTPException(status_code=402, detail="Gemini try-on needs billing turned on for your Google AI key (image output isn't free).")
        raise HTTPException(status_code=504, detail="The try-on AI is busy right now. Please try again in a moment.")


# ------------------------------------------------------------------ public --
async def try_on(user_id: int, image_bytes: bytes, mime_type: str, description: str) -> str:
    if mime_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Please upload a JPG, PNG or WebP photo.")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The photo was empty.")
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="That photo is too large. Please use one under 6 MB.")
    description = (description or "").strip()[:MAX_DESCRIPTION]
    if not description:
        raise HTTPException(status_code=400, detail="There's no outfit to try on.")

    _check_quota(user_id)
    try:
        if PROVIDER == "gemini":
            png = await _try_on_gemini(image_bytes, mime_type, description)
        else:
            png = await _try_on_cloudflare(image_bytes, description)
    except Exception:
        _refund(user_id)
        raise

    mime = imgsvc._sniff_format(png) or "png"
    return f"data:image/{mime};base64,{base64.b64encode(png).decode('ascii')}"