"""Built-in Model Context Protocol (MCP) Streamable HTTP server for CamTechBlog.

Exposes public READ tools/resources strictly scoped to ``PUBLISHED`` content, plus
authenticated editorial/infrastructure Admin tools gated by verified JWT roles.
Implements MCP JSON-RPC 2.0 (``initialize``, ``ping``, ``notifications/initialized``,
``tools/list``, ``tools/call``, ``resources/list``, ``resources/read``,
``prompts/list``, ``prompts/get``) at ``/api/v1/mcp``.
"""
from __future__ import annotations

import asyncio
import json
import uuid
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy import desc, func
from sqlalchemy.orm import Session, joinedload

from app.common.database import get_db
from app.models.article import Article
from app.models.discovery import Discovery
from app.models.location import Destination
from app.models.place import Place
from app.models.source import Source
from app.models.user import User
from app.services import ai_gateway, bilingual_service
from app.services.ai_news_service import ai_news_service
from app.services.article_service import ArticleService
from app.services.auth_service import get_current_user
from app.services.trending_service import TrendingService

router = APIRouter(prefix="/mcp", tags=["Model Context Protocol (MCP)"])

MCP_PROTOCOL_VERSION = "2024-11-05"
SERVER_INFO = {"name": "camtech-blog-mcp", "version": "1.0.0"}

_EDITORIAL_ROLES = {"SUPER_ADMIN", "ADMIN", "EDITOR", "JOURNALIST", "REVIEWER"}
_INFRA_ROLES = {"SUPER_ADMIN", "ADMIN"}


def _is_editorial_admin(user: Optional[User]) -> bool:
    return bool(user and (user.is_superuser or user.role in _EDITORIAL_ROLES))


def _is_infra_admin(user: Optional[User]) -> bool:
    return bool(user and (user.is_superuser or user.role in _INFRA_ROLES))


def _ok_rpc(req_id: Any, result: Any) -> Dict[str, Any]:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _err_rpc(req_id: Any, code: int, message: str, data: Any = None) -> Dict[str, Any]:
    err: Dict[str, Any] = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    return {"jsonrpc": "2.0", "id": req_id, "error": err}


def _tool_result(data: Any) -> Dict[str, Any]:
    return {
        "content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False, indent=2)}],
        "structuredContent": data,
        "isError": False,
    }


def _serialize_article_summary(art: Article) -> Dict[str, Any]:
    return {
        "slug": art.slug,
        "title": art.title,
        "title_km": art.title_km,
        "summary": art.summary,
        "summary_km": art.summary_km,
        "country": art.country,
        "category": art.category.slug if art.category else None,
        "source": art.source_attribution_text or (art.primary_source.name if art.primary_source else None),
        "source_url": art.primary_source_url,
        "published_at": art.published_at.isoformat() if art.published_at else None,
    }


def _public_tools() -> List[Dict[str, Any]]:
    return [
        {
            "name": "search_news",
            "description": "Search published CamTechBlog articles across Cambodia, ASEAN, Thailand-Cambodia, AI, and Tech desks.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Keyword search across English and Khmer headlines/body"},
                    "country": {"type": "string", "description": "Filter code such as KH, TH, ASEAN, WORLD"},
                    "category_slug": {"type": "string", "description": "Category slug (technology, blockchain, cambodia, thailand-cambodia, asean)"},
                    "limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 6},
                },
            },
        },
        {
            "name": "get_article",
            "description": "Fetch full bilingual (English + Khmer) content for a published article by slug.",
            "inputSchema": {
                "type": "object",
                "required": ["slug"],
                "properties": {
                    "slug": {"type": "string", "description": "Article URL slug"},
                },
            },
        },
        {
            "name": "get_trending",
            "description": "Get top trending Cambodia and World published stories.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "minimum": 1, "maximum": 12, "default": 5},
                },
            },
        },
        {
            "name": "list_discoveries",
            "description": "List published Science, Tech, and How-Things-Work visual explainer guides.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Optional Discovery category filter"},
                    "limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 6},
                },
            },
        },
        {
            "name": "list_cambodia_places",
            "description": "Search active Cambodia tourism guides and places.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Place name or keyword"},
                    "destination_slug": {"type": "string", "description": "Province/city slug such as siem-reap or phnom-penh"},
                    "limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 8},
                },
            },
        },
    ]


