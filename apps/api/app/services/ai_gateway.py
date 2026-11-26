"""
AI Gateway — a pluggable, multi-provider and MCP-capable layer for every AI feature in the
platform (news drafting, content generation, search answers, RSS editorial drafts, quizzes).

Design goals
------------
* 18+ providers and local/cloud gateways out of the box (Gemini, OpenAI, Anthropic, Perplexity,
  Qwen, Cohere, Azure OpenAI, Groq, Mistral, DeepSeek, xAI, OpenRouter, Together, Fireworks,
  Cerebras, GitHub Models, Ollama, LM Studio, LiteLLM/vLLM, and outbound MCP AI servers).
* Automatic fallback: providers are tried in priority order with search-capable providers
  prioritized for research calls and non-search providers seamlessly available as fallback.
* No SDK dependency: every call is plain HTTP via `requests` (JSON REST or Streamable HTTP
  JSON-RPC 2.0 for MCP), so the system works cleanly without vendor-specific SDK locks.
"""
from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional, Tuple

import requests

from app.common.ssrf import validate_provider_endpoint

logger = logging.getLogger("AIGateway")

PROVIDERS_SETTING_KEY = "AI_PROVIDERS_JSON"
VALID_PROVIDER_STYLES = ("openai", "gemini", "anthropic", "mcp")
MCP_PROTOCOL_VERSION = "2024-11-05"

# Engines that must NEVER be auto-published: template/local extraction or untagged output.
NON_TRUSTED_ENGINES = {"local", "fallback", "unknown", "mock", "template", ""}


@dataclass
class AIProvider:
    id: str
    label: str
    style: str                       # 'openai' | 'gemini' | 'anthropic' | 'mcp'
    model: str
    base_url: str = ""
    api_key: str = ""
    enabled: bool = False
    temperature: float = 0.5
    max_tokens: int = 4096
    supports_search: bool = False    # web-grounded research supported by this provider
    requires_key: bool = True        # False for local servers like Ollama, LM Studio, or local MCP

    def is_configured(self) -> bool:
        if not self.requires_key:
            return bool((self.base_url or "").strip())
        if self.style == "mcp":
            return bool((self.base_url or "").strip()) and bool((self.api_key or "").strip())
        return bool((self.api_key or "").strip())

    def engine(self) -> str:
        return f"{self.id}:{self.model}"


