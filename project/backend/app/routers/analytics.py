"""Analytics router — wardrobe value, color distribution, cost-per-wear."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter
from app.database import get_db
from app.models import WardrobeItem, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/")
def wardrobe_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()

    total_value = sum(i.price for i in items)
    color_dist = Counter(i.color for i in items if i.color)
    category_dist = Counter(i.category for i in items if i.category)
    most_worn = sorted(items, key=lambda i: i.wear_count, reverse=True)[:3]

    cost_per_wear = [
        {"name": i.name, "cost": round(i.price / max(i.wear_count, 1), 2)}
        for i in items
        if i.price
    ]

    return {
        "total_garments": len(items),
        "total_value": total_value,
        "color_distribution": dict(color_dist.most_common(6)),
        "category_distribution": dict(category_dist.most_common(6)),
        "most_worn": [{"name": i.name, "wear_count": i.wear_count} for i in most_worn],
        "cost_per_wear": cost_per_wear[:6],
    }
