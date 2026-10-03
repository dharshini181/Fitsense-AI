import httpx
from fastapi import HTTPException
from google import genai
from google.genai import types
from app.config import settings

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
except Exception:
    client = None

async def analyze_clothing(image_bytes: bytes, mime_type: str) -> dict:
    if not client:
        # Mock response for testing or missing API key
        return {
            "clothing_type": "Jacket",
            "detected_colors": ["Black", "Silver"],
            "pattern": "Solid",
            "fabric": "Leather",
            "style": "Edgy",
            "confidence": 0.85
        }
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                "Analyze this clothing item. Return JSON with clothing_type, detected_colors (list), pattern, fabric, style, and confidence (0.0 to 1.0).",
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Gemini API Error: {str(e)}")

async def rate_outfit(image_bytes: bytes, mime_type: str) -> dict:
    fallback = {
        "overall_score": 92,
        "color_matching": 95,
        "silhouette_balance": 90,
        "fit_accuracy": 92,
        "styling_score": 90,
        "grading_explanation": "Well-coordinated neutral palette with strong structural silhouette.",
        "improvement_tips": "Add a muted gold accessory to tie in warmth.",
    }
    if not client:
        return fallback
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                "Rate this outfit photo across these dimensions (integers 0-100): "
                "overall_score, color_matching, silhouette_balance, fit_accuracy, styling_score. "
                "Also include grading_explanation (1-2 sentences) and improvement_tips (1 sentence). "
                "Return JSON only with exactly those keys.",
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Gemini API Error: {str(e)}")


async def analyze_person(image_bytes: bytes, mime_type: str) -> dict:
    if not client:
        return {
            "body_shape": "Hourglass",
            "undertone": "Warm",
            "skin_tone": "Medium",
            "recommended_color_palette": ["Olive", "Mustard", "Burgundy"],
            "confidence": 0.88
        }
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                "Analyze this person for fashion styling. Return JSON with body_shape, undertone, skin_tone, recommended_color_palette (list), and confidence (0.0 to 1.0).",
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        import json
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Gemini API Error: {str(e)}")