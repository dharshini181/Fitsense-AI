from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.models import User, UserPreferences, Outfit
from app.routers.auth import get_current_user
from app.services.learning_engine import get_implicit_preferences

router = APIRouter(prefix="/personalization", tags=["personalization"])

class PreferencesUpdate(BaseModel):
    favorite_colors: Optional[List[str]] = None
    favorite_brands: Optional[List[str]] = None
    favorite_styles: Optional[List[str]] = None
    favorite_fabrics: Optional[List[str]] = None
    favorite_fits: Optional[List[str]] = None
    favorite_occasions: Optional[List[str]] = None

class FeedbackUpdate(BaseModel):
    feedback: str  # 'like', 'dislike', 'favorite', or 'none'

@router.get("/preferences")
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return {
        "favorite_colors": prefs.favorite_colors,
        "favorite_brands": prefs.favorite_brands,
        "favorite_styles": prefs.favorite_styles,
        "favorite_fabrics": prefs.favorite_fabrics,
        "favorite_fits": prefs.favorite_fits,
        "favorite_occasions": prefs.favorite_occasions,
    }

@router.put("/preferences")
def update_preferences(data: PreferencesUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)
    
    if data.favorite_colors is not None:
        prefs.favorite_colors = data.favorite_colors
    if data.favorite_brands is not None:
        prefs.favorite_brands = data.favorite_brands
    if data.favorite_styles is not None:
        prefs.favorite_styles = data.favorite_styles
    if data.favorite_fabrics is not None:
        prefs.favorite_fabrics = data.favorite_fabrics
    if data.favorite_fits is not None:
        prefs.favorite_fits = data.favorite_fits
    if data.favorite_occasions is not None:
        prefs.favorite_occasions = data.favorite_occasions
        
    db.commit()
    db.refresh(prefs)
    return {"msg": "Preferences updated successfully"}

@router.post("/feedback/outfit/{outfit_id}")
def submit_outfit_feedback(outfit_id: int, data: FeedbackUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    outfit = db.query(Outfit).filter(Outfit.id == outfit_id, Outfit.user_id == current_user.id).first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
        
    if data.feedback not in ["like", "dislike", "favorite", "none"]:
        raise HTTPException(status_code=400, detail="Invalid feedback type")
        
    outfit.feedback = data.feedback
    db.commit()
    return {"msg": f"Outfit {outfit_id} marked as {data.feedback}"}

@router.get("/learning-profile")
def get_learning_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_implicit_preferences(db, current_user.id)
