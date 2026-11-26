"""Comprehensive tests for universal AI provider routing, outbound MCP client,
inbound /api/v1/mcp server + RBAC, Admin provider discovery, and quiz gateway delegation.
"""
import asyncio
import json
import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.common.database import SessionLocal
from app.main import app
from app.models.article import Article
from app.models.author import Author
from app.models.category import Category
from app.models.user import User
from app.services import ai_gateway
from app.services.auth_service import get_current_user


class _FakeResponse:
    def __init__(self, status_code=200, json_data=None, text=None, headers=None):
        self.status_code = status_code
        self._json_data = json_data
        self.headers = headers or {"Content-Type": "application/json"}
        if text is not None:
            self.text = text
        elif json_data is not None:
            self.text = json.dumps(json_data)
        else:
            self.text = ""

    def json(self):
        if self._json_data is not None:
            return self._json_data
        return json.loads(self.text)

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests
            err = requests.HTTPError(f"HTTP {self.status_code}")
            err.response = self
            raise err


def test_url_normalization_and_headers():
    assert ai_gateway._openai_chat_url("https://api.openai.com/v1") == "https://api.openai.com/v1/chat/completions"
    assert ai_gateway._openai_chat_url("https://api.perplexity.ai") == "https://api.perplexity.ai/chat/completions"
    azure_url = "https://res.openai.azure.com/openai/deployments/gpt4o/chat/completions?api-version=2024-10-21"
    assert ai_gateway._openai_chat_url(azure_url) == azure_url
    assert ai_gateway._openai_models_url(azure_url) == "https://res.openai.azure.com/openai/deployments/gpt4o/models?api-version=2024-10-21"

    assert ai_gateway._anthropic_messages_url("https://api.anthropic.com") == "https://api.anthropic.com/v1/messages"
    assert ai_gateway._anthropic_messages_url("https://proxy.example/v1") == "https://proxy.example/v1/messages"
    assert ai_gateway._anthropic_messages_url("https://proxy.example/v1/messages") == "https://proxy.example/v1/messages"

    local_ollama = ai_gateway.AIProvider(
        id="ollama", label="Ollama", style="openai", model="llama3.1",
        base_url="http://localhost:11434/v1", api_key="", requires_key=False, enabled=True,
    )
    assert local_ollama.is_configured() is True
    assert "Authorization" not in ai_gateway._headers_auth(local_ollama)

    azure = ai_gateway.AIProvider(
        id="azure-openai", label="Azure", style="openai", model="gpt4o",
        base_url=azure_url, api_key="secret-az", enabled=True,
    )
    az_headers = ai_gateway._headers_auth(azure)
    assert az_headers["api-key"] == "secret-az"
    assert az_headers["Authorization"] == "Bearer secret-az"


def test_openai_reasoning_retry_and_anthropic(monkeypatch):
    seen_bodies = []

    def fake_post(url, headers=None, json=None, timeout=None):
        seen_bodies.append((url, json))
        if "anthropic" in url:
            return _FakeResponse(200, {"content": [{"type": "text", "text": "Claude OK"}]})
        if len(seen_bodies) == 1:
            return _FakeResponse(400, {"error": {"message": "Use max_completion_tokens instead of max_tokens and unsupported parameter: temperature"}})
        return _FakeResponse(200, {"choices": [{"message": {"content": "Reasoning OK"}}]})

    monkeypatch.setattr(ai_gateway.requests, "post", fake_post)

    reasoning = ai_gateway.AIProvider(
        id="custom-openai", label="Custom", style="openai", model="custom-reasoning",
        base_url="https://api.example.com/v1", api_key="k", enabled=True,
    )
    out = ai_gateway.call_provider(reasoning, "Say hi")
    assert out == "Reasoning OK"
    assert "max_completion_tokens" in seen_bodies[-1][1]
    assert "temperature" not in seen_bodies[-1][1]

    claude = ai_gateway.AIProvider(
        id="anthropic", label="Claude", style="anthropic", model="claude-sonnet-4-20250514",
        base_url="https://api.anthropic.com", api_key="sk-ant", enabled=True,
    )
    assert ai_gateway.call_provider(claude, "Say hi") == "Claude OK"


