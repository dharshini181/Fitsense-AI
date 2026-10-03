"""Planner calendar router — schedule outfit events."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models import PlannerEvent, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/planner", tags=["planner"])


class EventCreate(BaseModel):
    event_date: str  # YYYY-MM-DD
    title: str
    outfit_items: List[str] = []


@router.get("/")
def list_events(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(PlannerEvent).filter(PlannerEvent.user_id == current_user.id).all()
    return {"events": [_fmt(e) for e in events]}


@router.post("/")
def create_event(body: EventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ev = PlannerEvent(user_id=current_user.id, **body.dict())
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return _fmt(ev)


@router.delete("/{event_id}")
def delete_event(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ev = db.query(PlannerEvent).filter(PlannerEvent.id == event_id, PlannerEvent.user_id == current_user.id).first()
    if not ev:
        raise HTTPException(404, "Event not found.")
    db.delete(ev)
    db.commit()
    return {"message": "Event removed."}


def _fmt(e: PlannerEvent) -> dict:
    return {
        "id": e.id,
        "event_date": e.event_date,
        "title": e.title,
        "outfit_items": e.outfit_items or [],
    }