# --------------------------------------------------------------------------- built-in catalog
# Array order == fallback priority. Only Gemini is enabled by default (via the legacy key);
# everything else starts disabled until the editor configures a vendor or MCP bridge.
DEFAULT_PROVIDERS: List[Dict[str, Any]] = [
    {"id": "gemini", "label": "Google Gemini", "style": "gemini", "model": "gemini-3-flash-preview",
     "base_url": "https://generativelanguage.googleapis.com", "enabled": True, "supports_search": False},
    {"id": "openai", "label": "OpenAI", "style": "openai", "model": "gpt-4o-mini",
     "base_url": "https://api.openai.com/v1"},
    {"id": "anthropic", "label": "Anthropic Claude", "style": "anthropic", "model": "claude-sonnet-4-20250514",
     "base_url": "https://api.anthropic.com"},
    {"id": "perplexity", "label": "Perplexity Sonar", "style": "openai", "model": "sonar",
     "base_url": "https://api.perplexity.ai", "supports_search": True},
    {"id": "groq", "label": "Groq", "style": "openai", "model": "llama-3.3-70b-versatile",
     "base_url": "https://api.groq.com/openai/v1"},
    {"id": "mistral", "label": "Mistral AI", "style": "openai", "model": "mistral-large-latest",
     "base_url": "https://api.mistral.ai/v1"},
    {"id": "deepseek", "label": "DeepSeek", "style": "openai", "model": "deepseek-chat",
     "base_url": "https://api.deepseek.com/v1"},
    {"id": "xai", "label": "xAI Grok", "style": "openai", "model": "grok-2-latest",
     "base_url": "https://api.x.ai/v1"},
    {"id": "qwen", "label": "Alibaba Qwen", "style": "openai", "model": "qwen-plus",
     "base_url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"},
    {"id": "cohere", "label": "Cohere", "style": "openai", "model": "command-a-03-2025",
     "base_url": "https://api.cohere.ai/compatibility/v1"},
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
    {"id": "azure-openai", "label": "Azure OpenAI", "style": "openai", "model": "gpt-4o-mini",
     "base_url": "https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-10-21"},
    {"id": "ollama", "label": "Ollama (local)", "style": "openai", "model": "llama3.1",
     "base_url": "http://localhost:11434/v1", "requires_key": False},
    {"id": "lmstudio", "label": "LM Studio (local)", "style": "openai", "model": "local-model",
     "base_url": "http://localhost:1234/v1", "requires_key": False},
    {"id": "litellm", "label": "LiteLLM / vLLM", "style": "openai", "model": "gpt-4o-mini",
     "base_url": "http://localhost:4000/v1", "requires_key": False},
    {"id": "mcp-server", "label": "MCP AI Server", "style": "mcp", "model": "auto",
     "base_url": "http://localhost:3100/mcp", "supports_search": True, "requires_key": False},
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
        style = str(d.get("style") or "openai").strip().lower()
        if style not in VALID_PROVIDER_STYLES:
            raise ValueError(f"Unsupported provider style '{style}'. Allowed: {', '.join(VALID_PROVIDER_STYLES)}")
        d["style"] = style
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
    headers: Dict[str, str] = {"Content-Type": "application/json"}
    key = (p.api_key or "").strip()
    if key:
        headers["Authorization"] = f"Bearer {key}"
        headers["x-api-key"] = key          # Anthropic & compatible gateways
        headers["x-goog-api-key"] = key     # Google Gemini REST API
        base_lower = (p.base_url or "").lower()
        if ".openai.azure.com" in base_lower or "api-version=" in base_lower:
            headers["api-key"] = key        # Azure OpenAI REST API
    headers["anthropic-version"] = "2023-06-01"
    return headers


def _effective_max_tokens(p: AIProvider, max_tokens: Optional[int]) -> int:
    base = int(p.max_tokens or 4096)
    if base <= 2048:
        base = 4096
    return max(base, int(max_tokens)) if max_tokens else base


def _split_url_query(url: str) -> Tuple[str, str]:
    path_part, sep, query = (url or "").strip().partition("?")
    return path_part.rstrip("/"), f"{sep}{query}" if sep else ""


def _openai_chat_url(base_url: str) -> str:
    clean, query = _split_url_query(base_url or "https://api.openai.com/v1")
    if clean.endswith("/chat/completions") or clean.endswith("/completions") or clean.endswith("/responses"):
        return f"{clean}{query}"
    return f"{clean}/chat/completions{query}"


def _openai_models_url(base_url: str) -> str:
    clean, query = _split_url_query(base_url or "https://api.openai.com/v1")
    for suffix in ("/chat/completions", "/completions", "/responses"):
        if clean.endswith(suffix):
            clean = clean[: -len(suffix)]
            break
    return f"{clean}/models{query}"


def _anthropic_base_url(base_url: str) -> str:
    clean = (base_url or "https://api.anthropic.com").strip().rstrip("/")
    for suffix in ("/v1/messages", "/messages"):
        if clean.endswith(suffix):
            return clean[: -len(suffix)]
    if clean.endswith("/v1"):
        return clean[:-3]
    return clean or "https://api.anthropic.com"


def _anthropic_messages_url(base_url: str) -> str:
    return f"{_anthropic_base_url(base_url)}/v1/messages"


def _gemini_base_url(base_url: str) -> str:
    clean = (base_url or "https://generativelanguage.googleapis.com").strip().rstrip("/")
    if clean.endswith("/v1beta"):
        clean = clean[:-7]
    return clean or "https://generativelanguage.googleapis.com"


def _is_reasoning_model(model_name: str) -> bool:
    leaf = (model_name or "").strip().lower().split("/")[-1].split(":")[-1]
    return leaf.startswith(("o1", "o3", "o4", "gpt-5"))


def _extract_openai_text(data: Dict[str, Any]) -> str:
    choices = data.get("choices") or []
    if choices and isinstance(choices[0], dict):
        msg = choices[0].get("message") or {}
        content = msg.get("content")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts = [
                part.get("text", "")
                for part in content
                if isinstance(part, dict) and part.get("type") in ("text", "output_text", None)
            ]
            return "".join(parts)
        if isinstance(choices[0].get("text"), str):
            return choices[0]["text"]
    if isinstance(data.get("output_text"), str):
        return data["output_text"]
    output = data.get("output") or []
    if isinstance(output, list):
        chunks = []
        for item in output:
            if not isinstance(item, dict):
                continue
            for part in item.get("content") or []:
                if isinstance(part, dict) and isinstance(part.get("text"), str):
                    chunks.append(part["text"])
        if chunks:
            return "".join(chunks)
    return ""


def _call_openai(p: AIProvider, prompt: str, system: Optional[str], timeout: float,
                 max_tokens: Optional[int] = None) -> str:
    messages = ([{"role": "system", "content": system}] if system else []) + \
               [{"role": "user", "content": prompt}]
    eff_tokens = _effective_max_tokens(p, max_tokens)
    body: Dict[str, Any] = {"model": p.model, "messages": messages}
    if _is_reasoning_model(p.model):
        body["max_completion_tokens"] = eff_tokens
    else:
        body["temperature"] = p.temperature
        body["max_tokens"] = eff_tokens

    url = _openai_chat_url(p.base_url)
    headers = _headers_auth(p)
    r = requests.post(url, headers=headers, json=body, timeout=timeout)
    if r.status_code == 400:
        err_text = (r.text or "").lower()
        retry_body = dict(body)
        retried = False
        if "max_completion_tokens" in err_text and "max_tokens" in retry_body:
            retry_body["max_completion_tokens"] = retry_body.pop("max_tokens")
            retried = True
        if "temperature" in err_text and "temperature" in retry_body:
            retry_body.pop("temperature", None)
            retried = True
        if retried:
            r = requests.post(url, headers=headers, json=retry_body, timeout=timeout)
    r.raise_for_status()
    return _extract_openai_text(r.json())


def _call_anthropic(p: AIProvider, prompt: str, system: Optional[str], timeout: float,
                    max_tokens: Optional[int] = None) -> str:
    body: Dict[str, Any] = {
        "model": p.model,
        "max_tokens": _effective_max_tokens(p, max_tokens),
        "temperature": p.temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        body["system"] = system
    headers = {"Content-Type": "application/json", "anthropic-version": "2023-06-01"}
    if (p.api_key or "").strip():
        headers["x-api-key"] = p.api_key.strip()
    r = requests.post(_anthropic_messages_url(p.base_url), headers=headers, json=body, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    parts = data.get("content") or []
    return "".join(b.get("text", "") for b in parts if isinstance(b, dict) and b.get("type") == "text")


GEMINI_FALLBACK_MODELS: Tuple[str, ...] = (
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
)

# Short per-process cooldown so timed-out or quota-exhausted Gemini models are skipped for 5 mins.
_MODEL_COOLDOWN_UNTIL: Dict[str, float] = {}


def _call_gemini_with_model(
    p: AIProvider,
    prompt: str,
    system: Optional[str],
    timeout: float,
    use_search: bool,
    max_tokens: Optional[int] = None,
) -> Tuple[str, str]:
    body: Dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": p.temperature, "maxOutputTokens": _effective_max_tokens(p, max_tokens)},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    if use_search and p.supports_search:
        body["tools"] = [{"google_search": {}}]

    ordered: List[str] = []
    for m in (p.model, *GEMINI_FALLBACK_MODELS):
        if m and m not in ordered:
            ordered.append(m)

    now = time.monotonic()
    candidates = [m for m in ordered if _MODEL_COOLDOWN_UNTIL.get(m, 0.0) <= now] or ordered
    base = _gemini_base_url(p.base_url)
    headers: Dict[str, str] = {"Content-Type": "application/json"}
    if (p.api_key or "").strip():
        headers["x-goog-api-key"] = p.api_key.strip()

    last_exc: Optional[Exception] = None
    for idx, model_name in enumerate(candidates):
        try:
            attempt_timeout = min(timeout, 25.0) if idx < len(candidates) - 1 else timeout
            r = requests.post(
                f"{base}/v1beta/models/{model_name}:generateContent",
                headers=headers,
                json=body,
                timeout=attempt_timeout,
            )
            r.raise_for_status()
            _MODEL_COOLDOWN_UNTIL.pop(model_name, None)
            data = r.json()
            cand = (data.get("candidates") or [{}])[0]
            parts = (cand.get("content") or {}).get("parts") or []
            setattr(p, "_used_model", model_name)
            return "".join(pt.get("text", "") for pt in parts if isinstance(pt, dict)), model_name
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else 0
            last_exc = exc
            if status in (404, 429, 500, 502, 503, 504) and idx < len(candidates) - 1:
                _MODEL_COOLDOWN_UNTIL[model_name] = time.monotonic() + 300.0
                logger.warning(f"Gemini model {model_name} failed (HTTP {status}); trying fallback model.")
                continue
            raise
        except requests.RequestException as exc:
            last_exc = exc
            if idx < len(candidates) - 1:
                _MODEL_COOLDOWN_UNTIL[model_name] = time.monotonic() + 300.0
                logger.warning(f"Gemini model {model_name} request error ({type(exc).__name__}); trying fallback model.")
                continue
            raise
    if last_exc:
        raise last_exc
    return "", p.model


def _call_gemini(p: AIProvider, prompt: str, system: Optional[str], timeout: float, use_search: bool,
                 max_tokens: Optional[int] = None) -> str:
    text, _used_model = _call_gemini_with_model(
        p, prompt, system, timeout, use_search, max_tokens=max_tokens
    )
    return text


# --------------------------------------------------------------------------- MCP JSON-RPC client
def _mcp_headers(p: AIProvider, session_id: Optional[str] = None) -> Dict[str, str]:
    headers = _headers_auth(p)
    headers["Accept"] = "application/json, text/event-stream"
    if session_id:
        headers["Mcp-Session-Id"] = session_id
    return headers


def _parse_mcp_response(resp: requests.Response) -> Dict[str, Any]:
    if resp.status_code == 202 or not (resp.text or "").strip():
        return {}
    ctype = (resp.headers.get("Content-Type") or "").lower()
    raw = resp.text.strip()
    if "text/event-stream" in ctype or raw.startswith("data:") or raw.startswith("event:"):
        last_msg: Dict[str, Any] = {}
        for line in raw.splitlines():
            line = line.strip()
            if not line.startswith("data:"):
                continue
            data_str = line[5:].strip()
            if not data_str or data_str == "[DONE]":
                continue
            try:
                parsed = json.loads(data_str)
                if isinstance(parsed, dict) and ("result" in parsed or "error" in parsed):
                    last_msg = parsed
            except ValueError:
                continue
        if last_msg:
            return last_msg
    return resp.json()


def _mcp_rpc(
    p: AIProvider,
    payload: Dict[str, Any],
    timeout: float,
    session_id: Optional[str] = None,
) -> Tuple[Dict[str, Any], Optional[str]]:
    url = (p.base_url or "").strip()
    if not url:
        raise ValueError(f"MCP provider '{p.id}' has no base_url configured")
    resp = requests.post(url, headers=_mcp_headers(p, session_id), json=payload, timeout=timeout)
    resp.raise_for_status()
    next_sid = resp.headers.get("Mcp-Session-Id") or session_id
    body = _parse_mcp_response(resp)
    if isinstance(body, dict) and body.get("error"):
        err = body["error"]
        msg = err.get("message") if isinstance(err, dict) else str(err)
        code = err.get("code") if isinstance(err, dict) else None
        raise RuntimeError(f"MCP RPC error ({code}): {msg}")
    return body if isinstance(body, dict) else {}, next_sid


def _mcp_connect(p: AIProvider, timeout: float) -> Tuple[Optional[str], Dict[str, Any]]:
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": MCP_PROTOCOL_VERSION,
            "capabilities": {"sampling": {}},
            "clientInfo": {"name": "CamTechBlog-AIGateway", "version": "1.0.0"},
        },
    }
    data, session_id = _mcp_rpc(p, init_req, timeout=min(timeout, 20.0))
    try:
        _mcp_rpc(
            p,
            {"jsonrpc": "2.0", "method": "notifications/initialized", "params": {}},
            timeout=min(timeout, 10.0),
            session_id=session_id,
        )
    except Exception:
        pass
    return session_id, data.get("result") or {}


def _mcp_list_tools(p: AIProvider, timeout: float, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
    sid = session_id
    if sid is None:
        sid, _ = _mcp_connect(p, timeout)
    try:
        data, _ = _mcp_rpc(
            p,
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}},
            timeout=min(timeout, 20.0),
            session_id=sid,
        )
    except Exception:
        return []
    result = data.get("result") or {}
    tools = result.get("tools") or []
    return [t for t in tools if isinstance(t, dict) and t.get("name")]