def test_use_search_prioritizes_search_then_falls_back_to_any_provider(monkeypatch):
    p_standard = ai_gateway.AIProvider(
        id="openai", label="OpenAI", style="openai", model="gpt-4o-mini",
        base_url="https://api.openai.com/v1", api_key="k1", enabled=True, supports_search=False,
    )
    p_search = ai_gateway.AIProvider(
        id="perplexity", label="Perplexity", style="openai", model="sonar",
        base_url="https://api.perplexity.ai", api_key="k2", enabled=True, supports_search=True,
    )
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: [p_standard, p_search])

    calls = []

    def fake_call(p, prompt, **kw):
        calls.append((p.id, kw.get("use_search")))
        if p.id == "perplexity":
            raise RuntimeError("temporary perplexity outage")
        return "fallback answer from openai"

    monkeypatch.setattr(ai_gateway, "call_provider", fake_call)

    assert ai_gateway.has_search_provider() is True
    text, meta = ai_gateway.generate_text("Latest ASEAN tech updates", use_search=True)
    assert text == "fallback answer from openai"
    assert meta["provider"] == "openai"
    # Search-capable provider ran first, then standard provider cleanly acted as fallback
    assert calls == [("perplexity", True), ("openai", False)]


def test_outbound_mcp_client_tools_sse_and_sampling(monkeypatch):
    rpc_log = []

    def fake_post(url, headers=None, json=None, timeout=None):
        method = json.get("method")
        rpc_log.append((method, headers.get("Mcp-Session-Id"), json.get("params")))
        if method == "initialize":
            return _FakeResponse(
                200,
                {"jsonrpc": "2.0", "id": json["id"], "result": {"protocolVersion": "2024-11-05", "serverInfo": {"name": "ResearchMCP"}}},
                headers={"Content-Type": "application/json", "Mcp-Session-Id": "sid-123"},
            )
        if method == "notifications/initialized":
            return _FakeResponse(202, text="")
        if method == "tools/list":
            return _FakeResponse(200, {
                "jsonrpc": "2.0", "id": json["id"],
                "result": {"tools": [{
                    "name": "web_research",
                    "description": "Search live web sources and synthesize findings",
                    "inputSchema": {"type": "object", "required": ["query"], "properties": {"query": {"type": "string"}}},
                }]},
            })
        if method == "tools/call":
            # Exercise SSE response framing too
            sse = "event: message\ndata: " + json_dumps({
                "jsonrpc": "2.0", "id": json["id"],
                "result": {"content": [{"type": "text", "text": "MCP web answer"}], "isError": False},
            }) + "\n\n"
            return _FakeResponse(200, text=sse, headers={"Content-Type": "text/event-stream"})
        if method == "sampling/createMessage":
            return _FakeResponse(200, {
                "jsonrpc": "2.0", "id": json["id"],
                "result": {"content": {"type": "text", "text": "MCP sampling answer"}},
            })
        raise AssertionError(f"Unexpected MCP method: {method}")

    json_dumps = json.dumps
    monkeypatch.setattr(ai_gateway.requests, "post", fake_post)

    mcp_p = ai_gateway.AIProvider(
        id="mcp-server", label="MCP", style="mcp", model="auto",
        base_url="http://localhost:3100/mcp", enabled=True, supports_search=True, requires_key=False,
    )
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: [mcp_p])

    out = ai_gateway.call_provider(mcp_p, "Summarize Cambodia fintech", system="Be concise", use_search=True)
    assert out == "MCP web answer"
    assert getattr(mcp_p, "_used_model") == "tool:web_research"
    assert rpc_log[-1][0] == "tools/call"
    assert rpc_log[-1][1] == "sid-123"
    assert rpc_log[-1][2]["arguments"] == {"query": "Summarize Cambodia fintech"}

    # Sampling mode explicitly requested
    mcp_p.model = "sampling"
    assert ai_gateway.call_provider(mcp_p, "Say OK") == "MCP sampling answer"

    # Model discovery returns MCP tools + sampling modes
    disc = ai_gateway.discover_provider_models("mcp-server")
    assert disc["ok"] is True
    assert "tool:web_research" in disc["models"]


