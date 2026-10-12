import asyncio, json, pytest
from fastapi import HTTPException
from app.services import photo_style_service as svc

GOOD = {"person_visible": True, "body_shape": "Pear", "skin_tone": "Medium", "undertone": "Warm",
        "fit_tips": ["a", "b"], "colors_to_wear": ["Olive", "Rust"], "colors_to_avoid": ["Neon"],
        "outfits": [{"title": "Smart casual", "pieces": ["Linen shirt", "Chinos"], "why": "Balances hips."}]}

def test_normalize_ok():
    out = svc.normalize(GOOD)
    assert out["body_shape"] == "Pear" and out["outfits"][0]["pieces"] == ["Linen shirt", "Chinos"]

def test_bad_body_shape_dropped():
    assert svc.normalize({**GOOD, "body_shape": "Banana"})["body_shape"] == ""

def test_no_person():
    with pytest.raises(HTTPException) as e: svc.normalize({"person_visible": False})
    assert e.value.status_code == 422

def test_no_outfits_and_garbage():
    with pytest.raises(HTTPException): svc.normalize({**GOOD, "outfits": []})
    with pytest.raises(HTTPException): svc.normalize("nope")

def test_input_checks(monkeypatch):
    monkeypatch.setattr(svc.settings, "GEMINI_API_KEY", "x", raising=False)
    for data, mime, code in [(b"1", "image/gif", 415), (b"", "image/png", 400), (b"x" * (svc.MAX_BYTES + 1), "image/png", 413)]:
        with pytest.raises(HTTPException) as e: asyncio.run(svc.suggest_from_photo(data, mime))
        assert e.value.status_code == code
    monkeypatch.setattr(svc.settings, "GEMINI_API_KEY", "", raising=False)
    with pytest.raises(HTTPException) as e: asyncio.run(svc.suggest_from_photo(b"1", "image/png"))
    assert e.value.status_code == 503