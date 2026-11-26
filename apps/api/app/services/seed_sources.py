"""Idempotent curated RSS source registry seeder across Cambodia, Thai Watch, ASEAN, and World."""
from __future__ import annotations

from typing import Dict, List
from sqlalchemy.orm import Session

from app.models.source import Source

RECOMMENDED_SOURCES: List[Dict[str, object]] = [
    {
        "slug": "cambodia-press-wire",
        "name": "Cambodia Press Wire (Google News)",
        "country": "KH",
        "language": "en",
        "website_url": "https://news.google.com",
        "feed_url": (
            "https://news.google.com/rss/search?q=Cambodia+"
            "(site:phnompenhpost.com+OR+site:khmertimeskh.com+OR+site:kiripost.com+OR+site:cambojanews.com)"
            "&hl=en-US&gl=US&ceid=US:en"
        ),
        "category": "Cambodia",
        "trust_level": "VERIFIED_PUBLISHER",
        "license_notes": "Aggregated wire links pointing to original Cambodian newsroom articles.",
        "fetch_interval_mins": 60,
        "priority": 10,
    },
    {
        "slug": "thai-media-on-cambodia",
        "name": "Thai Media on Cambodia (Bangkok Post / Nation / Khaosod)",
        "country": "TH",
        "language": "en",
        "website_url": "https://www.bangkokpost.com",
        "feed_url": (
            "https://news.google.com/rss/search?q=Cambodia+"
            "(site:bangkokpost.com+OR+site:nationthailand.com+OR+site:khaosodenglish.com+OR+site:thaipbsworld.com)"
            "&hl=en-US&gl=US&ceid=US:en"
        ),
        "category": "Thailand-Cambodia",
        "trust_level": "VERIFIED_PUBLISHER",
        "license_notes": "Tracks Thai English-language reporting specifically covering Cambodia, border trade, workers, and diplomacy.",
        "fetch_interval_mins": 60,
        "priority": 10,
    },
    {
        "slug": "asean-regional-wire",
        "name": "ASEAN & Mekong Regional Watch",
        "country": "ASEAN",
        "language": "en",
        "website_url": "https://www.channelnewsasia.com",
        "feed_url": (
            "https://news.google.com/rss/search?q=(ASEAN+OR+Mekong+OR+%22Southeast+Asia%22)+"
            "(trade+OR+economy+OR+tech+OR+Cambodia+OR+Thailand+OR+Vietnam)"
            "&hl=en-SG&gl=SG&ceid=SG:en"
        ),
        "category": "ASEAN",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "Regional Southeast Asian policy, digital economy, and ASEAN corridor coverage.",
        "fetch_interval_mins": 90,
        "priority": 8,
    },
    {
        "slug": "cna-asia-news",
        "name": "Channel News Asia",
        "country": "ASEAN",
        "language": "en",
        "website_url": "https://www.channelnewsasia.com",
        "feed_url": "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511",
        "category": "ASEAN",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "CNA Asia Pacific regional news RSS feed.",
        "fetch_interval_mins": 90,
        "priority": 8,
    },
    {
        "slug": "bbc-world-news",
        "name": "BBC World News",
        "country": "WORLD",
        "language": "en",
        "website_url": "https://www.bbc.com/news/world",
        "feed_url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "category": "World",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "Official BBC News World RSS feed with attribution links.",
        "fetch_interval_mins": 90,
        "priority": 7,
    },
    {
        "slug": "al-jazeera-english",
        "name": "Al Jazeera English",
        "country": "WORLD",
        "language": "en",
        "website_url": "https://www.aljazeera.com",
        "feed_url": "https://www.aljazeera.com/xml/rss/all.xml",
        "category": "World",
        "trust_level": "WIRE_SERVICE",
        "license_notes": "Official Al Jazeera international news feed.",
        "fetch_interval_mins": 90,
        "priority": 7,
    },
    {
        "slug": "ars-technica",
        "name": "Ars Technica",
        "country": "WORLD",
        "language": "en",
        "website_url": "https://arstechnica.com",
        "feed_url": "https://feeds.arstechnica.com/arstechnica/index",
        "category": "Technology",
        "trust_level": "VERIFIED_PUBLISHER",
        "license_notes": "Global technology, science, and cybersecurity reporting.",
        "fetch_interval_mins": 120,
        "priority": 6,
    },
]


