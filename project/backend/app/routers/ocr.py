import os
import uuid
import tempfile
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PurchaseHistory, WardrobeItem
from app.routers.auth import get_current_user
from app.services import ocr_service
from app.rate_limit import limiter

router = APIRouter(prefix="/ocr", tags=["ocr"])

ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

async def validate_upload(file: UploadFile):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=415, detail="Unsupported media type. Use JPG, PNG, or WEBP.")
    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")
    return raw, file.content_type

@router.post("/label")
@limiter.limit("20/minute")
async def scan_label(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    raw, mime_type = await validate_upload(file)
    result = await ocr_service.scan_clothing_label(raw, mime_type)
    return result

@router.post("/receipt")
@limiter.limit("20/minute")
async def scan_receipt(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    raw, mime_type = await validate_upload(file)
    result = await ocr_service.scan_receipt(raw, mime_type)
    
    # Save receipt to purchase history
    purchase = PurchaseHistory(
        user_id=current_user.id,
        store=result.get("store"),
        purchase_date=result.get("date"),
        total=result.get("total", 0.0),
        taxes=result.get("taxes", 0.0),
        items=result.get("purchased_items", [])
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    
    return {"purchase_id": purchase.id, "extracted_data": result}

@router.post("/auto-fill")
def auto_fill_wardrobe(
    item_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accepts OCR data (like brand, material, price) and creates a WardrobeItem.
    """
    # Simple duplicate detection based on brand and category
    brand = item_data.get("brand")
    category = item_data.get("category", "Uncategorized")
    
    duplicate = db.query(WardrobeItem).filter(
        WardrobeItem.user_id == current_user.id,
        WardrobeItem.brand == brand,
        WardrobeItem.category == category
    ).first()
    
    if duplicate:
        # Returning 202 to indicate a potential duplicate was found, but proceeding is optional
        return {"msg": "Potential duplicate detected", "duplicate_id": duplicate.id}
    
    new_item = WardrobeItem(
        user_id=current_user.id,
        name=item_data.get("name", "Auto-filled Item"),
        category=category,
        brand=brand,
        material=item_data.get("fabric_composition"),
        price=item_data.get("price", 0.0),
        tags=[item_data.get("care_instructions")] if item_data.get("care_instructions") else []
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {"msg": "Item added to wardrobe", "item": new_item}
