import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user

def override_get_current_user():
    from app.models import User
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def dummy_file(content: bytes = b"dummy image data", filename: str = "test.jpg", mime_type="image/jpeg"):
    return {"file": (filename, content, mime_type)}

def test_ocr_label():
    response = client.post("/api/ocr/label", files=dummy_file())
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "brand" in data

def test_ocr_receipt():
    response = client.post("/api/ocr/receipt", files=dummy_file())
    assert response.status_code == 200
    data = response.json()
    assert "purchase_id" in data
    assert "extracted_data" in data
    assert "store" in data["extracted_data"]

def test_ocr_auto_fill():
    payload = {
        "name": "Test Item",
        "brand": "Test Brand",
        "fabric_composition": "100% Cotton",
        "category": "Shirt",
        "price": 19.99
    }
    response = client.post("/api/ocr/auto-fill", json=payload)
    assert response.status_code == 200
    assert "msg" in response.json()
