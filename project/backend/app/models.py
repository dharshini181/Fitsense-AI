from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120))
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # user | premium | admin
    gender = Column(String(20), default="Unspecified")
    style_preference = Column(String(60), default="Minimalist")
    body_shape = Column(String(40), default="Rectangle")
    skin_tone = Column(String(60), default="Warm Autumn")
    budget_limit = Column(Float, default=5000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    wardrobe_items = relationship(
        "WardrobeItem", back_populates="owner", cascade="all, delete"
    )
    outfits = relationship("Outfit", back_populates="owner", cascade="all, delete")
    trips = relationship("Trip", back_populates="owner", cascade="all, delete")
    wishlist = relationship(
        "WishlistItem", back_populates="owner", cascade="all, delete"
    )
    planner_events = relationship(
        "PlannerEvent", back_populates="owner", cascade="all, delete"
    )


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200))
    category = Column(String(60))  # Shirt / Pants / Coat / Shoes …
    color = Column(String(60))
    hex_code = Column(String(10))
    pattern = Column(String(60))
    material = Column(String(80))
    brand = Column(String(100))
    season = Column(String(40))
    tags = Column(JSON, default=list)
    image_url = Column(Text)
    wear_count = Column(Integer, default=0)
    price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="wardrobe_items")


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200))
    item_ids = Column(JSON, default=list)  # list of WardrobeItem IDs
    occasion = Column(String(80))
    mood = Column(String(60))
    weather = Column(String(60))
    score = Column(Float, default=0.0)
    ai_explanation = Column(Text)
    feedback = Column(String(20), nullable=True) # like, dislike, favorite, none
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="outfits")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    destination = Column(String(200))
    duration_days = Column(Integer, default=3)
    weather = Column(String(80))
    activities = Column(Text)
    packed_items = Column(JSON, default=list)
    outfit_combinations = Column(JSON, default=list)
    missing_items = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="trips")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(200))
    brand = Column(String(100))
    price = Column(Float, default=0.0)
    match_rate = Column(Integer, default=0)
    duplicate_alert = Column(Boolean, default=False)
    image_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="wishlist")


class PlannerEvent(Base):
    __tablename__ = "planner_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_date = Column(String(20))  # YYYY-MM-DD
    title = Column(String(200))
    outfit_items = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="planner_events")


class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    snapshot_date = Column(String(20))
    wardrobe_value = Column(Float, default=0.0)
    most_worn_category = Column(String(60))
    favorite_color = Column(String(60))
    total_garments = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", backref="analysis_history")


class PurchaseHistory(Base):
    __tablename__ = "purchase_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store = Column(String(200))
    purchase_date = Column(String(20))
    total = Column(Float, default=0.0)
    taxes = Column(Float, default=0.0)
    items = Column(JSON, default=list)  # list of dicts: name, price
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", backref="purchases")


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    favorite_colors = Column(JSON, default=list)
    favorite_brands = Column(JSON, default=list)
    favorite_styles = Column(JSON, default=list)
    favorite_fabrics = Column(JSON, default=list)
    favorite_fits = Column(JSON, default=list)
    favorite_occasions = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", backref="preferences")


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    outfit_id = Column(Integer, ForeignKey("outfits.id"), nullable=True)
    context = Column(String(200)) # e.g. "Morning commute, raining"
    ranking_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", backref="recommendations")
