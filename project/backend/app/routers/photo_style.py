from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.routers.auth import get_current_user
from app.services import photo_style_service

router = APIRouter(prefix="/photo-style", tags=["photo-style"])


@router.post("/suggest")
async def suggest(
    file: UploadFile = File(...),
    occasion: str = Form(""),
    current_user=Depends(get_current_user),
):
    """Upload a photo of yourself -> outfit ideas that suit your build and colouring.
    The photo is analysed in memory and not stored."""
    data = await file.read()
    return await photo_style_service.suggest_from_photo(
        data, (file.content_type or "").lower(), occasion
    )