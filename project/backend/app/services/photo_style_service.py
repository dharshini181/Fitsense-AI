"""
Photo -> outfit suggestions (Gemini vision).

The photo is processed in memory and is NEVER saved or logged.
Fails loudly (HTTP errors) instead of returning fake data.
"""

from __future__ import annotations

import json
import logging

from fastapi import HTTPException
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger("fitsense.photostyle")

MODEL = "gemini-3.6-flash"
MAX_BYTES = 6 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
BODY_SHAPES = ["Rectangle", "Hourglass", "Pear", "Apple", "Inverted Triangle"]

PROMPT = f"""You are a friendly fashion stylist. Look at the person in the photo and suggest
clothes that suit their build and colouring.

Rules:
- Talk ONLY about clothes, fit, silhouette and colour.
- Never comment on attractiveness, weight, health, age, or who the person is.
- If there is no clearly visible person, set "person_visible" to false and leave the rest empty.
- Use simple everyday words.

Return ONLY JSON with exactly these keys:
{{
  "person_visible": true,
  "body_shape": one of {BODY_SHAPES},
  "skin_tone": one of ["Fair","Light","Medium","Olive","Tan","Deep"],
  "undertone": one of ["Warm","Cool","Neutral"],
  "fit_tips": [2-4 short tips about fit and silhouette that flatter this build],
  "colors_to_wear": [4-6 colour names],
  "colors_to_avoid": [2-3 colour names],
  "outfits": [
    {{"title": "short name", "pieces": ["item 1","item 2","item 3"], "why": "one short sentence"}}
  ]   // exactly 4 outfits
}}"""


def _str_list(value, limit: int) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(v).strip() for v in value if str(v).strip()][:limit]


def normalize(raw: object) -> dict:
    """Make the model's JSON safe and predictable for the frontend."""
    if not isinstance(raw, dict):
        raise HTTPException(status_code=502, detail="The styling AI returned an unexpected answer. Please try again.")

    if raw.get("person_visible") is False:
        raise HTTPException(status_code=422, detail="I couldn't see a person clearly in that photo. Try a well-lit, full-body photo.")

    body = str(raw.get("body_shape", "")).strip()
    if body not in BODY_SHAPES:
        body = ""

    outfits = []
    for o in (raw.get("outfits") or [])[:5]:
        if not isinstance(o, dict):
            continue
        pieces = _str_list(o.get("pieces"), 6)
        if not pieces:
            continue
        outfits.append({
            "title": str(o.get("title", "Outfit")).strip()[:60] or "Outfit",
            "pieces": pieces,
            "why": str(o.get("why", "")).strip()[:200],
        })
    if not outfits:
        raise HTTPException(status_code=502, detail="No outfit ideas came back. Please try again.")

    return {
        "body_shape": body,
        "skin_tone": str(raw.get("skin_tone", "")).strip()[:30],
        "undertone": str(raw.get("undertone", "")).strip()[:30],
        "fit_tips": _str_list(raw.get("fit_tips"), 4),
        "colors_to_wear": _str_list(raw.get("colors_to_wear"), 6),
        "colors_to_avoid": _str_list(raw.get("colors_to_avoid"), 3),
        "outfits": outfits,
    }


async def suggest_from_photo(image_bytes: bytes, mime_type: str, occasion: str = "") -> dict:
    if mime_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Please upload a JPG, PNG or WebP photo.")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The photo was empty.")
    if len(image_bytes) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="That photo is too large. Please use one under 6 MB.")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Photo styling isn't configured (missing GEMINI_API_KEY).")

    prompt = PROMPT
    occasion = (occasion or "").strip()[:40]
    if occasion:
        prompt += f"\n\nThe outfits should suit this occasion: {occasion}."

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = await client.aio.models.generate_content(
            model=MODEL,
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        raw = json.loads(response.text)
    except HTTPException:
        raise
    except (json.JSONDecodeError, TypeError, ValueError):
        raise HTTPException(status_code=502, detail="The styling AI returned an unreadable answer. Please try again.")
    except Exception as exc:  # network / quota / model errors — never log the image
        logger.warning("photo-style Gemini error: %s", type(exc).__name__)
        raise HTTPException(status_code=504, detail="The styling AI is busy right now. Please try again in a moment.")

    return normalize(raw)