"""Travel packing router."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import Trip, WardrobeItem, User
from app.routers.auth import get_current_user
from app.services import gemini as ai
from app.services import weather_service

router = APIRouter(prefix="/travel", tags=["travel"])


class TripRequest(BaseModel):
    destination: str
    duration_days: int = 3
    activities: str = ""
    weather: str = ""  # optional manual override; auto-fetched from destination if blank


@router.post("/generate")
async def generate_trip(body: TripRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WardrobeItem).filter(WardrobeItem.user_id == current_user.id).all()
    wardrobe = [{"name": i.name} for i in items]

    weather_desc = body.weather
    weather_data = None
    if not weather_desc:
        weather_data = await weather_service.get_weather(body.destination)
        weather_desc = weather_data["description"]

    result = ai.generate_travel_checklist(
        body.destination, body.duration_days, weather_desc, body.activities, wardrobe
    )
    # persist
    trip = Trip(
        user_id=current_user.id,
        destination=body.destination,
        duration_days=body.duration_days,
        weather=weather_desc,
        activities=body.activities,
        packed_items=result.get("items", []),
        outfit_combinations=result.get("combinations", []),
        missing_items=result.get("missing_needs", []),
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    result["trip_id"] = trip.id
    result["weather"] = weather_data or {"description": weather_desc}
    return result


@router.get("/")
def list_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    return {
        "trips": [
            {
                "id": t.id,
                "destination": t.destination,
                "duration_days": t.duration_days,
                "weather": t.weather,
                "packed_items": t.packed_items,
                "outfit_combinations": t.outfit_combinations,
                "missing_items": t.missing_items,
            }
            for t in trips
        ]
    }


class PackItemUpdate(BaseModel):
    item_name: str
    packed: bool


@router.patch("/{trip_id}/pack")
def update_packed_item(
    trip_id: int,
    body: PackItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == current_user.id).first()
    if not trip:
        return {"error": "Trip not found"}
    # Build a new list (not an in-place mutation of the existing one) so
    # SQLAlchemy's change tracking on the JSON column actually detects it.
    updated_items = [
        {**it, "packed": body.packed} if it.get("name") == body.item_name else dict(it)
        for it in (trip.packed_items or [])
    ]
    trip.packed_items = updated_items
    db.commit()
    db.refresh(trip)
    return {"packed_items": trip.packed_items}
