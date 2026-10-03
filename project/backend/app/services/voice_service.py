import os
import tempfile
import edge_tts
import json
from google import genai
from google.genai import types
from fastapi import HTTPException
from app.config import settings

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
except Exception:
    client = None

async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    """
    Transcribes audio using Gemini 1.5 Flash or Pro.
    """
    if not client:
        return "Mock transcription: Suggest an outfit for a rainy day."
        
    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                "Transcribe the following audio accurately. Return only the transcribed text.",
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
            ]
        )
        return response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Transcription Error: {str(e)}")

async def synthesize_speech(text: str) -> str:
    """
    Synthesizes speech from text using edge-tts and returns a path to the generated MP3 file.
    """
    try:
        voice = "en-US-AriaNeural" # Or GuyNeural, JennyNeural
        communicate = edge_tts.Communicate(text, voice)
        
        # Save to a temporary file
        fd, path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
        
        await communicate.save(path)
        return path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")

async def process_voice_command(text: str, user_id: int, db=None) -> dict:
    """
    Parses intent from the text and delegates to the appropriate logic.
    Returns a dict with 'action', 'data', and 'spoken_response'.

    For "suggest_outfit" and "find_item" intents, this grounds the response
    in the user's real wardrobe instead of letting Gemini freeform a
    plausible-sounding but fabricated answer.
    """
    if not client:
        return {
            "action": "suggest_outfit",
            "data": {},
            "spoken_response": "I would suggest wearing a waterproof jacket and boots."
        }

    prompt = f"""
    You are FitSense AI, a luxury fashion voice assistant. 
    The user said: "{text}"
    
    Determine the intent and extract relevant entities.
    Possible intents: "suggest_outfit", "find_item", "plan_trip", "general_chat".
    
    Return a JSON response with:
    - intent: (string)
    - entities: (dict of extracted info like occasion, weather, item_name, color)
    - spoken_response: (string) A conversational, helpful, and concise response to the user.
    """

    try:
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text)
        intent = data.get("intent", "general_chat")
        entities = data.get("entities", {})
        spoken_response = data.get("spoken_response", "I'm not sure how to help with that.")

        if db is not None and intent == "suggest_outfit":
            spoken_response, entities = await _ground_outfit_suggestion(db, user_id, entities, spoken_response)
        elif db is not None and intent == "find_item":
            spoken_response, entities = _ground_item_search(db, user_id, entities, spoken_response)

        return {
            "action": intent,
            "data": entities,
            "spoken_response": spoken_response,
        }
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Intent Parsing Error: {str(e)}")


async def _ground_outfit_suggestion(db, user_id: int, entities: dict, fallback_response: str):
    """Actually calls the real outfit generator against the user's wardrobe
    instead of letting Gemini improvise an answer with no basis in what the
    user owns."""
    from app.models import WardrobeItem
    from app.services import gemini as ai

    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).all()
    wardrobe = [{"name": i.name, "category": i.category, "color": i.color} for i in items]

    if not wardrobe:
        return "Your wardrobe is empty, so I don't have anything of yours to suggest yet — add a few items first.", entities

    occasion = entities.get("occasion", "Casual")
    weather = entities.get("weather", "Mild")
    mood = entities.get("mood", "Refined")

    result = ai.generate_outfit(mood, occasion, weather, 5000.0, wardrobe)
    item_names = [i.get("name") for i in result.get("items", []) if i.get("name")]

    if item_names:
        spoken = f"From your wardrobe, I'd suggest {', '.join(item_names)}. {result.get('color_harmony', '')}".strip()
    else:
        spoken = fallback_response

    entities["suggested_items"] = item_names
    return spoken, entities


def _ground_item_search(db, user_id: int, entities: dict, fallback_response: str):
    """Actually searches the user's real wardrobe instead of letting Gemini
    guess at what they might own."""
    from app.models import WardrobeItem

    query = (entities.get("item_name") or entities.get("color") or "").lower()
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).all()

    if not query:
        matches = items[:5]
    else:
        matches = [
            i for i in items
            if query in (i.name or "").lower()
            or query in (i.color or "").lower()
            or query in (i.category or "").lower()
        ]

    if not matches:
        spoken = f"I couldn't find anything matching that in your wardrobe."
    else:
        names = [i.name for i in matches[:5]]
        spoken = f"I found {len(matches)} matching item{'s' if len(matches) != 1 else ''}: {', '.join(names)}."

    entities["matched_items"] = [{"id": i.id, "name": i.name} for i in matches[:5]]
    return spoken, entities