def _extract_mcp_text(result: Any) -> str:
    if isinstance(result, str):
        return result
    if not isinstance(result, dict):
        return ""
    if result.get("isError"):
        err_chunks = _extract_mcp_text({"content": result.get("content")})
        raise RuntimeError(f"MCP tool error: {err_chunks or 'unknown tool failure'}")
    content = result.get("content")
    if isinstance(content, list):
        chunks = [
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and isinstance(item.get("text"), str)
        ]
        if chunks:
            return "\n".join(chunks)
    elif isinstance(content, dict) and isinstance(content.get("text"), str):
        return content["text"]
    elif isinstance(content, str):
        return content
    for key in ("completion", "output_text", "output", "text", "response", "answer"):
        val = result.get(key)
        if isinstance(val, str) and val.strip():
            return val
    if "structuredContent" in result:
        return json.dumps(result["structuredContent"], ensure_ascii=False)
    return ""


def _build_mcp_tool_args(
    schema: Dict[str, Any],
    prompt: str,
    system: Optional[str],
    use_search: bool,
) -> Dict[str, Any]:
    props = schema.get("properties") if isinstance(schema, dict) else None
    if not isinstance(props, dict) or not props:
        args: Dict[str, Any] = {"prompt": prompt}
        if system:
            args["system"] = system
        return args

    out: Dict[str, Any] = {}
    prompt_candidates = ("prompt", "query", "question", "message", "input", "text", "topic", "instruction", "content")
    chosen_key = next((k for k in prompt_candidates if k in props), None)
    if not chosen_key:
        required = schema.get("required") or []
        chosen_key = next((k for k in required if k in props), None) or next(iter(props))
    out[chosen_key] = prompt

    if system:
        for sys_key in ("system", "systemPrompt", "system_prompt"):
            if sys_key in props:
                out[sys_key] = system
                break
    if "use_search" in props:
        out["use_search"] = bool(use_search)
    return out


