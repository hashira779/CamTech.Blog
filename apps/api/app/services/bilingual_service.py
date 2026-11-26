"""Bilingual Khmer translation helpers & automatic backfill for Articles and Discoveries.

Ensures every published or AI-drafted story carries natural, formal Khmer across
``title_km``, ``summary_km``, and full Markdown ``content_km`` so switching to Khmer
never displays a Khmer summary followed by an English article body.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.common.html_hygiene import sanitize_stored_html
from app.models.article import Article
from app.models.audit import AuditLog
from app.models.discovery import Discovery
from app.services import ai_gateway

logger = logging.getLogger(__name__)

_KHMER_CHAR_RE = re.compile(r"[\u1780-\u17FF]")


def count_khmer_chars(text: Optional[str]) -> int:
    if not text:
        return 0
    return len(_KHMER_CHAR_RE.findall(str(text)))


def has_khmer_script(text: Optional[str], min_chars: int = 8) -> bool:
    return count_khmer_chars(text) >= min_chars


def article_needs_khmer(article: Article) -> bool:
    """True when an article has English text missing its matching Khmer translation."""
    has_en_body = bool((article.content or "").strip())
    has_en_summary = bool((article.summary or "").strip())
    has_en_title = bool((article.title or "").strip())

    if has_en_title and not has_khmer_script(article.title_km, min_chars=3):
        return True
    if has_en_summary and not has_khmer_script(article.summary_km, min_chars=10):
        return True
    if has_en_body and not has_khmer_script(article.content_km, min_chars=25):
        return True
    return False


def discovery_needs_khmer(discovery: Discovery) -> bool:
    if (discovery.title or "").strip() and not has_khmer_script(discovery.title_km, min_chars=3):
        return True
    if (discovery.intro or "").strip() and not has_khmer_script(discovery.intro_km, min_chars=10):
        return True
    if (discovery.main_explanation or "").strip() and not has_khmer_script(discovery.main_explanation_km, min_chars=25):
        return True
    return False


async def translate_article_to_khmer(
    title: str,
    summary: str,
    content: str,
    source_name: str = "",
) -> Optional[Dict[str, str]]:
    """Translate headline, summary, and full body into formal Cambodian journalism Khmer."""
    if not ai_gateway.has_any_configured_provider():
        return None

    clean_title = str(title or "").strip()
    clean_summary = str(summary or "").strip()
    clean_content = re.sub(r"<[^>]+>", " ", str(content or "")).strip()[:8000]
    if not clean_title and not clean_content:
        return None

    prompt = f"""You are a senior Cambodian journalist and native Khmer translator for CamTech.Blog.
Translate the ENTIRE news story below into clear, natural, formal Khmer journalism.

CRITICAL REQUIREMENTS:
1. Preserve ALL facts, dates, numbers, quotes, proper names (with Khmer pronunciation or kept clearly), and `##` section structure.
2. NEVER summarize or omit paragraphs when translating `content_km` — translate the complete body faithfully into natural Khmer.
3. Source outlet: {source_name or "Verified Newsroom"}

English Headline: {clean_title}
English Summary: {clean_summary}
English Article Body:
{clean_content}