def test_discover_models_and_batch_test_endpoints(monkeypatch):
    providers = [
        ai_gateway.AIProvider(
            id="openai", label="OpenAI", style="openai", model="gpt-4o-mini",
            base_url="https://api.openai.com/v1", api_key="sk-1", enabled=True,
        ),
        ai_gateway.AIProvider(
            id="gemini", label="Gemini", style="gemini", model="gemini-3-flash-preview",
            base_url="https://generativelanguage.googleapis.com", api_key="gk-1", enabled=True,
        ),
    ]
    monkeypatch.setattr(ai_gateway, "load_providers", lambda db: providers)
    monkeypatch.setattr(ai_gateway.requests, "get", lambda url, **kw: _FakeResponse(
        200, {"data": [{"id": "gpt-4o-mini"}, {"id": "o3-mini"}]} if "openai" in url
        else {"models": [{"name": "models/gemini-3-flash-preview", "supportedGenerationMethods": ["generateContent"]}]},
    ))
    monkeypatch.setattr(ai_gateway, "call_provider", lambda p, prompt, **kw: "OK")

    assert ai_gateway.discover_provider_models("openai")["models"] == ["gpt-4o-mini", "o3-mini"]
    assert ai_gateway.discover_provider_models("gemini")["models"] == ["gemini-3-flash-preview"]

    batch = ai_gateway.test_all_providers()
    assert batch["total_tested"] == 2
    assert batch["ok_count"] == 2

    # RBAC: JOURNALIST denied on new Admin endpoints, ADMIN allowed
    client = TestClient(app)
    try:
        app.dependency_overrides[get_current_user] = lambda: User(
            id="j-1", email="j@test.local", role="JOURNALIST", is_active=True
        )
        assert client.post("/api/v1/admin/ai-providers/test-all").status_code == 403
        assert client.post("/api/v1/admin/ai-providers/models", json={"provider_id": "openai"}).status_code == 403

        app.dependency_overrides[get_current_user] = lambda: User(
            id="a-1", email="a@test.local", role="ADMIN", is_active=True
        )
        r_models = client.post("/api/v1/admin/ai-providers/models", json={"provider_id": "openai"})
        assert r_models.status_code == 200
        assert "gpt-4o-mini" in r_models.json()["models"]

        r_all = client.post("/api/v1/admin/ai-providers/test-all")
        assert r_all.status_code == 200
        assert r_all.json()["ok_count"] == 2
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_inbound_mcp_server_published_only_and_rbac(monkeypatch):
    tag = uuid.uuid4().hex[:8]
    db = SessionLocal()
    pub_slug = f"mcp-pub-{tag}"
    draft_slug = f"mcp-draft-{tag}"
    try:
        cat = db.query(Category).first()
        author = db.query(Author).first()
        assert cat and author
        db.add(Article(
            title=f"MCP Published Story {tag}",
            title_km="រឿងផ្សព្វផ្សាយសាកល្បង",
            slug=pub_slug,
            summary="Published test summary for MCP.",
            content="Published article body for MCP lookup test.",
            content_km="ខ្លឹមសារជាភាសាខ្មែរសម្រាប់ការសាកល្បង MCP។",
            status="PUBLISHED",
            country="KH",
            language="en",
            category_id=cat.id,
            author_id=author.id,
            primary_source_url=f"https://example.com/{pub_slug}",
        ))
        db.add(Article(
            title=f"MCP Secret Draft {tag}",
            slug=draft_slug,
            summary="Unpublished draft must stay hidden from public MCP.",
            content="Draft body must never leak to public MCP.",
            status="AI_DRAFT",
            country="KH",
            language="en",
            category_id=cat.id,
            author_id=author.id,
            primary_source_url=f"https://example.com/{draft_slug}",
        ))
        db.commit()

        client = TestClient(app)

        # Anonymous GET discovery shows public tools only
        manifest = client.get("/api/v1/mcp")
        assert manifest.status_code == 200
        pub_tool_names = set(manifest.json()["tools"])
        assert {"search_news", "get_article", "get_trending", "list_discoveries", "list_cambodia_places"} <= pub_tool_names
        assert "pipeline_health" not in pub_tool_names
        assert "ask_ai" not in pub_tool_names

        # Initialize handshake + Mcp-Session-Id
        init_res = client.post("/api/v1/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}})
        assert init_res.status_code == 200
        assert init_res.headers.get("Mcp-Session-Id")
        assert init_res.json()["result"]["serverInfo"]["name"] == "camtech-blog-mcp"

        # Public search returns published story, NEVER draft
        search_res = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 2, "method": "tools/call",
            "params": {"name": "search_news", "arguments": {"query": tag}},
        })
        assert search_res.status_code == 200
        articles = search_res.json()["result"]["structuredContent"]["articles"]
        assert [a["slug"] for a in articles] == [pub_slug]

        # Reading draft directly via MCP returns not found error (-32004)
        draft_read = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 3, "method": "tools/call",
            "params": {"name": "get_article", "arguments": {"slug": draft_slug}},
        })
        assert draft_read.json()["error"]["code"] == -32004

        # Anonymous call to Admin tools fails with -32001
        anon_admin = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 4, "method": "tools/call",
            "params": {"name": "pipeline_health", "arguments": {}},
        })
        assert anon_admin.json()["error"]["code"] == -32001

        anon_ask = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 5, "method": "tools/call",
            "params": {"name": "ask_ai", "arguments": {"prompt": "hi"}},
        })
        assert anon_ask.json()["error"]["code"] == -32001

        # Journalist can access editorial pipeline_health but NOT infra list_ai_providers
        app.dependency_overrides[get_current_user] = lambda: User(
            id="j-mcp", email="j@test.local", role="JOURNALIST", is_active=True
        )
        j_health = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 6, "method": "tools/call",
            "params": {"name": "pipeline_health", "arguments": {}},
        })
        assert "published_total" in j_health.json()["result"]["structuredContent"]

        j_infra = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 7, "method": "tools/call",
            "params": {"name": "list_ai_providers", "arguments": {}},
        })
        assert j_infra.json()["error"]["code"] == -32003

        # ADMIN unlocks ask_ai + list_ai_providers (with secrets still masked)
        monkeypatch.setattr(ai_gateway, "generate_text", lambda prompt, **kw: ("Admin AI reply", {"provider": "openai", "model": "gpt-4o-mini"}))
        app.dependency_overrides[get_current_user] = lambda: User(
            id="a-mcp", email="a@test.local", role="ADMIN", is_active=True
        )
        a_tools = client.post("/api/v1/mcp", json={"jsonrpc": "2.0", "id": 8, "method": "tools/list", "params": {}})
        a_names = {t["name"] for t in a_tools.json()["result"]["tools"]}
        assert {"ask_ai", "pipeline_health", "list_ai_providers", "trigger_khmer_backfill", "trigger_desk_scan"} <= a_names

        a_ask = client.post("/api/v1/mcp", json={
            "jsonrpc": "2.0", "id": 9, "method": "tools/call",
            "params": {"name": "ask_ai", "arguments": {"prompt": "Summarize status"}},
        })
        assert a_ask.json()["result"]["structuredContent"]["text"] == "Admin AI reply"
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        db.query(Article).filter(Article.slug.in_([pub_slug, draft_slug])).delete(synchronize_session=False)
        db.commit()
        db.close()
