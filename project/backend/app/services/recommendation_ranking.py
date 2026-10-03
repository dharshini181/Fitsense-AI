from sqlalchemy.orm import Session
from app.models import UserPreferences, WardrobeItem, Outfit
from app.services.learning_engine import get_implicit_preferences

def adaptive_rank_outfits(db: Session, user_id: int, raw_outfits: list):
    """
    Takes a list of raw outfit suggestions and re-ranks them based on implicit and explicit preferences.
    """
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    implicit_prefs = get_implicit_preferences(db, user_id)
    
    explicit_colors = [c.lower() for c in prefs.favorite_colors] if prefs and prefs.favorite_colors else []
    explicit_brands = [b.lower() for b in prefs.favorite_brands] if prefs and prefs.favorite_brands else []
    
    implicit_colors = [c[0].lower() for c in implicit_prefs["implicit_colors"]]
    implicit_brands = [b[0].lower() for b in implicit_prefs["implicit_brands"]]
    
    for outfit in raw_outfits:
        ranking_score = outfit.get("score", 5.0)  # Base score
        
        # We need to boost score based on item characteristics
        items = outfit.get("items", [])
        for item_data in items:
            # We assume item_data contains 'id', fetch the item
            item_id = item_data.get("id")
            if not item_id:
                continue
                
            item = db.query(WardrobeItem).filter(
                WardrobeItem.id == item_id, WardrobeItem.user_id == user_id
            ).first()
            if not item:
                continue

            # Boost for explicit preferences
            if item.color and item.color.lower() in explicit_colors:
                ranking_score += 1.5
            if item.brand and item.brand.lower() in explicit_brands:
                ranking_score += 1.5
                
            # Boost for implicit preferences
            if item.color and item.color.lower() in implicit_colors:
                ranking_score += 0.5
            if item.brand and item.brand.lower() in implicit_brands:
                ranking_score += 0.5
                
            # Penalize over-worn items if we want variation (or boost if they are favorites)
            # We will penalize very highly worn items slightly to encourage rotation
            if item.wear_count > 10:
                ranking_score -= 0.5
                
        outfit["ranking_score"] = min(10.0, max(0.0, ranking_score)) # Clamp 0 to 10
        
    # Sort outfits by ranking_score descending
    raw_outfits.sort(key=lambda x: x.get("ranking_score", 0), reverse=True)
    return raw_outfits
