import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.media_extractor_service import MediaExtractorService

client = TestClient(app)

def test_media_extractor_ssrf_protection():
    """Verify SSRF targets are strictly rejected."""
    bad_urls = [
        "http://127.0.0.1:8000/secret",
        "http://169.254.169.254/latest/meta-data",
        "http://localhost:5432/",
        "file:///etc/passwd",
    ]
    for url in bad_urls:
        res = MediaExtractorService.extract(url)
        assert "error" in res, f"Expected error for {url}"
        assert "disallowed" in res["error"].lower() or "invalid" in res["error"].lower()

def test_media_extractor_empty_url():
    """Verify empty or None inputs are gracefully handled."""
    assert "error" in MediaExtractorService.extract("")
    assert "error" in MediaExtractorService.extract(None)

def test_execute_tool_universal_downloader_endpoint():
    """Verify the /api/v1/tools/execute endpoint dispatches universal-video-downloader."""
    payload = {
        "tool_slug": "universal-video-downloader",
        "action": "extract",
        "parameters": {"url": "http://127.0.0.1:8000/internal"}
    }
    resp = client.post("/api/v1/tools/execute", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    # It should return success=True with error in result, or success=False
    if data.get("success"):
        assert "error" in data["result"]
    else:
        assert data.get("error") is not None

def test_download_stream_ssrf_rejected():
    """Verify /api/v1/tools/download-stream rejects internal addresses."""
    resp = client.get("/api/v1/tools/download-stream", params={"url": "http://169.254.169.254/creds"})
    assert resp.status_code == 400
    assert "Disallowed URL" in resp.json()["detail"]