Return ONLY valid JSON with keys:
- "title_km": Formal Khmer news headline
- "summary_km": Natural 2-3 sentence Khmer summary
- "content_km": Full Khmer translation of the entire article body in Markdown (using ## subheadings)
"""
    data, meta = await asyncio.to_thread(
        ai_gateway.generate_json,
        prompt,
        use_search=False,
        timeout=60.0,
        max_tokens=6144,
    )
    if not isinstance(data, dict):
        logger.warning(
            "[Bilingual] Article translation returned no JSON: %s",
            (meta or {}).get("details") or (meta or {}).get("error"),
        )
        return None

    out: Dict[str, str] = {}
    t_km = str(data.get("title_km") or "").strip()[:255]
    s_km = str(data.get("summary_km") or "").strip()
    c_km = str(data.get("content_km") or "").strip()

    if has_khmer_script(t_km, min_chars=3):
        out["title_km"] = t_km
    if has_khmer_script(s_km, min_chars=10):
        out["summary_km"] = s_km
    if has_khmer_script(c_km, min_chars=25):
        out["content_km"] = c_km

    return out or None


async def ensure_article_khmer_fields(
    draft: Dict[str, Any],
    title: str,
    source_name: str = "",
) -> Dict[str, Any]:
    """Ensure draft dict carries Khmer title/summary/content when an AI provider is active."""
    need_title = not has_khmer_script(draft.get("title_km"), min_chars=3)
    need_summary = bool((draft.get("summary") or "").strip()) and not has_khmer_script(draft.get("summary_km"), min_chars=10)
    need_content = bool((draft.get("content") or "").strip()) and not has_khmer_script(draft.get("content_km"), min_chars=25)

    if not (need_title or need_summary or need_content):
        return draft

    translated = await translate_article_to_khmer(
        title=title,
        summary=str(draft.get("summary") or ""),
        content=str(draft.get("content") or ""),
        source_name=source_name,
    )
    if not translated:
        return draft

    merged = dict(draft)
    if need_title and translated.get("title_km"):
        merged["title_km"] = translated["title_km"]
    if need_summary and translated.get("summary_km"):
        merged["summary_km"] = translated["summary_km"]
    if need_content and translated.get("content_km"):
        merged["content_km"] = translated["content_km"]
    return merged


async def translate_discovery_to_khmer(
    title: str,
    intro: str,
    main_explanation: str,
) -> Optional[Dict[str, str]]:
    """Translate Visual Discovery explainer fields into natural Khmer."""
    if not ai_gateway.has_any_configured_provider():
        return None

    clean_title = str(title or "").strip()
    clean_intro = str(intro or "").strip()
    clean_body = re.sub(r"<[^>]+>", " ", str(main_explanation or "")).strip()[:8000]
    if not clean_title:
        return None

    prompt = f"""Translate this educational science/technology explainer into clear, engaging formal Khmer for Cambodian readers.

Title: {clean_title}
Intro: {clean_intro}
Explanation:
{clean_body}

Return ONLY valid JSON:
- "title_km": Clear Khmer title
- "intro_km": Fluent 2-3 sentence Khmer hook
- "main_explanation_km": Complete Markdown translation in natural Khmer using ## subheadings
"""
    data, _meta = await asyncio.to_thread(
        ai_gateway.generate_json,
        prompt,
        use_search=False,
        timeout=60.0,
        max_tokens=6144,
    )
    if not isinstance(data, dict):
        return None

    out: Dict[str, str] = {}
    if has_khmer_script(data.get("title_km"), min_chars=3):
        out["title_km"] = str(data["title_km"]).strip()[:255]
    if has_khmer_script(data.get("intro_km"), min_chars=10):
        out["intro_km"] = str(data["intro_km"]).strip()
    if has_khmer_script(data.get("main_explanation_km"), min_chars=25):
        out["main_explanation_km"] = str(data["main_explanation_km"]).strip()
    return out or None


async def translate_missing_khmer_batch(
    db: Session,
    article_limit: int = 5,
    discovery_limit: int = 2,
) -> Dict[str, int]:
    """Backfill missing Khmer fields on published/draft articles and discoveries."""
    if not await asyncio.to_thread(ai_gateway.has_any_configured_provider):
        return {"articles_translated": 0, "discoveries_translated": 0, "skipped_no_provider": 1}

    # Prioritize live PUBLISHED articles first so visitors switching to Khmer see complete translations.
    published_rows = (
        db.query(Article)
        .filter(Article.status == "PUBLISHED")
        .order_by(Article.published_at.desc().nullslast(), Article.created_at.desc())
        .limit(80)
        .all()
    )
    draft_rows = (
        db.query(Article)
        .filter(Article.status.in_(["AI_DRAFT", "DRAFT", "IN_REVIEW", "APPROVED"]))
        .order_by(Article.created_at.desc())
        .limit(60)
        .all()
    )

    candidates = [a for a in (published_rows + draft_rows) if article_needs_khmer(a)][:article_limit]
    art_done = 0
    for art in candidates:
        res = await translate_article_to_khmer(
            title=art.title,
            summary=art.summary or "",
            content=art.content or "",
            source_name=art.source_attribution_text or "",
        )
        if not res:
            continue
        changed = False
        if not has_khmer_script(art.title_km, 3) and res.get("title_km"):
            art.title_km = res["title_km"]
            changed = True
        if not has_khmer_script(art.summary_km, 10) and res.get("summary_km"):
            art.summary_km = res["summary_km"]
            changed = True
        if not has_khmer_script(art.content_km, 25) and res.get("content_km"):
            art.content_km = sanitize_stored_html(res["content_km"])
            changed = True
        if changed:
            db.add(AuditLog(
                user_id=None,
                action="AI_TRANSLATE_KM",
                entity="ARTICLE",
                entity_id=art.id,
                new_value_json=json.dumps({"slug": art.slug, "has_content_km": bool(art.content_km)}),
                request_id="bilingual-backfill",
            ))
            db.commit()
            art_done += 1

    disc_candidates = [
        d for d in db.query(Discovery).filter(Discovery.is_published == 1).order_by(Discovery.created_at.desc()).limit(40).all()
        if discovery_needs_khmer(d)
    ][:discovery_limit]

    disc_done = 0
    for disc in disc_candidates:
        res = await translate_discovery_to_khmer(
            title=disc.title,
            intro=disc.intro or "",
            main_explanation=disc.main_explanation or "",
        )
        if not res:
            continue
        changed = False
        if not has_khmer_script(disc.title_km, 3) and res.get("title_km"):
            disc.title_km = res["title_km"]
            changed = True
        if not has_khmer_script(disc.intro_km, 10) and res.get("intro_km"):
            disc.intro_km = res["intro_km"]
            changed = True
        if not has_khmer_script(disc.main_explanation_km, 25) and res.get("main_explanation_km"):
            disc.main_explanation_km = sanitize_stored_html(res["main_explanation_km"])
            changed = True
        if changed:
            db.commit()
            disc_done += 1

    return {"articles_translated": art_done, "discoveries_translated": disc_done}
