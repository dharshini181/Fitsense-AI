import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user

def override_get_current_user():
    from app.models import User
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_stylist_chat():
    response = client.post(
        "/api/stylist/chat",
        json={"message": "What should I wear for a summer wedding?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data

def test_stylist_recommend():
    response = client.post(
        "/api/stylist/recommend",
        json={"weather_temp": 30, "occasion": "Wedding", "style": "Expressive"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "outfit" in data
    assert "explainability_log" in data

def test_outfits_generate():
    response = client.post(
        "/api/outfits/generate",
        json={"mood": "Refined", "occasion": "Formal", "weather": "Cool Autumn", "budget": 1000}
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "score" in data

def test_outfits_save_and_list():
    save_response = client.post(
        "/api/outfits/save",
        json={
            "user_id": 1,
            "name": "Test Outfit",
            "item_ids": [1, 2],
            "occasion": "Test",
            "mood": "Test",
            "weather": "Test",
            "score": 90.0,
            "ai_explanation": "Test"
        }
    )
    assert save_response.status_code == 200
    
    list_response = client.get("/api/outfits/")
    assert list_response.status_code == 200
    data = list_response.json()
    assert "outfits" in data
    assert isinstance(data["outfits"], list)
