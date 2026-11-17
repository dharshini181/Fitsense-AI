from fastapi import APIRouter, Depends, File, Query, UploadFile

from app.routers.auth import get_current_user
from app.services import tryon_service

router = APIRouter(prefix="/tryon", tags=["tryon"])


@router.post("/run")
async def run(
    file: UploadFile = File(...),
    description: str = Query("", max_length=600),
    current_user=Depends(get_current_user),
):
    """Show the uploaded photo (the user's own) wearing the described outfit."""
    data = await file.read()
    image = await tryon_service.try_on(
        current_user.id, data, (file.content_type or "").lower(), description
    )
    return {"tryon_image": image}