def seed_recommended_sources(db: Session) -> Dict[str, int]:
    """Insert missing recommended regional and global RSS sources and align legacy regional desks."""
    added = 0
    existing = 0
    for item in RECOMMENDED_SOURCES:
        row = db.query(Source).filter(Source.slug == item["slug"]).first()
        if row:
            existing += 1
            continue
        db.add(Source(
            name=str(item["name"]),
            slug=str(item["slug"]),
            country=str(item["country"]),
            language=str(item["language"]),
            website_url=str(item["website_url"]),
            feed_url=str(item["feed_url"]),
            category=str(item["category"]),
            is_active=True,
            trust_level=str(item["trust_level"]),
            license_notes=str(item["license_notes"]),
            fetch_interval_mins=int(item["fetch_interval_mins"]),
            priority=int(item["priority"]),
        ))
        added += 1

    # Upgrade legacy CNA Singapore feed to ASEAN desk so future regional articles file under ASEAN
    legacy_cna = db.query(Source).filter(Source.slug == "cna-asia").first()
    if legacy_cna and (legacy_cna.country or "").upper() == "SG":
        legacy_cna.country = "ASEAN"

    if added or legacy_cna:
        db.commit()
    return {"added": added, "existing": existing, "total": len(RECOMMENDED_SOURCES)}


def reconcile_existing_article_desks(db: Session) -> Dict[str, int]:
    """Re-classify existing articles cleanly into KH, TH, ASEAN, or WORLD desks."""
    from app.models.article import Article
    from app.models.category import Category
    from app.services.filing import category_is_cambodia, mentions_cambodia, resolve_country

    articles = (
        db.query(Article)
        .filter(Article.status.in_(["PUBLISHED", "AI_DRAFT", "DRAFT", "IN_REVIEW", "APPROVED"]))
        .all()
    )
    world_cat = db.query(Category).filter(Category.slug == "world").first()
    asean_cat = db.query(Category).filter(Category.slug == "asean").first()

    updated = 0
    for art in articles:
        cat_slug = art.category.slug if art.category else None
        cat_scope = art.category.scope if art.category else None
        cambodia_cat_mismatch = bool(
            cat_slug
            and category_is_cambodia(cat_slug, cat_scope)
            and not mentions_cambodia(art.title, art.summary, art.content)
        )
        src_country = (
            "WORLD"
            if cambodia_cat_mismatch
            else (art.primary_source.country if art.primary_source else "WORLD")
        )
        src_name = (
            art.primary_source.name
            if art.primary_source
            else art.source_attribution_text
        )
        new_country = resolve_country(
            "world" if cambodia_cat_mismatch else cat_slug,
            src_country,
            art.title,
            art.summary,
            art.content,
            source_name=src_name,
        )
        if cambodia_cat_mismatch:
            if new_country == "ASEAN" and asean_cat:
                art.category_id = asean_cat.id
            elif new_country == "WORLD" and world_cat:
                art.category_id = world_cat.id
        if (art.country or "").upper() != new_country:
            art.country = new_country
            updated += 1
    if updated:
        db.commit()
    return {"checked": len(articles), "updated": updated}