def _pick_mcp_tool(tools: List[Dict[str, Any]], configured_model: str, use_search: bool) -> Optional[Dict[str, Any]]:
    target = (configured_model or "").strip()
    if target.startswith("tool:"):
        target = target[5:].strip()
    if target and target.lower() not in ("auto", "default", "sampling"):
        for tool in tools:
            if tool.get("name") == target:
                return tool

    preferred_terms = (
        ("search", "research", "web", "ask", "generate", "chat", "complete", "answer", "prompt")
        if use_search
        else ("generate", "ask", "chat", "complete", "answer", "prompt", "research", "search")
    )
    best_tool: Optional[Dict[str, Any]] = None
    best_score = 0
    for tool in tools:
        hay = f"{tool.get('name', '')} {tool.get('description', '')}".lower()
        score = sum(len(preferred_terms) - idx for idx, term in enumerate(preferred_terms) if term in hay)
        if score > best_score:
            best_score = score
            best_tool = tool
    return best_tool


def _call_mcp(
    p: AIProvider,
    prompt: str,
    system: Optional[str],
    timeout: float,
    use_search: bool,
    max_tokens: Optional[int] = None,
) -> str:
    session_id, _init_result = _mcp_connect(p, timeout)
    target = (p.model or "").strip()
    tools: List[Dict[str, Any]] = []
    if target.startswith("tool:") or target.lower() not in ("sampling",):
        tools = _mcp_list_tools(p, timeout, session_id=session_id)

    chosen_tool = _pick_mcp_tool(tools, target, use_search)
    if chosen_tool is None and target.startswith("tool:"):
        chosen_tool = {"name": target[5:].strip(), "inputSchema": {}}

    # Prefer sampling/createMessage if requested or when no dedicated prompt/search tool was specified/matched.
    use_sampling_first = target.lower() == "sampling" or (not target.startswith("tool:") and chosen_tool is None)
    if use_sampling_first:
        sampling_params: Dict[str, Any] = {
            "messages": [{"role": "user", "content": {"type": "text", "text": prompt}}],
            "maxTokens": _effective_max_tokens(p, max_tokens),
            "temperature": p.temperature,
        }
        if system:
            sampling_params["systemPrompt"] = system
        if target and target.lower() not in ("auto", "default", "sampling"):
            sampling_params["modelPreferences"] = {"hints": [{"name": target}]}
        try:
            data, session_id = _mcp_rpc(
                p,
                {"jsonrpc": "2.0", "id": 3, "method": "sampling/createMessage", "params": sampling_params},
                timeout=timeout,
                session_id=session_id,
            )
            text = _extract_mcp_text(data.get("result") or {})
            if text.strip():
                setattr(p, "_used_model", f"sampling:{target or 'auto'}")
                return text
        except RuntimeError:
            if not tools:
                raise
            chosen_tool = chosen_tool or tools[0]

    if chosen_tool is not None:
        args = _build_mcp_tool_args(chosen_tool.get("inputSchema") or {}, prompt, system, use_search)
        data, _ = _mcp_rpc(
            p,
            {
                "jsonrpc": "2.0",
                "id": 4,
                "method": "tools/call",
                "params": {"name": chosen_tool["name"], "arguments": args},
            },
            timeout=timeout,
            session_id=session_id,
        )
        text = _extract_mcp_text(data.get("result") or {})
        setattr(p, "_used_model", f"tool:{chosen_tool['name']}")
        return text

    raise RuntimeError(f"MCP provider '{p.id}' exposes neither sampling/createMessage nor compatible tools")


