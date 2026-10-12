"""Tests against a local mock of the Cloudflare endpoint (no network, no credentials)."""
import base64, io, json, threading, time
_real_sleep = time.sleep
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer as HTTPServer
import pytest
from PIL import Image

from app.services import image_service as svc

ACCT = "a" * 32

def _jpeg_b64():
    buf = io.BytesIO(); Image.new("RGB", (64, 64), (200, 30, 30)).save(buf, "JPEG")
    return base64.b64encode(buf.getvalue()).decode()

class Mock:
    script = []   # list of (status, headers, body_bytes, delay)
    calls = []
    last_auth = None
    last_body = None

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        n = int(self.headers.get("content-length", 0))
        Mock.last_body = json.loads(self.rfile.read(n)); Mock.last_auth = self.headers.get("authorization")
        Mock.calls.append(self.path)
        status, headers, body, delay = Mock.script.pop(0) if Mock.script else (500, {}, b"{}", 0)
        _real_sleep(delay)
        self.send_response(status)
        for k, v in {"content-type": "application/json", **headers}.items(): self.send_header(k, v)
        self.send_header("content-length", str(len(body))); self.end_headers(); self.wfile.write(body)

@pytest.fixture(scope="module")
def server():
    s = HTTPServer(("127.0.0.1", 0), H); threading.Thread(target=s.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{s.server_port}"
    s.shutdown()

@pytest.fixture(autouse=True)
def env(server, monkeypatch, tmp_path):
    monkeypatch.setenv("NO_PROXY", "127.0.0.1"); monkeypatch.setenv("no_proxy", "127.0.0.1")
    monkeypatch.delenv("HTTPS_PROXY", raising=False); monkeypatch.delenv("HTTP_PROXY", raising=False)
    monkeypatch.setenv("CLOUDFLARE_API_BASE", server)
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", ACCT); monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "SECRET_TOKEN_XYZ")
    monkeypatch.setenv("IMAGE_OUTPUT_DIR", str(tmp_path))
    monkeypatch.setattr(svc.time, "sleep", lambda s: None)
    Mock.script, Mock.calls = [], []

def ok(img=None): return (200, {}, json.dumps({"result": {"image": img or _jpeg_b64()}, "success": True, "errors": [], "messages": []}).encode(), 0)

def test_success_saves_real_png(tmp_path):
    Mock.script = [ok()]
    data = svc.generate_image_bytes("hello")
    assert Mock.calls[0] == f"/accounts/{ACCT}/ai/run/@cf/black-forest-labs/flux-1-schnell"
    assert Mock.last_auth == "Bearer SECRET_TOKEN_XYZ" and Mock.last_body == {"prompt": "hello", "steps": 4}
    p = svc.save_png(data)
    assert p.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n" and Image.open(p).size == (64, 64)

def test_top_level_image_and_raw_bytes():
    Mock.script = [(200, {}, json.dumps({"image": _jpeg_b64()}).encode(), 0)]
    assert svc.generate_image_bytes("x")[:3] == b"\xff\xd8\xff"
    raw = base64.b64decode(_jpeg_b64())
    Mock.script = [(200, {"content-type": "image/jpeg"}, raw, 0)]
    assert svc.generate_image_bytes("x") == raw

@pytest.mark.parametrize("status,kind", [(401, "auth"), (403, "auth"), (404, "not_found"), (400, "bad_request")])
def test_http_errors(status, kind):
    Mock.script = [(status, {}, b'{"success":false,"errors":[{"code":1000,"message":"nope"}]}', 0)]
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == kind and "SECRET_TOKEN_XYZ" not in str(e.value) and len(Mock.calls) == 1

def test_429_retries_then_succeeds():
    Mock.script = [(429, {"retry-after": "1"}, b'{"errors":[]}', 0), ok()]
    assert svc.generate_image_bytes("x") and len(Mock.calls) == 2

def test_429_persistent_raises():
    Mock.script = [(429, {}, b"{}", 0)] * 2
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "rate_limited" and len(Mock.calls) == 2

def test_daily_allowance_429_not_retried():
    Mock.script = [(429, {}, b'{"errors":[{"code":4006,"message":"daily free allocation exceeded"}]}', 0)]
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "rate_limited" and len(Mock.calls) == 1

def test_5xx_retry_then_success():
    Mock.script = [(503, {}, b"oops", 0), ok()]
    assert svc.generate_image_bytes("x") and len(Mock.calls) == 2

@pytest.mark.parametrize("body", [b"<html>", b"[]", b'{"result":{}, "success":true}',
                                  json.dumps({"result": {"image": "!!notbase64!!"}}).encode(),
                                  json.dumps({"result": {"image": base64.b64encode(b"not an image").decode()}}).encode()])
def test_invalid_responses(body):
    Mock.script = [(200, {}, body, 0)]
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "invalid_response"

def test_success_false_envelope():
    Mock.script = [(200, {}, b'{"success":false,"errors":[{"code":5007,"message":"No such model"}]}', 0)]
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "api_error" and "5007" in str(e.value)

def test_timeout(monkeypatch):
    monkeypatch.setattr(svc, "REQUEST_TIMEOUT", (2, 0.3))
    Mock.script = [ok() [:3] + (1.0,)] * 2
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "timeout"

def test_connection_refused(monkeypatch):
    monkeypatch.setenv("CLOUDFLARE_API_BASE", "http://127.0.0.1:9")
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "network"

def test_missing_and_bad_credentials(monkeypatch):
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "")
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "not_configured" and not Mock.calls
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "t"); monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "short")
    with pytest.raises(svc.ImageGenError) as e: svc.generate_image_bytes("x")
    assert e.value.kind == "not_configured"

def test_prompt_truncated_and_steps_clamped():
    Mock.script = [ok()]
    svc.generate_image_bytes("a" * 5000, steps=99)
    assert len(Mock.last_body["prompt"]) == 2048 and Mock.last_body["steps"] == 8

@pytest.mark.asyncio
async def test_public_functions_return_data_uri_and_save(tmp_path):
    Mock.script = [ok(), ok()]
    uri = await svc.generate_outfit_image(["navy blazer", "white shirt"], "Classic", "Formal")
    assert uri.startswith("data:image/jpeg;base64,")
    assert "navy blazer, white shirt. Classic style, dressed for a formal occasion" in Mock.last_body["prompt"]
    uri2 = await svc.generate_image_from_description("a green kurta")
    assert uri2 and "a green kurta" in Mock.last_body["prompt"]
    assert len(list(tmp_path.glob("*.png"))) == 2

@pytest.mark.asyncio
async def test_public_function_fails_soft(monkeypatch):
    Mock.script = [(401, {}, b"{}", 0)]
    assert await svc.generate_outfit_image(["x"]) is None