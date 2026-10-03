import os
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.routers.auth import get_current_user
from app.services import voice_service
from app.rate_limit import limiter

router = APIRouter(prefix="/voice", tags=["voice"])

class VoiceCommandRequest(BaseModel):
    text: str

class TTSRequest(BaseModel):
    text: str

@router.post("/transcribe")
@limiter.limit("20/minute")
async def transcribe(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Takes an audio file and returns the transcribed text."""
    if not file:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    raw = await file.read()
    # Gemini handles webm, mp3, wav, etc. Web browsers usually record in webm or mp4.
    mime_type = file.content_type or "audio/webm"
    
    text = await voice_service.transcribe_audio(raw, mime_type)
    return {"text": text}

@router.post("/command")
@limiter.limit("20/minute")
async def process_command(
    request: Request,
    data: VoiceCommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Processes a text command (transcribed from audio) and returns an action + spoken response."""
    result = await voice_service.process_voice_command(data.text, current_user.id, db)
    return result

@router.post("/synthesize")
@limiter.limit("20/minute")
async def synthesize(
    request: Request,
    data: TTSRequest,
    current_user: User = Depends(get_current_user)
):
    """Takes text and returns an audio file stream of the spoken response."""
    audio_path = await voice_service.synthesize_speech(data.text)
    
    # Return the file as a response, and ideally use background tasks to clean it up.
    # For simplicity, returning FileResponse. 
    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename="response.mp3"
    )
