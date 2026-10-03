import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user

# Mock user for testing
def override_get_current_user():
    from app.models import User
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def test_predict_lifespan():
    response = client.post(
        "/api/predict/lifespan",
        json={
            "item_category": "t-shirt",
            "wash_count": 20,
            "fabric": "cotton"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "max_washes_estimated" in data

def test_calculate_sustainability():
    response = client.post(
        "/api/predict/sustainability",
        json={
            "items": [
                {"fabric_estimation": "cotton"},
                {"fabric_estimation": "polyester"}
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "sustainability_score_100" in data

def test_calculate_my_sustainability():
    # Since DB is not mocked fully, we just ensure the endpoint is reachable 
    # For now, it will return a score even with 0 items.
    response = client.get("/api/predict/sustainability/me")
    assert response.status_code == 200
    data = response.json()
    assert "sustainability_score_100" in data

def test_get_trends():
    response = client.get("/api/predict/trends")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_model_metrics():
    response = client.get("/api/predict/model-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "Precision@K" in data
