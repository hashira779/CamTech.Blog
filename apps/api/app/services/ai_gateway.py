"""
AI Gateway — a pluggable, multi-provider layer for every AI feature in the platform
(news drafting, content generation, search answers, RSS editorial drafts).

Design goals
------------
* 10+ providers out of the box (Gemini, OpenAI, Anthropic, Groq, Mistral, DeepSeek,
  xAI, OpenRouter, Together, Fireworks, Cerebras, GitHub Models, Ollama) and you can add
  more of any OpenAI-compatible vendor from the Admin UI without touching code.
* Automatic fallback: providers are tried in priority order; the first one that is both
  enabled and has a key is used. A missing key, a 429, or a bad response never takes the
  whole pipeline down — it falls through to the next provider, and only reports failure if
  none worked. This is the fix for "one broken key = AI writes nothing".
* No SDK dependency: every call is plain HTTP via `requests` (Gemini uses its REST API too),
  so the system works even when optional SDKs are not installed.

Configuration lives in a single SiteSetting row `AI_PROVIDERS_JSON` (a JSON array of provider
objects), edited from Admin -> Settings -> AI Providers. For backward compatibility, if that
row is absent a Gemini provider is synthesized from the legacy `GEMINI_API_KEY` SiteSetting or
the `AI_API_KEY` env var, so nothing breaks for existing deployments.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple

import requests

from app.common.ssrf import validate_provider_endpoint

logger = logging.getLogger("AIGateway")

PROVIDERS_SETTING_KEY = "AI_PROVIDERS_JSON"

# Engines that must NEVER be auto-published: template/local extraction or untagged output.
NON_TRUSTED_ENGINES = {"local", "fallback", "unknown", "mock", "template", ""}


@dataclass
class AIProvider:
    id: str
    label: str
    style: str                       # 'openai' | 'gemini' | 'anthropic'
    model: str
    base_url: str = ""
    api_key: str = ""
    enabled: bool = False
    temperature: float = 0.5
    max_tokens: int = 2048
    supports_search: bool = False    # web-grounded generation available (Gemini only today)
    requires_key: bool = True        # False for local servers like Ollama

    def is_configured(self) -> bool:
        if not self.requires_key:
            return bool(self.base_url)
        return bool((self.api_key or "").strip())

    def engine(self) -> str:
        return f"{self.id}:{self.model}"


# --------------------------------------------------------------------------- built-in catalog
# Array order == fallback priority. Only Gemini is enabled by default (via the legacy key);
# everything else starts disabled until the editor pastes a key.
DEFAULT_PROVIDERS: List[Dict[str, Any]] = [
    {"id": "gemini", "label": "Google Gemini", "style": "gemini", "model": "gemini-2.5-flash",
     "base_url": "https://generativelanguage.googleapis.com", "enabled": True, "supports_search": True},
    {"id": "openai", "label": "OpenAI", "style": "openai", "model": "gpt-4o-mini",
     "base_url": "https://api.openai.com/v1"},
    {"id": "anthropic", "label": "Anthropic Claude", "style": "anthropic", "model": "claude-3-5-sonnet-latest",
     "base_url": "https://api.anthropic.com"},
    {"id": "groq", "label": "Groq", "style": "openai", "model": "llama-3.3-70b-versatile",
     "base_url": "https://api.groq.com/openai/v1"},
    {"id": "mistral", "label": "Mistral AI", "style": "openai", "model": "mistral-large-latest",
     "base_url": "https://api.mistral.ai/v1"},
    {"id": "deepseek", "label": "DeepSeek", "style": "openai", "model": "deepseek-chat",
     "base_url": "https://api.deepseek.com/v1"},
    {"id": "xai", "label": "xAI Grok", "style": "openai", "model": "grok-2-latest",
     "base_url": "https://api.x.ai/v1"},
    {"id": "openrouter", "label": "OpenRouter", "style": "openai", "model": "openai/gpt-4o-mini",
     "base_url": "https://openrouter.ai/api/v1"},
    {"id": "together", "label": "Together AI", "style": "openai", "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
     "base_url": "https://api.together.xyz/v1"},
    {"id": "fireworks", "label": "Fireworks AI", "style": "openai", "model": "accounts/fireworks/models/llama-v3p1-70b-instruct",
     "base_url": "https://api.fireworks.ai/inference/v1"},
    {"id": "cerebras", "label": "Cerebras", "style": "openai", "model": "llama-3.3-70b",
     "base_url": "https://api.cerebras.ai/v1"},
    {"id": "github", "label": "GitHub Models", "style": "openai", "model": "gpt-4o-mini",
     "base_url": "https://models.inference.ai.azure.com"},
    {"id": "ollama", "label": "Ollama (local)", "style": "openai", "model": "llama3.1",
     "base_url": "http://localhost:11434/v1", "requires_key": False},
]


def catalog() -> List[Dict[str, Any]]:
    """Editable provider presets offered in the Admin UI."""
    return [dict(p) for p in DEFAULT_PROVIDERS]


# --------------------------------------------------------------------------- settings I/O
def _legacy_gemini_key(db) -> str:
    from app.models.audit import SiteSetting
    try:
        row = db.query(SiteSetting).filter(SiteSetting.key == "GEMINI_API_KEY").first()
        if row and (row.value_json or "").strip():
            return row.value_json.strip()
    finally:
        pass
    from app.common.config import settings
    return (settings.AI_API_KEY or "").strip()


def _default_providers(db) -> List[AIProvider]:
    """Build providers when no AI_PROVIDERS_JSON is stored (backward compatibility)."""
    key = _legacy_gemini_key(db)
    out = []
    for p in DEFAULT_PROVIDERS:
        prov = AIProvider(**p)
        if prov.id == "gemini":
            prov.api_key = key
            prov.enabled = bool(key)
        out.append(prov)
    return out


def load_providers(db) -> List[AIProvider]:
    """Return the configured provider list in priority order. Never raises."""
    from app.models.audit import SiteSetting
    row = db.query(SiteSetting).filter(SiteSetting.key == PROVIDERS_SETTING_KEY).first()
    if not row or not (row.value_json or "").strip():
        return _default_providers(db)
    try:
        stored = json.loads(row.value_json)
    except (TypeError, ValueError):
        logger.warning("AI_PROVIDERS_JSON is not valid JSON; using defaults.")
        return _default_providers(db)
    if not isinstance(stored, list):
        return _default_providers(db)

    defaults_by_id = {p["id"]: p for p in DEFAULT_PROVIDERS}
    providers: List[AIProvider] = []
    for item in stored:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        base = dict(defaults_by_id.get(item["id"], {}))
        base.update({k: v for k, v in item.items() if v is not None or k == "api_key"})
        try:
            providers.append(AIProvider(**{k: v for k, v in base.items()
                                           if k in AIProvider.__dataclass_fields__}))
        except TypeError:
            continue
    return providers or _default_providers(db)


def _key_is_masked(key: str) -> bool:
    """True when a submitted api_key is the redacted UI token (or absent), not a real secret."""
    return (not key) or key == "•" or "…" in key


def save_providers(db, providers: List[Dict[str, Any]]) -> None:
    """Persist the provider list. Masked/absent API keys keep the stored real secret;
    an explicit '__CLEAR__' token removes it; any other string overwrites it."""
    from app.models.audit import SiteSetting
    stored_keys = {p.id: p.api_key for p in load_providers(db) if (p.api_key or "").strip()}
    merged: List[Dict[str, Any]] = []
    for item in providers:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        d = dict(item)
        submitted = d.get("api_key")
        pid = str(d["id"])
        if submitted == "__CLEAR__":
            d["api_key"] = ""
        elif submitted is None or _key_is_masked(str(submitted)):
            d["api_key"] = stored_keys.get(pid, "")
        else:
            d["api_key"] = str(submitted).strip()
        # Validated on the way in rather than on the way out, because the request this value
        # produces carries the provider's API key in its headers: an endpoint that points at the
        # instance metadata service would be handed our credentials before the first token arrived.
        endpoint = str(d.get("base_url") or "").strip()
        if endpoint:
            validate_provider_endpoint(endpoint)
            d["base_url"] = endpoint
        merged.append(d)
    payload = json.dumps(merged, ensure_ascii=False)
    row = db.query(SiteSetting).filter(SiteSetting.key == PROVIDERS_SETTING_KEY).first()
    if row:
        row.value_json = payload
    else:
        db.add(SiteSetting(key=PROVIDERS_SETTING_KEY, value_json=payload,
                           description="Pluggable AI providers (JSON array) in fallback order"))
    db.commit()


# --------------------------------------------------------------------------- JSON extraction
def extract_json(text: str) -> Any:
    if not text:
        return None
    cleaned = re.sub(r"^\s*```(?:json)?|```\s*$", "", text.strip(), flags=re.IGNORECASE).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    for open_ch, close_ch in (("[", "]"), ("{", "}")):
        start, end = cleaned.find(open_ch), cleaned.rfind(close_ch)
        if start != -1 and end > start:
            try:
                return json.loads(cleaned[start:end + 1])
            except Exception:
                continue
    return None


# --------------------------------------------------------------------------- provider calls
def _headers_auth(p: AIProvider) -> Dict[str, str]:
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {p.api_key}",
        "x-api-key": p.api_key,          # harmless for non-Anthropic; Anthropic needs it
        "anthropic-version": "2023-06-01",
        "x-goog-api-key": p.api_key,     # harmless for non-Google; Google needs it
    }


def _call_openai(p: AIProvider, prompt: str, system: Optional[str], timeout: float) -> str:
    messages = ([{"role": "system", "content": system}] if system else []) + \
               [{"role": "user", "content": prompt}]
    body = {"model": p.model, "messages": messages,
            "temperature": p.temperature, "max_tokens": p.max_tokens}
    r = requests.post(p.base_url.rstrip("/") + "/chat/completions",
                      headers=_headers_auth(p), json=body, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    return data["choices"][0]["message"]["content"]


def _call_anthropic(p: AIProvider, prompt: str, system: Optional[str], timeout: float) -> str:
    body = {"model": p.model, "max_tokens": p.max_tokens, "temperature": p.temperature,
            "messages": [{"role": "user", "content": prompt}]}
    if system:
        body["system"] = system
    r = requests.post(p.base_url.rstrip("/") + "/v1/messages",
                      headers={"Content-Type": "application/json",
                               "x-api-key": p.api_key, "anthropic-version": "2023-06-01"},
                      json=body, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    parts = data.get("content") or []
    return "".join(b.get("text", "") for b in parts if b.get("type") == "text")


def _call_gemini(p: AIProvider, prompt: str, system: Optional[str], timeout: float, use_search: bool) -> str:
    body: Dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": p.temperature, "maxOutputTokens": p.max_tokens},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    if use_search and p.supports_search:
        body["tools"] = [{"google_search": {}}]
    r = requests.post(f"{p.base_url.rstrip('/')}/v1beta/models/{p.model}:generateContent",
                      headers={"Content-Type": "application/json", "x-goog-api-key": p.api_key},
                      json=body, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    cand = (data.get("candidates") or [{}])[0]
    parts = (cand.get("content") or {}).get("parts") or []
    return "".join(pt.get("text", "") for pt in parts)


def call_provider(p: AIProvider, prompt: str, *, system: Optional[str] = None,
                  use_search: bool = False, timeout: float = 60.0) -> str:
    if p.style == "gemini":
        return _call_gemini(p, prompt, system, timeout, use_search)
    if p.style == "anthropic":
        return _call_anthropic(p, prompt, system, timeout)
    return _call_openai(p, prompt, system, timeout)


# --------------------------------------------------------------------------- public API
def generate_text(prompt: str, *, system: Optional[str] = None, use_search: bool = False,
                  timeout: float = 60.0, only: Optional[str] = None) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Try each enabled+configured provider in order; return (text, provider_meta) or (None, errors)."""
    from app.common.database import SessionLocal
    db = SessionLocal()
    try:
        providers = load_providers(db)
    finally:
        db.close()

    errors = []
    for p in providers:
        if only and p.id != only:
            continue
        if not p.enabled:
            continue
        if not p.is_configured():
            errors.append(f"{p.id}: no key/base_url")
            continue
        try:
            text = call_provider(p, prompt, system=system, use_search=use_search, timeout=timeout)
            if text and text.strip():
                return text, {"provider": p.id, "label": p.label, "model": p.model, "engine": p.engine()}
            errors.append(f"{p.id}: empty response")
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "?"
            errors.append(f"{p.id}: HTTP {status}")
        except Exception as e:  # noqa: BLE001 - one bad provider must not stop the rest
            errors.append(f"{p.id}: {str(e)[:120]}")
    return None, {"error": "no_provider_succeeded", "details": errors}


