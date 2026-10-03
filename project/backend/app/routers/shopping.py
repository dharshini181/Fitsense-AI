"""Shopping wishlist router — add items, budget tracking, duplicate detection."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import WishlistItem, WardrobeItem, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/shopping", tags=["shopping"])


class WishlistCreate(BaseModel):
    name: str
    brand: str = "Unknown"
    price: float = 0.0
    image_url: str = ""


@router.get("/wishlist")
def list_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WishlistItem).filter(WishlistItem.user_id == current_user.id).all()
    return {"items": [_fmt(i) for i in items]}


@router.post("/wishlist")
def add_wishlist(body: WishlistCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check duplicate by matching name/brand against existing wardrobe
    wardrobe = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    is_dup = any(
        body.brand.lower() == (w.brand or "").lower()
        and body.name.lower() in (w.name or "").lower()
        for w in wardrobe
    )
    item = WishlistItem(
        user_id=current_user.id,
        name=body.name,
        brand=body.brand,
        price=body.price,
        match_rate=85 + (10 if not is_dup else 0),
        duplicate_alert=is_dup,
        image_url=body.image_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _fmt(item)


@router.delete("/wishlist/{item_id}")
def delete_wishlist(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id, WishlistItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(404, "Item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Removed from wishlist."}


def _fmt(i: WishlistItem) -> dict:
    return {
        "id": i.id,
        "name": i.name,
        "brand": i.brand,
        "price": i.price,
        "match_rate": i.match_rate,
        "duplicate_alert": i.duplicate_alert,
        "image_url": i.image_url,
    }
