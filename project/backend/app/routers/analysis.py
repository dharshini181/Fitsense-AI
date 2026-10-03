"""Analysis router — secure upload, computer vision pipelines, and gemini integration."""

import os
import uuid
import tempfile
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AnalysisHistory
from app.routers.auth import get_current_user
from app.services import gemini_vision
from app.rate_limit import limiter

router = APIRouter(prefix="/analysis", tags=["analysis"])

ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

async def validate_and_save_temp(file: UploadFile) -> str:
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=415, detail="Unsupported media type. Use JPG, PNG, or WEBP.")
    
    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
    
    # Save temp file
    ext = os.path.splitext(file.filename or "upload.jpg")[1]
    tmp_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}{ext}")
    with open(tmp_path, "wb") as f:
        f.write(raw)
        
    return tmp_path, raw, file.content_type

def record_history(db: Session, user_id: int, image_path: str, result: dict):
    history = AnalysisHistory(user_id=user_id, image_path=image_path, result=result)
    db.add(history)
    db.commit()

@limiter.limit("20/minute")
@router.post("/scan")
async def scan_clothing(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tmp_path, raw, mime_type = await validate_and_save_temp(file)
    try:
        result = await gemini_vision.analyze_clothing(raw, mime_type)
        record_history(db, current_user.id, tmp_path, {"type": "scan", "data": result})
        return result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@limiter.limit("20/minute")
@router.post("/body")
async def analyze_body(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tmp_path, raw, mime_type = await validate_and_save_temp(file)
    try:
        result = await gemini_vision.analyze_person(raw, mime_type)
        # Filter for body shape
        body_result = {
            "body_shape": result.get("body_shape", "Unknown"),
            "confidence": result.get("confidence", 0.5),
            "measurements": result.get("measurements", None)
        }
        # Persist to the user's profile so outfit generation actually uses it,
        # rather than the scan result being shown once and discarded.
        if body_result["body_shape"] and body_result["body_shape"] != "Unknown":
            current_user.body_shape = body_result["body_shape"]
            db.commit()
        record_history(db, current_user.id, tmp_path, {"type": "body", "data": body_result})
        return body_result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@limiter.limit("20/minute")
@router.post("/skin-tone")
async def analyze_skin_tone(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tmp_path, raw, mime_type = await validate_and_save_temp(file)
    try:
        result = await gemini_vision.analyze_person(raw, mime_type)
        # Filter for skin tone
        skin_result = {
            "undertone": result.get("undertone", "Unknown"),
            "skin_tone": result.get("skin_tone", "Unknown"),
            "recommended_color_palette": result.get("recommended_color_palette", []),
            "confidence": result.get("confidence", 0.5)
        }
        # Persist to the user's profile — same reasoning as body shape above.
        if skin_result["skin_tone"] and skin_result["skin_tone"] != "Unknown":
            current_user.skin_tone = skin_result["skin_tone"]
            db.commit()
        record_history(db, current_user.id, tmp_path, {"type": "skin-tone", "data": skin_result})
        return skin_result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@limiter.limit("20/minute")
@router.post("/rate")
async def rate_outfit(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tmp_path, raw, mime_type = await validate_and_save_temp(file)
    try:
        result = await gemini_vision.rate_outfit(raw, mime_type)
        record_history(db, current_user.id, tmp_path, {"type": "rate", "data": result})
        return result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@limiter.limit("20/minute")
@router.post("/full")
async def analyze_full(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tmp_path, raw, mime_type = await validate_and_save_temp(file)
    try:
        clothing_result = await gemini_vision.analyze_clothing(raw, mime_type)
        person_result = await gemini_vision.analyze_person(raw, mime_type)
        
        full_result = {
            "clothing": clothing_result,
            "person": person_result
        }
        record_history(db, current_user.id, tmp_path, {"type": "full", "data": full_result})
        return full_result
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