def _editorial_tools() -> List[Dict[str, Any]]:
    return [
        {
            "name": "ask_ai",
            "description": "[Admin] Run an AI completion through CamTechBlog's multi-provider fallback gateway.",
            "inputSchema": {
                "type": "object",
                "required": ["prompt"],
                "properties": {
                    "prompt": {"type": "string"},
                    "system": {"type": "string"},
                    "provider_id": {"type": "string", "description": "Optional specific provider ID from AI Providers"},
                    "use_search": {"type": "boolean", "default": False},
                    "max_tokens": {"type": "integer", "minimum": 64, "maximum": 16000, "default": 2048},
                },
            },
        },
        {
            "name": "pipeline_health",
            "description": "[Admin] Inspect article workflow counts, Khmer bilingual coverage, active sources, and active AI providers.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "trigger_khmer_backfill",
            "description": "[Admin] Translate missing or incomplete Khmer fields across recent published/draft articles and discoveries.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "article_limit": {"type": "integer", "minimum": 1, "maximum": 20, "default": 5},
                    "discovery_limit": {"type": "integer", "minimum": 0, "maximum": 10, "default": 2},
                },
            },
        },
        {
            "name": "trigger_desk_scan",
            "description": "[Admin] Generate new AI_DRAFT stories for a news desk using configured AI providers.",
            "inputSchema": {
                "type": "object",
                "required": ["category_slug"],
                "properties": {
                    "category_slug": {"type": "string"},
                    "count": {"type": "integer", "minimum": 1, "maximum": 5, "default": 2},
                },
            },
        },
    ]


def _infra_tools() -> List[Dict[str, Any]]:
    return [
        {
            "name": "list_ai_providers",
            "description": "[Infra Admin] List configured AI providers in fallback order with secrets masked.",
            "inputSchema": {"type": "object", "properties": {}},
        },
    ]


def _tools_for_user(user: Optional[User]) -> List[Dict[str, Any]]:
    tools = _public_tools()
    if _is_editorial_admin(user):
        tools.extend(_editorial_tools())
    if _is_infra_admin(user):
        tools.extend(_infra_tools())
    return tools


