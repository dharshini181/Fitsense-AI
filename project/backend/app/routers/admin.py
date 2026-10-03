"""Admin router — platform-wide usage, engagement, and ML performance stats.
All endpoints require an authenticated user with role == "admin".
"""

from collections import Counter
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, WardrobeItem, Outfit, Trip, PlannerEvent
from app.routers.auth import require_admin
from app.services.predictive_analytics import predictive_engine

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    role_counts = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )

    total_wardrobe_items = db.query(func.count(WardrobeItem.id)).scalar() or 0
    total_outfits = db.query(func.count(Outfit.id)).scalar() or 0
    total_trips = db.query(func.count(Trip.id)).scalar() or 0
    total_planner_events = db.query(func.count(PlannerEvent.id)).scalar() or 0

    since = datetime.utcnow() - timedelta(days=30)
    new_users_30d = (
        db.query(func.count(User.id)).filter(User.created_at >= since).scalar() or 0
    )

    style_counts = Counter(
        s for (s,) in db.query(User.style_preference).all() if s
    )

    feedback_counts = Counter(
        f for (f,) in db.query(Outfit.feedback).all() if f
    )

    return {
        "total_users": total_users,
        "new_users_30d": new_users_30d,
        "role_distribution": role_counts,
        "total_wardrobe_items": total_wardrobe_items,
        "total_outfits_generated": total_outfits,
        "total_trips_planned": total_trips,
        "total_planner_events": total_planner_events,
        "style_preference_distribution": dict(style_counts.most_common(8)),
        "outfit_feedback_distribution": dict(feedback_counts),
    }


@router.get("/signups-timeseries")
def signups_timeseries(
    days: int = 30,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    since = datetime.utcnow() - timedelta(days=days)
    rows = db.query(User.created_at).filter(User.created_at >= since).all()

    by_day = Counter(created_at.date().isoformat() for (created_at,) in rows if created_at)
    # build a dense series so the chart doesn't have gaps
    series = []
    for i in range(days, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date().isoformat()
        series.append({"date": day, "signups": by_day.get(day, 0)})

    return {"days": days, "series": series}


@router.get("/top-users")
def top_users(
    limit: int = 5,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    rows = (
        db.query(
            User.id,
            User.name,
            User.email,
            func.count(WardrobeItem.id).label("item_count"),
        )
        .outerjoin(WardrobeItem, WardrobeItem.user_id == User.id)
        .group_by(User.id)
        .order_by(func.count(WardrobeItem.id).desc())
        .limit(limit)
        .all()
    )
    return [
        {"id": r.id, "name": r.name, "email": r.email, "wardrobe_items": r.item_count}
        for r in rows
    ]


@router.get("/model-metrics")
def model_metrics(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return predictive_engine.evaluate_model_performance(db)


@router.get("/trends")
def trends(_admin: User = Depends(require_admin)):
    return {"trends": predictive_engine.predict_trends(datetime.now())}
