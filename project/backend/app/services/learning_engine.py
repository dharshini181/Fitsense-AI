from sqlalchemy.orm import Session
from app.models import User, Outfit, WardrobeItem, UserPreferences

def get_implicit_preferences(db: Session, user_id: int):
    """
    Analyzes the user's wardrobe, outfits, and feedback to generate implicit preferences.
    """
    # 1. Analyze highly worn items
    frequent_items = db.query(WardrobeItem).filter(
        WardrobeItem.user_id == user_id,
        WardrobeItem.wear_count > 3
    ).all()
    
    # 2. Analyze liked outfits
    liked_outfits = db.query(Outfit).filter(
        Outfit.user_id == user_id,
        Outfit.feedback.in_(["like", "favorite"])
    ).all()
    
    # 3. Analyze disliked outfits
    disliked_outfits = db.query(Outfit).filter(
        Outfit.user_id == user_id,
        Outfit.feedback == "dislike"
    ).all()
    
    implicit_colors = {}
    implicit_styles = {}
    implicit_brands = {}
    
    def score_item(item, weight):
        if item.color:
            implicit_colors[item.color] = implicit_colors.get(item.color, 0) + weight
        if item.brand:
            implicit_brands[item.brand] = implicit_brands.get(item.brand, 0) + weight
            
    # Score frequent items
    for item in frequent_items:
        score_item(item, 1)
        
    # Score items in liked outfits
    for outfit in liked_outfits:
        implicit_styles[outfit.mood] = implicit_styles.get(outfit.mood, 0) + 2
        for item_id in outfit.item_ids:
            item = db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == user_id).first()
            if item:
                score_item(item, 2)
                
    # Penalize items in disliked outfits
    for outfit in disliked_outfits:
        implicit_styles[outfit.mood] = implicit_styles.get(outfit.mood, 0) - 2
        for item_id in outfit.item_ids:
            item = db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == user_id).first()
            if item:
                score_item(item, -1)
                
    return {
        "implicit_colors": sorted(implicit_colors.items(), key=lambda x: x[1], reverse=True)[:5],
        "implicit_brands": sorted(implicit_brands.items(), key=lambda x: x[1], reverse=True)[:5],
        "implicit_styles": sorted(implicit_styles.items(), key=lambda x: x[1], reverse=True)[:5]
    }