async def _execute_tool(
    name: str,
    args: Dict[str, Any],
    db: Session,
    user: Optional[User],
) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, str]]]:
    if name == "search_news":
        limit = max(1, min(int(args.get("limit") or 6), 20))
        rows, total = ArticleService.get_articles(
            db,
            country=args.get("country"),
            category_slug=args.get("category_slug"),
            search=args.get("query"),
            status="PUBLISHED",
            limit=limit,
        )
        return _tool_result({"total": total, "articles": [_serialize_article_summary(a) for a in rows]}), None

    if name == "get_article":
        slug = str(args.get("slug") or "").strip()
        if not slug:
            return None, (-32602, "Missing required argument: slug")
        art = ArticleService.get_article_by_slug(db, slug)
        if not art or art.status != "PUBLISHED":
            return None, (-32004, f"Published article '{slug}' not found")
        payload = _serialize_article_summary(art)
        payload["content"] = art.content
        payload["content_km"] = art.content_km
        payload["why_it_matters"] = art.why_it_matters
        return _tool_result(payload), None

    if name == "get_trending":
        limit = max(1, min(int(args.get("limit") or 5), 12))
        return _tool_result(TrendingService.get_trending_items(db, limit=limit)), None

    if name == "list_discoveries":
        limit = max(1, min(int(args.get("limit") or 6), 20))
        q = db.query(Discovery).filter(Discovery.is_published == 1)
        if args.get("category"):
            q = q.filter(Discovery.category.ilike(f"%{args['category']}%"))
        rows = q.order_by(desc(Discovery.published_at), desc(Discovery.created_at)).limit(limit).all()
        return _tool_result({
            "discoveries": [
                {
                    "slug": d.slug,
                    "title": d.title,
                    "title_km": d.title_km,
                    "category": d.category,
                    "intro": d.intro,
                    "intro_km": d.intro_km,
                }
                for d in rows
            ]
        }), None

    if name == "list_cambodia_places":
        limit = max(1, min(int(args.get("limit") or 8), 20))
        q = db.query(Place).options(joinedload(Place.destination)).filter(Place.status == "ACTIVE")
        if args.get("destination_slug"):
            q = q.join(Place.destination).filter(Destination.slug == args["destination_slug"])
        if args.get("query"):
            term = f"%{args['query']}%"
            q = q.filter(Place.name.ilike(term) | Place.local_name.ilike(term) | Place.description.ilike(term))
        rows = q.order_by(desc(Place.is_featured), desc(Place.rating)).limit(limit).all()
        return _tool_result({
            "places": [
                {
                    "slug": pl.slug,
                    "name": pl.name,
                    "local_name": pl.local_name,
                    "place_type": pl.place_type,
                    "destination": pl.destination.name if pl.destination else None,
                    "address": pl.address,
                    "rating": pl.rating,
                    "description": pl.description,
                }
                for pl in rows
            ]
        }), None

    # --- Editorial & Infrastructure Admin tools ---
    if name in ("ask_ai", "pipeline_health", "trigger_khmer_backfill", "trigger_desk_scan"):
        if not user:
            return None, (-32001, "Authentication required: supply an Admin Bearer token")
        if not _is_editorial_admin(user):
            return None, (-32003, "Insufficient permissions for editorial MCP tool")

    if name == "list_ai_providers":
        if not user:
            return None, (-32001, "Authentication required: supply an Infrastructure Admin Bearer token")
        if not _is_infra_admin(user):
            return None, (-32003, "Administrator role required for infrastructure MCP tool")
        return _tool_result({
            "providers": [
                {
                    "id": p["id"],
                    "label": p["label"],
                    "style": p["style"],
                    "model": p["model"],
                    "enabled": p["enabled"],
                    "supports_search": p["supports_search"],
                    "requires_key": p["requires_key"],
                    "has_key": p["has_key"],
                }
                for p in ai_gateway.redacted_providers()
            ]
        }), None

    if name == "ask_ai":
        prompt = str(args.get("prompt") or "").strip()
        if not prompt:
            return None, (-32602, "Missing required argument: prompt")
        text, meta = await asyncio.to_thread(
            ai_gateway.generate_text,
            prompt,
            system=args.get("system"),
            use_search=bool(args.get("use_search")),
            only=args.get("provider_id") or None,
            max_tokens=max(64, min(int(args.get("max_tokens") or 2048), 16000)),
        )
        if text is None:
            return None, (-32000, f"AI generation failed: {meta}")
        return _tool_result({"text": text, "meta": meta}), None

    if name == "pipeline_health":
        counts = dict(db.query(Article.status, func.count(Article.id)).group_by(Article.status).all())
        published_total = counts.get("PUBLISHED", 0)
        published_with_km = (
            db.query(func.count(Article.id))
            .filter(Article.status == "PUBLISHED", Article.content_km.isnot(None), Article.content_km != "")
            .scalar()
            or 0
        )
        active_sources = db.query(func.count(Source.id)).filter(Source.is_active == True).scalar() or 0
        active_providers = [
            {"id": p["id"], "style": p["style"], "model": p["model"], "supports_search": p["supports_search"]}
            for p in ai_gateway.redacted_providers()
            if p.get("enabled") and (p.get("has_key") or not p.get("requires_key"))
        ]
        return _tool_result({
            "articles_by_status": counts,
            "published_total": published_total,
            "published_with_content_km": published_with_km,
            "active_sources": active_sources,
            "active_providers": active_providers,
        }), None

    if name == "trigger_khmer_backfill":
        res = await bilingual_service.translate_missing_khmer_batch(
            db,
            article_limit=max(1, min(int(args.get("article_limit") or 5), 20)),
            discovery_limit=max(0, min(int(args.get("discovery_limit") or 2), 10)),
        )
        return _tool_result(res), None

    if name == "trigger_desk_scan":
        cat_slug = str(args.get("category_slug") or "").strip()
        if not cat_slug:
            return None, (-32602, "Missing required argument: category_slug")
        count = max(1, min(int(args.get("count") or 2), 5))
        res = await ai_news_service.generate_news_for_category(cat_slug, count=count)
        return _tool_result(res), None

    return None, (-32601, f"Unknown MCP tool: {name}")


