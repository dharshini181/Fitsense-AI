"""
Gemini AI service — wraps google-genai (the current, unified SDK — the same
one ocr_service.py and voice_service.py already use) for all FitSense
intelligence tasks. Falls back to structured simulation responses when the
API key is absent or a call fails.
"""

import json
import re
from typing import Optional
from app.config import settings

try:
    from google import genai
    from google.genai import types

    _client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
except Exception:
    _client = None


def _call(prompt: str, fallback: dict) -> dict:
    if _client is None:
        return fallback
    try:
        response = _client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        text = response.text.strip()
        # Defensive: strip markdown fences if the model adds them anyway.
        text = re.sub(r"```(?:json)?\n?", "", text).strip("`").strip()
        return json.loads(text)
    except Exception as exc:
        print(f"[Gemini] Error: {exc}")
        return fallback


# ── Public service functions ──────────────────────────────────────────────────


def chat_styling(message: str, style: str, gender: str, skin_tone: str = "", body_shape: str = "") -> str:
    """Return a styled AI concierge reply for a user chat message."""
    personalization = ""
    if skin_tone:
        personalization += f'Their skin tone/undertone is "{skin_tone}" — favor colors that flatter this when relevant.\n'
    if body_shape:
        personalization += f'Their body shape is "{body_shape}" — favor silhouettes that flatter this when relevant.\n'

    prompt = f"""
You are a luxury fashion concierge AI named FitSense. The user has a {style} style preference and identifies as {gender}.
{personalization}User message: "{message}"
Reply in 2-3 sentences with specific, editorial, fashion-forward advice.
Return JSON: {{"reply": "..."}}
"""
    result = _call(
        prompt,
        {
            "reply": "As your styling concierge, I suggest pairing your neutral base with a structured statement outer layer to maintain refined visual hierarchy."
        },
    )
    return result.get("reply", "")


def scan_clothing_image(image_b64: Optional[str] = None) -> dict:
    """Classify a clothing item from an image (or return a simulation)."""
    fallback = {
        "category": "Coat",
        "color": "Camel Beige",
        "hex": "#C69C6D",
        "pattern": "Solid",
        "material": "Virgin Wool",
        "brand": "Loro Piana",
        "season": "Winter",
        "confidence_score": 97,
    }
    if not image_b64:
        return fallback

    prompt = """
Analyze this garment image and extract:
- category (e.g. Coat, Shirt, Pants, Shoes, Dress, Blazer, Accessory)
- color (descriptive name)
- hex (closest hex code)
- pattern (Solid, Striped, Plaid, etc.)
- material (best guess)
- brand (if visible, else "Unknown")
- season (Spring/Summer/Autumn/Winter/All-Season)
- confidence_score (0-100)

Return JSON only.
"""
    return _call(prompt, fallback)


def analyze_skin_tone(image_b64: Optional[str] = None) -> dict:
    fallback = {
        "primary_tone": "Soft Autumn (Warm & Muted)",
        "palette_hex": ["#E1D9C1", "#8C6A5C", "#4B5320", "#D6E65C"],
        "best_colors": ["Camel Beige", "Warm Olive", "Rich Ochre", "Cream White"],
        "avoid_colors": ["Electric Blue", "Neon Green", "Vibrant Magenta"],
        "jewelry": "Brushed Antique Gold and Warm Bronze",
        "makeup": "Warm peach tones, terracotta lips, muted bronze eyes",
    }
    if not image_b64:
        return fallback
    prompt = """
Analyze the skin tone in this portrait and return:
- primary_tone (season type)
- palette_hex (list of 4 hex codes that suit this tone)
- best_colors (list of 4 color names)
- avoid_colors (list of 3 color names)
- jewelry recommendation
- makeup recommendation
Return JSON only.
"""
    return _call(prompt, fallback)