def scrub_and_hold_defective_published_articles(db: Session) -> Dict[str, int]:
    """Scrub mixed Thai/Lao script glyphs from Khmer columns and hold defective boilerplate articles."""
    import json
    import re
    from app.models.article import Article, ArticleRevision
    from app.models.audit import AuditLog
    from app.models.discovery import Discovery
    from app.services.content_quality import body_quality_issue

    foreign = re.compile(r"[\u0E00-\u0E7F\u0E80-\u0EFF]")
    scrubbed_fields = 0
    held_articles = 0

    for art in db.query(Article).all():
        art_dirty = False
        for field in ("title_km", "summary_km", "content_km"):
            val = getattr(art, field, None)
            if val and foreign.search(str(val)):
                setattr(art, field, None)
                scrubbed_fields += 1
                art_dirty = True

        if art.status == "PUBLISHED":
            issue = body_quality_issue(art.content, art.summary, art.why_it_matters)
            if issue:
                art.status = "IN_REVIEW"
                art.quality_checklist_passed = False
                try:
                    meta = json.loads(art.ai_draft_metadata) if art.ai_draft_metadata else {}
                    if not isinstance(meta, dict):
                        meta = {}
                except Exception:
                    meta = {}
                meta["autopilot_hold_reason"] = f"Quality audit: {issue}"
                art.ai_draft_metadata = json.dumps(meta)
                db.add(ArticleRevision(
                    article_id=art.id,
                    editor_user_id=None,
                    previous_status="PUBLISHED",
                    new_status="IN_REVIEW",
                    change_summary=f"Auto-held for clarification: {issue[:180]}",
                ))
                db.add(AuditLog(
                    user_id=None,
                    action="QUALITY_AUDIT_HOLD",
                    entity="ARTICLE",
                    entity_id=art.id,
                    old_value_json="PUBLISHED",
                    new_value_json="IN_REVIEW",
                    request_id="hygiene-v3",
                ))
                held_articles += 1
                art_dirty = True
        if art_dirty:
            pass

    for disc in db.query(Discovery).all():
        for field in ("title_km", "intro_km", "main_explanation_km"):
            val = getattr(disc, field, None)
            if val and foreign.search(str(val)):
                setattr(disc, field, None)
                scrubbed_fields += 1

    if scrubbed_fields or held_articles:
        db.commit()
    return {"scrubbed_fields": scrubbed_fields, "held_articles": held_articles}


def ensure_regional_hygiene_v3(db: Session) -> Dict[str, object]:
    """One-shot idempotent hygiene pass: seeds sources, aligns 4 desks, scrubs mixed scripts, holds boilerplate."""
    from app.models.audit import SiteSetting

    flag = db.query(SiteSetting).filter(SiteSetting.key == "REGIONAL_DESKS_V3_RECONCILED").first()
    if flag:
        return {"already_ran": True}

    seed_stats = seed_recommended_sources(db)
    desk_stats = reconcile_existing_article_desks(db)
    scrub_stats = scrub_and_hold_defective_published_articles(db)
    db.add(SiteSetting(
        key="REGIONAL_DESKS_V3_RECONCILED",
        value_json="done",
        description="Aligned 4 news desks, cleared non-Khmer Thai/Lao glyphs, and held defective boilerplate articles",
    ))
    db.commit()
    return {"seed": seed_stats, "desks": desk_stats, "scrub": scrub_stats}


def ensure_production_pipeline_v4(db: Session) -> Dict[str, object]:
    """Repair dead legacy RSS feed URLs and switch exhausted Gemini default model once."""
    import json
    from app.models.audit import SiteSetting

    flag = db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V4").first()
    if flag:
        return {"already_ran": True}

    fixed_feeds = 0
    reuters_row = db.query(Source).filter(Source.slug == "reuters").first()
    if reuters_row and "reutersagency.com" in (reuters_row.feed_url or ""):
        reuters_row.feed_url = (
            "https://news.google.com/rss/search?q=site:reuters.com+(tech+OR+AI+OR+world+OR+economy)"
            "&hl=en-US&gl=US&ceid=US:en"
        )
        reuters_row.country = "WORLD"
        fixed_feeds += 1

    akp_row = db.query(Source).filter(Source.slug == "akp-cambodia").first()
    if akp_row and "akp.gov.kh/feed" in (akp_row.feed_url or ""):
        akp_row.feed_url = (
            "https://news.google.com/rss/search?q=site:akp.gov.kh+OR+%22Agence+Kampuchea+Presse%22"
            "&hl=en-US&gl=US&ceid=US:en"
        )
        akp_row.country = "KH"
        fixed_feeds += 1

    # Deactivate duplicate legacy cna-asia if cna-asia-news is present to avoid hammering CNA twice
    cna_new = db.query(Source).filter(Source.slug == "cna-asia-news").first()
    cna_old = db.query(Source).filter(Source.slug == "cna-asia").first()
    if cna_new and cna_old and cna_old.is_active:
        cna_old.is_active = False
        fixed_feeds += 1

    model_updated = False
    ai_row = db.query(SiteSetting).filter(SiteSetting.key == "AI_PROVIDERS_JSON").first()
    if ai_row and (ai_row.value_json or "").strip():
        try:
            providers = json.loads(ai_row.value_json)
            if isinstance(providers, list):
                for p in providers:
                    if isinstance(p, dict) and p.get("id") == "gemini" and p.get("model") in (
                        "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"
                    ):
                        p["model"] = "gemini-3-flash-preview"
                        model_updated = True
                if model_updated:
                    ai_row.value_json = json.dumps(providers, ensure_ascii=False)
        except Exception:
            pass

    db.add(SiteSetting(
        key="PIPELINE_RECOVERY_V4",
        value_json="done",
        description="Updated broken Reuters/AKP feeds, deduped CNA feed, and upgraded Gemini default model",
    ))
    db.commit()
    return {"fixed_feeds": fixed_feeds, "model_updated": model_updated}