def _list_resources(db: Session) -> List[Dict[str, Any]]:
    resources: List[Dict[str, Any]] = [
        {
            "uri": "camtech://trending",
            "name": "Trending Cambodia & World Stories",
            "mimeType": "application/json",
            "description": "Live top published stories ranked by trend score.",
        }
    ]
    rows, _ = ArticleService.get_articles(db, status="PUBLISHED", limit=10)
    for art in rows:
        resources.append({
            "uri": f"camtech://articles/{art.slug}",
            "name": art.title,
            "mimeType": "application/json",
            "description": art.summary,
        })
    return resources


def _read_resource(uri: str, db: Session) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, str]]]:
    if uri == "camtech://trending":
        payload = TrendingService.get_trending_items(db, limit=6)
        return {"contents": [{"uri": uri, "mimeType": "application/json", "text": json.dumps(payload, ensure_ascii=False)}]}, None
    if uri == "camtech://editorial-status":
        from app.services import seed_sources as _seed_sources
        from app.services.content_quality import body_quality_issue
        pub_rows = (
            db.query(Article.content, Article.summary, Article.why_it_matters)
            .filter(Article.status == "PUBLISHED")
            .all()
        )
        thin_count = sum(1 for r in pub_rows if body_quality_issue(r.content, r.summary, r.why_it_matters))
        payload = {
            "published_total": len(pub_rows),
            "published_thin_count": thin_count,
            "startup_trace": _seed_sources.LAST_STARTUP_TRACE,
        }
        return {"contents": [{"uri": uri, "mimeType": "application/json", "text": json.dumps(payload, ensure_ascii=False)}]}, None
    if uri.startswith("camtech://articles/"):
        slug = uri.removeprefix("camtech://articles/").strip("/")
        art = ArticleService.get_article_by_slug(db, slug)
        if not art or art.status != "PUBLISHED":
            return None, (-32004, f"Published resource not found: {uri}")
        payload = _serialize_article_summary(art)
        payload["content"] = art.content
        payload["content_km"] = art.content_km
        return {"contents": [{"uri": uri, "mimeType": "application/json", "text": json.dumps(payload, ensure_ascii=False)}]}, None
    return None, (-32004, f"Unknown resource URI: {uri}")


_PROMPTS = [
    {
        "name": "cambodia_tech_briefing",
        "description": "Generate an English + Khmer briefing summarizing top Cambodia, ASEAN, and Thailand-Cambodia reporting.",
        "arguments": [{"name": "focus", "description": "Optional topic or sector focus", "required": False}],
    },
    {
        "name": "verify_khmer_article",
        "description": "Check Khmer headline/summary/body fidelity and ensure zero Thai/Lao script leakage.",
        "arguments": [{"name": "slug", "description": "Published article slug", "required": True}],
    },
]


def _get_prompt(name: str, args: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, str]]]:
    if name == "cambodia_tech_briefing":
        focus = args.get("focus") or "Cambodia technology, economy, ASEAN, and border news"
        return {
            "description": "Daily bilingual briefing template",
            "messages": [{
                "role": "user",
                "content": {
                    "type": "text",
                    "text": (
                        f"Use `search_news` and `get_trending` to prepare a verified executive briefing on: {focus}. "
                        "Cite every story's source attribution and summarize key points in both English and Khmer."
                    ),
                },
            }],
        }, None
    if name == "verify_khmer_article":
        slug = str(args.get("slug") or "").strip()
        if not slug:
            return None, (-32602, "Prompt 'verify_khmer_article' requires argument 'slug'")
        return {
            "description": "Khmer script and bilingual completeness audit",
            "messages": [{
                "role": "user",
                "content": {
                    "type": "text",
                    "text": (
                        f"Call `get_article` for slug `{slug}` and inspect `title_km`, `summary_km`, and `content_km` "
                        "to confirm natural formal Khmer without untranslated English paragraphs or foreign-script characters."
                    ),
                },
            }],
        }, None
    return None, (-32601, f"Unknown prompt: {name}")


