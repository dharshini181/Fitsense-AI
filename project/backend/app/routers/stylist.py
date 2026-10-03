"""Stylist router — AI chat concierge."""

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, WardrobeItem
from app.routers.auth import get_current_user
from app.services import gemini as ai
from app.services.recommender import recommender
from app.services import weather_service
from app.services import image_service
from app.rate_limit import limiter

router = APIRouter(prefix="/stylist", tags=["stylist"])


class ChatRequest(BaseModel):
    message: str
    style_preference: str = "Minimalist"
    gender: str = "Unspecified"


@router.post("/chat")
@limiter.limit("20/minute")
def chat(request: Request, body: ChatRequest, current_user: User = Depends(get_current_user)):
    reply = ai.chat_styling(
        body.message,
        body.style_preference,
        body.gender,
        skin_tone=current_user.skin_tone or "",
        body_shape=current_user.body_shape or "",
    )
    return {"reply": reply}


class RecommendRequest(BaseModel):
    weather_temp: int = 22
    occasion: str = "Casual"
    style: str = "Minimalist"
    city: str = ""  # if provided, live weather overrides weather_temp

@router.post("/recommend")
@limiter.limit("20/minute")
async def recommend_outfit(request: Request, body: RecommendRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    wardrobe = [{"id": i.id, "name": i.name, "category": i.category, "color": i.color} for i in items]

    weather_temp = body.weather_temp
    weather_info = None
    if body.city:
        weather_info = await weather_service.get_weather(body.city)
        weather_temp = round(weather_info["temp_c"])

    res = recommender.generate_explainable_recommendation(
        user_id=current_user.id,
        weather_temp=weather_temp,
        occasion=body.occasion,
        user_style=body.style,
        available_items=wardrobe
    )
    if weather_info:
        res["weather"] = weather_info

    res["outfit_image"] = await image_service.generate_outfit_image(
        res.get("outfit", []), body.style, body.occasion
    )
    return res


class VisualizeRequest(BaseModel):
    description: str


@router.post("/visualize")
@limiter.limit("20/minute")
async def visualize_description(request: Request, body: VisualizeRequest, current_user: User = Depends(get_current_user)):
    """Generates an image directly from a styling description the AI already
    wrote (e.g. a chat reply) — used by the chat's "Generate Image" button,
    so the picture actually matches the text instead of coming from an
    unrelated wardrobe-based recommendation."""
    image = await image_service.generate_image_from_description(body.description)
    return {"outfit_image": image}