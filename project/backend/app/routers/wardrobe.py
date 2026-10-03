"""Wardrobe router — CRUD + natural-language search."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import WardrobeItem, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])


# ── Schemas ───────────────────────────────────────────────────────────────────


class ItemCreate(BaseModel):
    name: str
    category: str = "Other"
    color: str = "Unknown"
    hex_code: str = "#888888"
    pattern: str = "Solid"
    material: str = "Unknown"
    brand: str = "Unknown"
    season: str = "All-Season"
    tags: List[str] = []
    image_url: str = ""
    price: float = 0.0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    material: Optional[str] = None
    brand: Optional[str] = None
    season: Optional[str] = None
    tags: Optional[List[str]] = None
    price: Optional[float] = None


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get("/")
def list_wardrobe(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    return {"items": [_fmt(i) for i in items]}


@router.get("/search")
def search_wardrobe(q: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Natural-language search — matches color, category, brand, material."""
    q_lower = q.lower()
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    results = [
        i
        for i in items
        if (
            q_lower in (i.color or "").lower()
            or q_lower in (i.category or "").lower()
            or q_lower in (i.brand or "").lower()
            or q_lower in (i.material or "").lower()
            or q_lower in (i.name or "").lower()
        )
    ]
    return {"items": [_fmt(i) for i in results]}


@router.post("/")
def create_item(body: ItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = WardrobeItem(user_id=current_user.id, **body.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _fmt(item)


@router.patch("/{item_id}")
def update_item(item_id: int, body: ItemUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(404, "Item not found.")
    for k, v in body.dict(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    return _fmt(item)


@router.delete("/{item_id}")
def delete_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(404, "Item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Deleted."}


# ── Helper ────────────────────────────────────────────────────────────────────


def _fmt(i: WardrobeItem) -> dict:
    return {
        "id": i.id,
        "name": i.name,
        "category": i.category,
        "color": i.color,
        "hex_code": i.hex_code,
        "pattern": i.pattern,
        "material": i.material,
        "brand": i.brand,
        "season": i.season,
        "tags": i.tags or [],
        "image_url": i.image_url,
        "wear_count": i.wear_count,
        "price": i.price,
        "created_at": str(i.created_at),
    }
