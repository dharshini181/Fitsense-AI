import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.auth import get_current_user
from app.database import Base, engine
from sqlalchemy.orm import sessionmaker

# Override auth to use dummy user
def override_get_current_user():
    from app.models import User
    return User(id=1, email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def test_voice_transcribe():
    # Send a small dummy audio file (empty bytes) – our service returns mock transcription.
    files = {"file": ("dummy.webm", b"", "audio/webm")}
    response = client.post("/api/voice/transcribe", files=files)
    assert response.status_code == 200
    assert "text" in response.json()
    assert "Suggest an outfit" in response.json()["text"]

def test_voice_command():
    payload = {"text": "Suggest an outfit for a rainy day"}
    response = client.post("/api/voice/command", json=payload)
    assert response.status_code == 200
    json_resp = response.json()
    assert json_resp["action"] == "suggest_outfit"
    assert "spoken_response" in json_resp

def test_voice_synthesize():
    payload = {"text": "Hello test"}
    response = client.post("/api/voice/synthesize", json=payload)
    assert response.status_code == 200
    # Should return an audio file (mp3) content type
    assert response.headers["content-type"] == "audio/mpeg"
    assert len(response.content) > 0