def generate_json(prompt: str, *, system: Optional[str] = None, use_search: bool = False,
                  timeout: float = 60.0, only: Optional[str] = None) -> Tuple[Any, Optional[Dict[str, Any]]]:
    text, meta = generate_text(prompt, system=system, use_search=use_search, timeout=timeout, only=only)
    if text is None:
        return None, meta
    return extract_json(text), meta


def has_any_configured_provider() -> bool:
    from app.common.database import SessionLocal
    db = SessionLocal()
    try:
        return any(p.enabled and p.is_configured() for p in load_providers(db))
    finally:
        db.close()


def test_provider(provider_id: str) -> Dict[str, Any]:
    """Ping a single provider with a tiny prompt; used by the Admin 'Test' button."""
    text, meta = generate_text("Reply with exactly the word: OK", use_search=False,
                               timeout=25.0, only=provider_id)
    if text is not None and meta:
        return {"ok": True, "provider": meta["provider"], "model": meta["model"],
                "sample": text[:80]}
    detail = (meta or {}).get("details", []) if meta else ["provider not found or disabled"]
    return {"ok": False, "provider": provider_id, "detail": detail}


def redacted_providers() -> List[Dict[str, Any]]:
    """Providers for the UI with API keys masked (never leak secrets to the client)."""
    from app.common.database import SessionLocal
    db = SessionLocal()
    try:
        out = []
        for p in load_providers(db):
            d = asdict(p)
            key = d.get("api_key") or ""
            d["api_key"] = (key[:4] + "…" + key[-4:]) if len(key) > 8 else ("" if not key else "•")
            d["has_key"] = bool(key)
            out.append(d)
        return out
    finally:
        db.close()