async def _handle_rpc_message(
    msg: Any,
    db: Session,
    user: Optional[User],
) -> Optional[Dict[str, Any]]:
    if not isinstance(msg, dict):
        return _err_rpc(None, -32600, "Invalid Request")
    req_id = msg.get("id")
    method = msg.get("method")
    params = msg.get("params") if isinstance(msg.get("params"), dict) else {}

    if not isinstance(method, str):
        return _err_rpc(req_id, -32600, "Missing JSON-RPC method")

    # JSON-RPC notification (no id -> no response payload)
    if method.startswith("notifications/") and req_id is None:
        return None

    if method == "initialize":
        return _ok_rpc(req_id, {
            "protocolVersion": MCP_PROTOCOL_VERSION,
            "capabilities": {
                "tools": {"listChanged": False},
                "resources": {"subscribe": False, "listChanged": False},
                "prompts": {"listChanged": False},
            },
            "serverInfo": SERVER_INFO,
        })
    if method == "ping":
        return _ok_rpc(req_id, {})
    if method == "tools/list":
        return _ok_rpc(req_id, {"tools": _tools_for_user(user)})
    if method == "tools/call":
        t_name = str(params.get("name") or "")
        t_args = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}
        res, err = await _execute_tool(t_name, t_args, db, user)
        if err:
            return _err_rpc(req_id, err[0], err[1])
        return _ok_rpc(req_id, res)
    if method == "resources/list":
        return _ok_rpc(req_id, {"resources": _list_resources(db)})
    if method == "resources/read":
        uri = str(params.get("uri") or "").strip()
        res, err = _read_resource(uri, db)
        if err:
            return _err_rpc(req_id, err[0], err[1])
        return _ok_rpc(req_id, res)
    if method == "prompts/list":
        return _ok_rpc(req_id, {"prompts": _PROMPTS})
    if method == "prompts/get":
        p_name = str(params.get("name") or "").strip()
        p_args = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}
        res, err = _get_prompt(p_name, p_args)
        if err:
            return _err_rpc(req_id, err[0], err[1])
        return _ok_rpc(req_id, res)

    return _err_rpc(req_id, -32601, f"Method not found: {method}")


@router.get("")
def mcp_manifest(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Discovery endpoint describing available MCP tools, resources, and prompts."""
    return {
        "protocolVersion": MCP_PROTOCOL_VERSION,
        "serverInfo": SERVER_INFO,
        "transport": "streamable-http",
        "authenticated_role": current_user.role if current_user else None,
        "tools": [t["name"] for t in _tools_for_user(current_user)],
        "prompts": [p["name"] for p in _PROMPTS],
        "resources_count": len(_list_resources(db)),
    }


@router.post("")
async def mcp_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Streamable HTTP JSON-RPC 2.0 endpoint for external MCP clients and agents."""
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(_err_rpc(None, -32700, "Parse error: invalid JSON"), status_code=400)

    session_id = request.headers.get("Mcp-Session-Id") or uuid.uuid4().hex
    headers = {"Mcp-Session-Id": session_id}

    if isinstance(payload, list):
        replies = []
        for item in payload:
            reply = await _handle_rpc_message(item, db, current_user)
            if reply is not None:
                replies.append(reply)
        if not replies:
            return Response(status_code=202, headers=headers)
        return JSONResponse(replies, headers=headers)

    reply = await _handle_rpc_message(payload, db, current_user)
    if reply is None:
        return Response(status_code=202, headers=headers)
    return JSONResponse(reply, headers=headers)
