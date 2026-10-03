import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user

# Override dependency to mock authenticated user
def override_get_current_user():
    from app.models import User
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def dummy_file(content: bytes = b"dummy image data", filename: str = "test.jpg", mime_type="image/jpeg"):
    return {"file": (filename, content, mime_type)}

@pytest.mark.parametrize(
    "endpoint",
    [
        "/api/analysis/scan",
        "/api/analysis/skin-tone",
        "/api/analysis/body",
        "/api/analysis/full",
    ],
)
def test_analysis_endpoints_success(endpoint):
    response = client.post(endpoint, files=dummy_file())
    assert response.status_code == 200, f"{endpoint} returned {response.status_code}"
    data = response.json()
    assert isinstance(data, dict)

def test_analysis_invalid_mime_type():
    response = client.post("/api/analysis/scan", files=dummy_file(filename="test.txt", mime_type="text/plain"))
    assert response.status_code == 415

def test_analysis_large_file():
    large_content = b"0" * (6 * 1024 * 1024)  # 6 MB
    response = client.post("/api/analysis/scan", files=dummy_file(content=large_content))
    assert response.status_code == 413
