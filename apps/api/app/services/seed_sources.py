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
    th_cat = db.query(Category).filter(Category.slug == "thailand-cambodia").first()

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
        if new_country == "TH" and th_cat and art.category_id != th_cat.id:
            art.category_id = th_cat.id
            updated += 1
        elif cambodia_cat_mismatch:
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


def ensure_production_pipeline_v7(db: Session) -> Dict[str, object]:
    """Pull thin/stub (<1000 char) or corrupt published articles back into AI_DRAFT for full rewrite & translation."""
    import json
    from app.models.article import Article, ArticleRevision
    from app.models.audit import AuditLog, SiteSetting
    from app.services.content_quality import body_quality_issue, khmer_quality_issue

    flag = db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V7").first()
    if flag:
        return {"already_ran": True}

    desks = reconcile_existing_article_desks(db)
    held_thin = 0
    held_corrupt_km = 0

    for art in db.query(Article).filter(Article.status == "PUBLISHED").all():
        body_err = body_quality_issue(art.content, art.summary, art.why_it_matters)
        km_err = khmer_quality_issue(art.title_km, art.summary_km, art.content_km, require_complete=False)
        reason = body_err or km_err
        if not reason:
            continue

        if body_err:
            held_thin += 1
        if km_err:
            held_corrupt_km += 1

        art.status = "AI_DRAFT"
        art.quality_checklist_passed = False
        try:
            meta = json.loads(art.ai_draft_metadata) if art.ai_draft_metadata else {}
            if not isinstance(meta, dict):
                meta = {}
        except Exception:
            meta = {}
        meta["autopilot_hold_reason"] = f"Pipeline recovery v7: {reason}"
        if not meta.get("engine"):
            meta["engine"] = "fallback"
        art.ai_draft_metadata = json.dumps(meta)
        db.add(ArticleRevision(
            article_id=art.id,
            editor_user_id=None,
            previous_status="PUBLISHED",
            new_status="AI_DRAFT",
            change_summary=f"Returned to AI_DRAFT: {reason[:180]}",
        ))
        db.add(AuditLog(
            user_id=None,
            action="QUALITY_AUDIT_HOLD",
            entity="ARTICLE",
            entity_id=art.id,
            old_value_json="PUBLISHED",
            new_value_json="AI_DRAFT",
            request_id="pipeline-v7",
        ))

    db.add(SiteSetting(
        key="PIPELINE_RECOVERY_V7",
        value_json="done",
        description="Held thin/stub force-published articles back to AI_DRAFT for AI enrichment & Khmer translation",
    ))
    db.commit()
    return {"desks": desks, "held_thin": held_thin, "held_corrupt_km": held_corrupt_km}


def ensure_production_pipeline_v8(db: Session) -> Dict[str, object]:
    """Deadlock-safe recovery: pull ALL thin/stub (<1000 char) or corrupt published articles back into AI_DRAFT."""
    import json
    from sqlalchemy import text
    from app.models.article import Article, ArticleRevision
    from app.models.audit import AuditLog, SiteSetting
    from app.services.content_quality import body_quality_issue, khmer_quality_issue

    if db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V8").first():
        return {"already_ran": True}

    # Prevent API + Worker boot race on Postgres using a non-blocking session advisory lock.
    is_pg = db.bind is not None and not str(db.bind.url).startswith("sqlite")
    lock_acquired = False
    if is_pg:
        try:
            lock_acquired = bool(db.execute(text("SELECT pg_try_advisory_lock(884208)")).scalar())
        except Exception:
            lock_acquired = True
        if not lock_acquired:
            return {"skipped_lock_held": True}
        # Re-check after acquiring lock in case the peer just finished.
        if db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V8").first():
            try:
                db.execute(text("SELECT pg_advisory_unlock(884208)"))
            except Exception:
                pass
            return {"already_ran": True}

    held_thin = 0
    held_corrupt_km = 0
    errors = 0
    try:
        desks = reconcile_existing_article_desks(db)
        pub_ids = [
            row[0]
            for row in db.query(Article.id)
            .filter(Article.status == "PUBLISHED")
            .order_by(Article.id.asc())
            .all()
        ]
        for art_id in pub_ids:
            art = db.query(Article).filter(Article.id == art_id).first()
            if not art or art.status != "PUBLISHED":
                continue
            body_err = body_quality_issue(art.content, art.summary, art.why_it_matters)
            km_err = khmer_quality_issue(art.title_km, art.summary_km, art.content_km, require_complete=False)
            reason = body_err or km_err
            if not reason:
                continue
            try:
                if body_err:
                    held_thin += 1
                if km_err:
                    held_corrupt_km += 1
                art.status = "AI_DRAFT"
                art.quality_checklist_passed = False
                try:
                    meta = json.loads(art.ai_draft_metadata) if art.ai_draft_metadata else {}
                    if not isinstance(meta, dict):
                        meta = {}
                except Exception:
                    meta = {}
                meta["autopilot_hold_reason"] = f"Pipeline recovery v8: {reason}"
                if not meta.get("engine"):
                    meta["engine"] = "fallback"
                art.ai_draft_metadata = json.dumps(meta)
                db.add(ArticleRevision(
                    article_id=art.id,
                    editor_user_id=None,
                    previous_status="PUBLISHED",
                    new_status="AI_DRAFT",
                    change_summary=f"Returned to AI_DRAFT: {reason[:180]}",
                ))
                db.add(AuditLog(
                    user_id=None,
                    action="QUALITY_AUDIT_HOLD",
                    entity="ARTICLE",
                    entity_id=art.id,
                    old_value_json="PUBLISHED",
                    new_value_json="AI_DRAFT",
                    request_id="pipeline-v8",
                ))
                db.commit()
            except Exception:
                db.rollback()
                errors += 1

        if not db.query(SiteSetting).filter(SiteSetting.key == "PIPELINE_RECOVERY_V8").first():
            db.add(SiteSetting(
                key="PIPELINE_RECOVERY_V8",
                value_json="done",
                description=f"Held {held_thin} thin/stub and {held_corrupt_km} corrupt published articles into AI_DRAFT",
            ))
            db.commit()
        return {"desks": desks, "held_thin": held_thin, "held_corrupt_km": held_corrupt_km, "errors": errors}
    finally:
        if is_pg and lock_acquired:
            try:
                db.execute(text("SELECT pg_advisory_unlock(884208)"))
                db.commit()
            except Exception:
                pass
