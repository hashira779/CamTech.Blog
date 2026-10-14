"""Unit tests for the pluggable AI gateway and the generalized trusted-engine policy."""
import sys, os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import ai_gateway
from app.services.ai_gateway import AIProvider
from app.services.news_autopilot import is_trusted_engine


def test_extract_json_handles_fences_and_prose():
    assert ai_gateway.extract_json('{"a": 1}') == {"a": 1}
    assert ai_gateway.extract_json('```json\n[1, 2, 3]\n```') == [1, 2, 3]
    assert ai_gateway.extract_json('Sure! Here it is: {"ok": true} — enjoy') == {"ok": True}
    assert ai_gateway.extract_json('plain prose with no json') is None


def test_trusted_engine_trusts_all_real_providers_only():
    assert is_trusted_engine("openai:gpt-4o-mini") is True
    assert is_trusted_engine("anthropic:claude-3-5-sonnet-latest") is True
    assert is_trusted_engine("groq:llama-3.3-70b-versatile") is True
    assert is_trusted_engine("gemini:gemini-2.5-flash") is True
    assert is_trusted_engine("gemini_search_grounded") is True
    assert is_trusted_engine("gemini-2.5-flash") is True
    # local extraction / fallback / untagged output is never trusted
    for bad in ("local", "fallback", "unknown", "", "template", "mock", "weird"):
        assert is_trusted_engine(bad) is False


def test_generate_text_falls_back_to_next_provider(monkeypatch):
    providers = [
        AIProvider(id="broken", label="Broken", style="openai", model="m1", api_key="k", enabled=True),
        AIProvider(id="good", label="Good", style="openai", model="m2", api_key="k", enabled=True),
        AIProvider(id="off", label="Off", style="openai", model="m3", api_key="k", enabled=False),
        AIProvider(id="nokey", label="NoKey", style="openai", model="m4", api_key="", enabled=True),
    ]
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: providers)

    def fake_call(p, prompt, **kw):
        if p.id == "broken":
            raise RuntimeError("boom")
        return f"hello from {p.id}"

    monkeypatch.setattr(ai_gateway, "call_provider", fake_call)

    text, meta = ai_gateway.generate_text("hi", timeout=5)
    assert text == "hello from good"
    assert meta["engine"] == "good:m2"


def test_generate_text_reports_failure_when_no_provider_works(monkeypatch):
    providers = [AIProvider(id="broken", label="Broken", style="openai", model="m", api_key="k", enabled=True)]
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: providers)

    def fake_call(p, prompt, **kw):
        raise RuntimeError("boom")

    monkeypatch.setattr(ai_gateway, "call_provider", fake_call)

    text, meta = ai_gateway.generate_text("hi", timeout=5)
    assert text is None
    assert meta["error"] == "no_provider_succeeded"
    assert any("broken" in d for d in meta.get("details", []))


def test_generate_json_returns_none_on_unparseable(monkeypatch):
    providers = [AIProvider(id="ok", label="OK", style="openai", model="m", api_key="k", enabled=True)]
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: providers)
    monkeypatch.setattr(ai_gateway, "call_provider", lambda p, prompt, **kw: "totally not json")

    data, meta = ai_gateway.generate_json("hi", timeout=5)
    assert data is None
    assert meta["engine"] == "ok:m"


def test_save_providers_preserves_stored_key_when_masked_submitted():
    from app.common.database import SessionLocal
    db = SessionLocal()
    try:
        # Seed a provider with a real key.
        ai_gateway.save_providers(db, [
            {"id": "openai", "label": "OpenAI", "style": "openai", "model": "gpt-4o-mini",
             "base_url": "https://api.openai.com/v1", "enabled": True, "api_key": "sk-secret-1234567890"},
        ])
        # Re-save with a masked token — the real key must be preserved.
        ai_gateway.save_providers(db, [
            {"id": "openai", "label": "OpenAI", "style": "openai", "model": "gpt-4o-mini",
             "base_url": "https://api.openai.com/v1", "enabled": True, "api_key": "sk-s…7890"},
        ])
        stored = {p.id: p.api_key for p in ai_gateway.load_providers(db)}
        assert stored["openai"] == "sk-secret-1234567890"

        # An explicit clear token removes the key.
        ai_gateway.save_providers(db, [
            {"id": "openai", "label": "OpenAI", "style": "openai", "model": "gpt-4o-mini",
             "base_url": "https://api.openai.com/v1", "enabled": True, "api_key": "__CLEAR__"},
        ])
        stored = {p.id: p.api_key for p in ai_gateway.load_providers(db)}
        assert stored["openai"] == ""
    finally:
        # Restore to the pristine "no providers stored" state for other tests.
        from app.models.audit import SiteSetting
        db.query(SiteSetting).filter(SiteSetting.key == ai_gateway.PROVIDERS_SETTING_KEY).delete()
        db.commit()
        db.close()
