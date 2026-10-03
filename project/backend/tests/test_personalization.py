import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user
from app.database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker

def override_get_current_user():
    from app.models import User
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def test_get_preferences():
    response = client.get("/api/personalization/preferences")
    assert response.status_code == 200
    data = response.json()
    assert "favorite_colors" in data

def test_update_preferences():
    payload = {
        "favorite_colors": ["Black", "Blue"],
        "favorite_brands": ["Nike"]
    }
    response = client.put("/api/personalization/preferences", json=payload)
    assert response.status_code == 200
    
    # Verify update
    response = client.get("/api/personalization/preferences")
    data = response.json()
    assert "Black" in data["favorite_colors"]
    assert "Nike" in data["favorite_brands"]

def test_get_learning_profile():
    response = client.get("/api/personalization/learning-profile")
    assert response.status_code == 200
    data = response.json()
    assert "implicit_colors" in data
    assert "implicit_brands" in data
    assert "implicit_styles" in data

def test_predict_cost_per_wear():
    response = client.get("/api/predict/cost-per-wear")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_predict_next_outfit():
    response = client.get("/api/predict/next-outfit")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "ranking_score" in data[0]
