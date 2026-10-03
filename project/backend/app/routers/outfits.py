"""Outfits router — AI outfit generator + CRUD saved outfits."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models import Outfit, WardrobeItem, User
from app.routers.auth import get_current_user
from app.services import gemini as ai
from app.services import weather_service
from app.services import image_service
from app.rate_limit import limiter

router = APIRouter(prefix="/outfits", tags=["outfits"])

class GenerateRequest(BaseModel):
    mood: str = "Refined"
    occasion: str = "Formal"
    weather: str = "Cool Autumn"
    budget: float = 5000.0
    city: str = ""  # if provided, weather is fetched live and overrides `weather`


class OutfitSave(BaseModel):
    name: str
    item_ids: List[int] = []
    occasion: str = ""
    mood: str = ""
    weather: str = ""
    score: float = 0.0
    ai_explanation: str = ""


@router.get("/weather")
async def get_weather(city: str):
    """Fetch live weather for a city (used to auto-fill outfit generation)."""
    return await weather_service.get_weather(city)


@router.post("/generate")
@limiter.limit("20/minute")
async def generate_outfit(request: Request, body: GenerateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    wardrobe = [
        {"name": i.name, "category": i.category, "color": i.color} for i in items
    ]

    weather_desc = body.weather
    if body.city:
        weather_data = await weather_service.get_weather(body.city)
        weather_desc = weather_data["description"]

    result = ai.generate_outfit(
        body.mood, body.occasion, weather_desc, body.budget, wardrobe,
        skin_tone=current_user.skin_tone, body_shape=current_user.body_shape,
    )

    # Auto-visualize — no extra input needed from the user.
    item_names = [i.get("name", "") for i in result.get("items", [])]
    result["outfit_image"] = await image_service.generate_outfit_image(
        item_names, body.mood, body.occasion
    )
    return result


@router.post("/save")
def save_outfit(body: OutfitSave, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    outfit = Outfit(user_id=current_user.id, **body.dict())
    db.add(outfit)
    db.commit()
    db.refresh(outfit)
    return {"id": outfit.id, "message": "Outfit saved."}


@router.get("/")
def list_outfits(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    outfits = db.query(Outfit).filter(Outfit.user_id == current_user.id).all()
    return {
        "outfits": [
            {"id": o.id, "name": o.name, "occasion": o.occasion, "score": o.score}
            for o in outfits
        ]
    }