def analyze_body_shape(image_b64: Optional[str] = None) -> dict:
    fallback = {
        "detected_shape": "Hourglass",
        "measurements": "Estimated balanced proportions",
        "best_clothing": [
            "Wrap dresses",
            "High-waisted tailored trousers",
            "Fitted trench coats",
        ],
        "avoid_clothing": ["Oversized boxy shirts", "Low-rise cargo pants"],
        "fit_tip": "Always highlight the natural waistline using structured draping or soft belts.",
    }
    if not image_b64:
        return fallback
    prompt = """
From this full-body photo, determine body shape (Rectangle/Pear/Apple/Hourglass/Inverted Triangle) and return:
- detected_shape
- measurements (qualitative description)
- best_clothing (list of 3)
- avoid_clothing (list of 2)
- fit_tip
Return JSON only.
"""
    return _call(prompt, fallback)


def rate_outfit(image_b64: Optional[str] = None) -> dict:
    fallback = {
        "overall_score": 92,
        "color_matching": 95,
        "silhouette_balance": 90,
        "fit_accuracy": 92,
        "styling_score": 90,
        "grading_explanation": "Well-coordinated neutral palette with strong structural silhouette.",
        "improvement_tips": "Add a muted gold accessory to tie in warmth.",
    }
    if not image_b64:
        return fallback
    prompt = """
Rate this outfit photo across these dimensions (0-100 each):
- overall_score
- color_matching
- silhouette_balance
- fit_accuracy
- styling_score
- grading_explanation (1-2 sentences)
- improvement_tips (1 sentence)
Return JSON only.
"""
    return _call(prompt, fallback)


def generate_outfit(
    mood: str, occasion: str, weather: str, budget: float, wardrobe_items: list,
    skin_tone: str = "", body_shape: str = ""
) -> dict:
    names = [i["name"] for i in wardrobe_items[:12]]
    fallback = {
        "title": f"{mood} {occasion} Ensemble",
        "score": 95,
        "fabric_recommendation": "Light silk layers or fine merino wool",
        "items": [
            {"name": n, "category": "Garment", "color": "Neutral"} for n in names[:3]
        ],
        "color_harmony": "Classic neutral palette with editorial contrast.",
        "improvement_tip": "Define silhouette with a structured belt.",
    }
    if not wardrobe_items:
        return fallback
    personalization = ""
    if skin_tone:
        personalization += f'Skin tone / undertone: "{skin_tone}" — favor colors that flatter this.\n'
    if body_shape:
        personalization += f'Body shape: "{body_shape}" — favor silhouettes that flatter this.\n'
    prompt = f"""
From this wardrobe: {names}
Generate an outfit for mood="{mood}", occasion="{occasion}", weather="{weather}", budget=₹{budget}.
{personalization}Return JSON:
{{
  "title": "...",
  "score": 0-100,
  "fabric_recommendation": "...",
  "items": [{{"name":"...","category":"...","color":"..."}}],
  "color_harmony": "...",
  "improvement_tip": "..."
}}
"""
    return _call(prompt, fallback)


def generate_travel_checklist(
    destination: str, duration: int, weather: str, activities: str, wardrobe_items: list
) -> dict:
    names = [i["name"] for i in wardrobe_items]
    fallback = {
        "items": [{"name": n, "packed": False} for n in names[:6]]
        + [{"name": "Travel Umbrella", "packed": False}],
        "combinations": [
            f"Day 1: {names[0] if names else 'Core outfit'} for travel comfort"
        ],
        "missing_needs": ["Rain-resistant boots", "Warm Scarf"],
    }
    if not wardrobe_items:
        return fallback
    prompt = f"""
Create a travel packing list for {destination} ({duration} days), weather: {weather}, activities: {activities}.
Available wardrobe: {names}
Return JSON:
{{
  "items": [{{"name":"...","packed":false}}],
  "combinations": ["..."],
  "missing_needs": ["..."]
}}
"""
    return _call(prompt, fallback)