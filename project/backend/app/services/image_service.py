"""
Outfit visualization service — turns either a structured outfit (items list)
or a freeform styling description into a realistic image via Hugging Face's
Inference Providers router.

Design goals:
- Zero extra input from the user beyond what's already been generated.
- Fails soft: if no HF key is configured, or the call errors/times out, we
  return None rather than raising, so callers can render the rest of the
  response without the picture.

Note: Hugging Face fully retired api-inference.huggingface.co in favor of
router.huggingface.co. FLUX.1-schnell specifically is served through the
fal-ai provider on that router (not the "hf-inference" provider — that
returns 410 Gone for this model), which also means the request/response
shape follows fal.ai's own API: {"prompt": ...} in, {"images": [...]} out
(a URL to fetch, not raw image bytes directly).
"""

import base64
import httpx
from app.config import settings

_HF_URL = "https://router.huggingface.co/fal-ai/fal-ai/flux/schnell"


async def _call_hf(prompt: str) -> str | None:
    if not settings.HUGGINGFACE_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                _HF_URL,
                headers={"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"},
                json={"prompt": prompt},
            )
            if resp.status_code == 503:
                return None
            resp.raise_for_status()

            data = resp.json()
            images = data.get("images") or []
            if not images or not images[0].get("url"):
                return None
            image_url = images[0]["url"]

            img_resp = await client.get(image_url)
            img_resp.raise_for_status()
            content_type = img_resp.headers.get("content-type", "image/png")
            b64 = base64.b64encode(img_resp.content).decode("utf-8")
            return f"data:{content_type};base64,{b64}"
    except Exception as exc:
        print(f"[ImageGen] Error generating outfit image: {exc}")
        return None


async def generate_outfit_image(items: list[str], style: str = "Minimalist", occasion: str = "Casual") -> str | None:
    """Structured version — builds a prompt from a plain list of item names
    (used by the wardrobe-based /stylist/recommend flow)."""
    item_list = ", ".join(items) if items else "a stylish outfit"
    prompt = (
        f"Professional fashion photography, full-body shot of a model wearing "
        f"{item_list}. {style} style, dressed for a {occasion.lower()} occasion. "
        f"Studio lighting, neutral background, high detail, editorial fashion magazine quality."
    )
    return await _call_hf(prompt)


async def generate_image_from_description(description: str) -> str | None:
    """Freeform version — builds the image directly from a styling
    description the AI already wrote (e.g. a chat reply), so what you see
    actually matches what you just read instead of coming from an
    unrelated, separately-generated outfit."""
    prompt = (
        f"Professional fashion photography, full-body editorial shot of a model. "
        f"{description} "
        f"Studio lighting, neutral background, high detail, fashion magazine quality."
    )
    return await _call_hf(prompt)