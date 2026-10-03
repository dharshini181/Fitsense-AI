import json
from fastapi import HTTPException
from google import genai
from google.genai import types
from app.config import settings

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY) if settings.GEMINI_API_KEY else None
except Exception:
    client = None

async def scan_clothing_label(image_bytes: bytes, mime_type: str) -> dict:
    if not client:
        # Mock response for testing or missing API key
        return {
            "brand": "Acme Co",
            "size": "M",
            "fabric_composition": "100% Cotton",
            "care_instructions": "Machine wash cold. Tumble dry low.",
            "washing_symbols": ["wash-cold", "tumble-dry-low"],
            "country_of_origin": "USA",
            "product_code": "123456"
        }
    try:
        prompt = """
        Analyze this clothing label image. Extract the following information and return it as JSON:
        - brand
        - size
        - fabric_composition
        - care_instructions
        - washing_symbols (list of inferred symbols like 'wash-cold', 'do-not-bleach')
        - country_of_origin
        - product_code
        If any information is missing, return null for that field.
        """
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Gemini API Error: {str(e)}")

async def scan_receipt(image_bytes: bytes, mime_type: str) -> dict:
    if not client:
        return {
            "store": "Fashion Outlet",
            "date": "2023-10-15",
            "purchased_items": [
                {"name": "Blue Denim Jacket", "price": 45.99},
                {"name": "White T-Shirt", "price": 12.50}
            ],
            "total": 58.49,
            "taxes": 4.50,
            "warranty": "30-day return policy"
        }
    try:
        prompt = """
        Analyze this shopping receipt image. Extract the following information and return it as JSON:
        - store
        - date (YYYY-MM-DD format if possible)
        - purchased_items (list of objects with 'name' and 'price' as float)
        - total (float)
        - taxes (float)
        - warranty (any text about returns or warranty)
        If any information is missing, return null for that field.
        """
        response = await client.aio.models.generate_content(
            model='gemini-3.6-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=504, detail=f"Gemini API Error: {str(e)}")