def ensure_production_pipeline_v5(db: Session) -> Dict[str, object]:
    """Ensure active Gemini provider uses responsive gemini-3-flash-preview model."""
    import json
    from app.models.audit import SiteSetting

    flag = db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V5").first()
    if flag:
        return {"already_ran": True}

    model_updated = False
    ai_row = db.query(SiteSetting).filter(SiteSetting.key == "AI_PROVIDERS_JSON").first()
    if ai_row and (ai_row.value_json or "").strip():
        try:
            providers = json.loads(ai_row.value_json)
            if isinstance(providers, list):
                for p in providers:
                    if isinstance(p, dict) and p.get("id") == "gemini" and p.get("model") in (
                        "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"
                    ):
                        p["model"] = "gemini-3-flash-preview"
                        model_updated = True
                if model_updated:
                    ai_row.value_json = json.dumps(providers, ensure_ascii=False)
        except Exception:
            pass

    db.add(SiteSetting(
        key="PIPELINE_RECOVERY_V5",
        value_json="done",
        description="Upgraded default Gemini model to fast responsive gemini-3-flash-preview",
    ))
    db.commit()
    return {"model_updated": model_updated}


def ensure_production_pipeline_v6(db: Session) -> Dict[str, object]:
    """Re-align domestic Cambodia stories misfiled as TH and permanently retire Quiz navigation/config."""
    from app.models.audit import SiteSetting
    from app.models.config import FeatureFlag, HomepageSection, NavigationItem

    flag = db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V6").first()
    if flag:
        return {"already_ran": True}

    desks = reconcile_existing_article_desks(db)

    disabled_nav = 0
    for item in db.query(NavigationItem).all():
        route = (item.route or "").strip().lower()
        key = (item.label_key or "").strip().lower()
        label = (item.label or "").strip().lower()
        if route.startswith("/quiz") or key == "nav.quiz" or label == "quiz":
            if item.enabled:
                item.enabled = False
                disabled_nav += 1

    for sec in db.query(HomepageSection).all():
        if "quiz" in (sec.section_key or "").lower() or "quiz" in (sec.title or "").lower():
            if sec.enabled:
                sec.enabled = False

    for ff in db.query(FeatureFlag).all():
        if "quiz" in (ff.name or "").lower():
            ff.enabled = False

    quiz_setting = db.query(SiteSetting).filter(SiteSetting.key == "AUTOPILOT_QUIZ_ENABLED").first()
    if quiz_setting:
        quiz_setting.value_json = "false"

    db.add(SiteSetting(
        key="PIPELINE_RECOVERY_V6",
        value_json="done",
        description="Re-filed domestic Cambodia stories back to KH desk and disabled retired Quiz navigation",
    ))
    db.commit()
    return {"desks": desks, "disabled_nav": disabled_nav}