def call_provider(p: AIProvider, prompt: str, *, system: Optional[str] = None,
                  use_search: bool = False, timeout: float = 60.0,
                  max_tokens: Optional[int] = None) -> str:
    if p.style == "gemini":
        return _call_gemini(p, prompt, system, timeout, use_search, max_tokens=max_tokens)
    if p.style == "anthropic":
        return _call_anthropic(p, prompt, system, timeout, max_tokens=max_tokens)
    if p.style == "mcp":
        return _call_mcp(p, prompt, system, timeout, use_search, max_tokens=max_tokens)
    return _call_openai(p, prompt, system, timeout, max_tokens=max_tokens)


# --------------------------------------------------------------------------- public API
def generate_text(prompt: str, *, system: Optional[str] = None, use_search: bool = False,
                  timeout: float = 60.0, only: Optional[str] = None,
                  max_tokens: Optional[int] = None) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Try each enabled+configured provider in order; return (text, provider_meta) or (None, errors).

    When ``use_search=True`` and ``only`` is unset, providers with ``supports_search=True`` are
    tried first (Gemini Search, Perplexity, search-capable MCP bridges, etc.) and remaining active
    providers automatically act as fallback so any vendor can power the pipeline.
    """
    from app.common.database import SessionLocal
    db = SessionLocal()
    try:
        providers = load_providers(db)
    finally:
        db.close()

    scoped = [p for p in providers if (not only or p.id == only) and p.enabled]
    if use_search and not only:
        ordered = [p for p in scoped if p.supports_search] + [p for p in scoped if not p.supports_search]
    else:
        ordered = scoped

    errors = []
    for p in ordered:
        if not p.is_configured():
            errors.append(f"{p.id}: no key/base_url")
            continue
        effective_search = bool(use_search and p.supports_search)
        try:
            text = call_provider(
                p, prompt, system=system, use_search=effective_search,
                timeout=timeout, max_tokens=max_tokens,
            )
            used_model = getattr(p, "_used_model", p.model)
            if text and text.strip():
                return text, {
                    "provider": p.id,
                    "label": p.label,
                    "model": used_model,
                    "engine": f"{p.id}:{used_model}",
                }
            errors.append(f"{p.id}: empty response")
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "?"
            errors.append(f"{p.id}: HTTP {status}")
        except Exception as e:  # noqa: BLE001 - one bad provider must not stop the rest
            errors.append(f"{p.id}: {str(e)[:120]}")
    return None, {"error": "no_provider_succeeded", "details": errors}


def generate_json(prompt: str, *, system: Optional[str] = None, use_search: bool = False,
                  timeout: float = 60.0, only: Optional[str] = None,
                  max_tokens: Optional[int] = None) -> Tuple[Any, Optional[Dict[str, Any]]]:
    text, meta = generate_text(prompt, system=system, use_search=use_search,
                               timeout=timeout, only=only, max_tokens=max_tokens)
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


def has_search_provider() -> bool:
    from app.common.database import SessionLocal
    with SessionLocal() as db:
        return any(p.enabled and p.is_configured() and p.supports_search
                   for p in load_providers(db))


def _find_provider(provider_id: str) -> Optional[AIProvider]:
    from app.common.database import SessionLocal
    with SessionLocal() as db:
        return next((p for p in load_providers(db) if p.id == provider_id), None)


def discover_provider_models(provider_id: str, timeout: float = 15.0) -> Dict[str, Any]:
    """Discover available models (or MCP tools) from a saved provider endpoint."""
    p = _find_provider(provider_id)
    if not p:
        return {"ok": False, "provider": provider_id, "models": [], "detail": "Provider not found"}
    if not p.is_configured():
        return {"ok": False, "provider": provider_id, "models": [], "detail": "Provider missing key or base URL"}

    try:
        if p.style == "mcp":
            tools = _mcp_list_tools(p, timeout=timeout)
            names = [f"tool:{t['name']}" for t in tools]
            return {
                "ok": True,
                "provider": p.id,
                "style": p.style,
                "models": ["auto", "sampling", *names],
                "tools": [{"name": t["name"], "description": t.get("description", "")} for t in tools],
            }

        if p.style == "gemini":
            headers = {"Content-Type": "application/json"}
            if (p.api_key or "").strip():
                headers["x-goog-api-key"] = p.api_key.strip()
            r = requests.get(f"{_gemini_base_url(p.base_url)}/v1beta/models", headers=headers, timeout=timeout)
            r.raise_for_status()
            rows = r.json().get("models") or []
            models = [
                str(m.get("name", "")).removeprefix("models/")
                for m in rows
                if isinstance(m, dict) and m.get("name")
                and "generateContent" in (m.get("supportedGenerationMethods") or ["generateContent"])
            ]
            return {"ok": True, "provider": p.id, "style": p.style, "models": models}

        if p.style == "anthropic":
            headers = {"Content-Type": "application/json", "anthropic-version": "2023-06-01"}
            if (p.api_key or "").strip():
                headers["x-api-key"] = p.api_key.strip()
            r = requests.get(f"{_anthropic_base_url(p.base_url)}/v1/models", headers=headers, timeout=timeout)
            r.raise_for_status()
            rows = r.json().get("data") or []
            models = [m["id"] for m in rows if isinstance(m, dict) and m.get("id")]
            return {"ok": True, "provider": p.id, "style": p.style, "models": models}

        r = requests.get(_openai_models_url(p.base_url), headers=_headers_auth(p), timeout=timeout)
        r.raise_for_status()
        payload = r.json()
        rows = payload.get("data") or payload.get("models") or []
        models = [
            m.get("id") or m.get("name")
            for m in rows
            if isinstance(m, dict) and (m.get("id") or m.get("name"))
        ]
        return {"ok": True, "provider": p.id, "style": p.style, "models": models}
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "provider": provider_id, "models": [], "detail": str(exc)[:180]}


def test_provider(provider_id: str) -> Dict[str, Any]:
    """Ping a single provider (or verify MCP handshake + tools); used by Admin 'Test'."""
    p = _find_provider(provider_id)
    text, meta = generate_text("Reply with exactly the word: OK", use_search=False,
                               timeout=25.0, only=provider_id)
    if text is not None and meta:
        return {"ok": True, "provider": meta["provider"], "model": meta["model"],
                "sample": text[:80]}

    # Tool-only MCP servers may not implement sampling/createMessage; verify handshake + tools/list.
    if p and p.style == "mcp" and p.enabled and p.is_configured():
        try:
            sid, init_res = _mcp_connect(p, timeout=15.0)
            tools = _mcp_list_tools(p, timeout=15.0, session_id=sid)
            srv_name = ((init_res.get("serverInfo") or {}).get("name")) or "MCP server"
            return {
                "ok": True,
                "provider": p.id,
                "model": f"mcp:{len(tools)} tools",
                "sample": f"Connected to {srv_name} ({len(tools)} tools)",
            }
        except Exception as exc:  # noqa: BLE001
            return {"ok": False, "provider": provider_id, "detail": [str(exc)[:180]]}

    detail = (meta or {}).get("details", []) if meta else ["provider not found or disabled"]
    return {"ok": False, "provider": provider_id, "detail": detail}


def test_all_providers() -> Dict[str, Any]:
    """Ping every enabled and configured provider in priority order."""
    from app.common.database import SessionLocal
    with SessionLocal() as db:
        configured = [p for p in load_providers(db) if p.enabled and p.is_configured()]
    results = [test_provider(p.id) for p in configured]
    return {
        "results": results,
        "ok_count": sum(1 for r in results if r.get("ok")),
        "total_tested": len(results),
    }


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
