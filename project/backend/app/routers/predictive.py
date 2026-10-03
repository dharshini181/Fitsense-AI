from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.predictive_analytics import predictive_engine
from app.routers.auth import get_current_user
from app.models import User, WardrobeItem

router = APIRouter(prefix="/predict", tags=["predictive"])

class LifespanRequest(BaseModel):
    item_category: str
    wash_count: int
    fabric: str

class SustainabilityItem(BaseModel):
    fabric_estimation: str

class SustainabilityRequest(BaseModel):
    items: List[SustainabilityItem]

@router.post("/lifespan")
def predict_lifespan(body: LifespanRequest, current_user: User = Depends(get_current_user)):
    return predictive_engine.predict_clothing_lifespan(
        item_category=body.item_category,
        wash_count=body.wash_count,
        fabric=body.fabric
    )

@router.post("/sustainability")
def calculate_sustainability(body: SustainabilityRequest, current_user: User = Depends(get_current_user)):
    items = [{"fabric_estimation": item.fabric_estimation} for item in body.items]
    return predictive_engine.calculate_sustainability_score(items)

def _estimate_fabric_category(material: str) -> str:
    """Maps a wardrobe item's free-text material field to the coarse
    categories predictive_analytics.py has carbon baselines for."""
    if not material:
        return "Unknown"
    m = material.lower()
    if "wool" in m or "cashmere" in m:
        return "Wool/Cashmere"
    if "cotton" in m:
        return "Cotton"
    if "silk" in m:
        return "Silk"
    if "polyester" in m or "nylon" in m or "acrylic" in m or "synthetic" in m:
        return "Polyester"
    return "Unknown"


@router.get("/sustainability/me")
def calculate_my_sustainability(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wardrobe = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    items = [{"fabric_estimation": _estimate_fabric_category(item.material)} for item in wardrobe]
    return predictive_engine.calculate_sustainability_score(items)

@router.get("/trends")
def get_trends(current_user: User = Depends(get_current_user)):
    return predictive_engine.predict_trends(datetime.now())

@router.get("/model-metrics")
def get_model_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Note: typically restricted to admin
    return predictive_engine.evaluate_model_performance(db)
@router.get("/cost-per-wear")
def get_cost_per_wear(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    results = []
    for item in items:
        cpw = item.price / (item.wear_count if item.wear_count > 0 else 1)
        results.append({
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "wear_count": item.wear_count,
            "cost_per_wear": round(cpw, 2)
        })
    results.sort(key=lambda x: x["cost_per_wear"])
    return results

@router.get("/next-outfit")
def predict_next_outfit(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.services.recommendation_ranking import adaptive_rank_outfits

    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    if not items:
        return []

    # Build real candidate outfits from the user's own wardrobe, grouped
    # loosely by category so each candidate is at least a plausible pairing,
    # instead of hardcoded mock items unrelated to the user's closet.
    tops = [i for i in items if i.category and i.category.lower() in ("shirt", "top", "blouse", "sweater", "tee")]
    bottoms = [i for i in items if i.category and i.category.lower() in ("pants", "trousers", "skirt", "jeans", "shorts")]
    others = [i for i in items if i not in tops and i not in bottoms]

    candidates = []
    pairs = list(zip(tops, bottoms)) or [(i,) for i in items[:5]]
    for idx, pair in enumerate(pairs[:5]):
        candidate_items = list(pair)
        used_ids = {i.id for i in candidate_items}
        if idx < len(others) and others[idx].id not in used_ids:
            candidate_items.append(others[idx])
        candidates.append({
            "id": f"candidate_{idx}",
            "mood": current_user.style_preference or "Casual",
            "items": [{"id": i.id, "name": i.name} for i in candidate_items],
        })

    ranked = adaptive_rank_outfits(db, current_user.id, candidates)
    return ranked
