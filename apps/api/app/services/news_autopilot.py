"""
News Autopilot — hands-off lifecycle management for AI-generated news.

Policy (Hybrid publishing + archive-not-delete):
  1. AUTO-PUBLISH: AI_DRAFT articles produced by a real configured AI provider (see the
     pluggable gateway) are published
     automatically once they are older than the review window (default 2h) AND pass the
     editorial quality gate. Editors can stop any draft by rejecting it (or moving it to
     IN_REVIEW / NEEDS_REVISION) before the window ends.
  2. ARCHIVE: AI drafts not published within N days (default 7) and REJECTED AI articles
     older than N days are moved to ARCHIVED (hidden from the public, restorable).
  3. PURGE: ARCHIVED AI articles that were never public are permanently removed after
     N days (default 30).

Every automatic action writes an AuditLog row (user_id = NULL, action prefixed with AI_)
and an ArticleRevision row so it can be traced and reverted from the admin.

All behaviour is controlled from Admin -> Settings via SiteSetting keys (see DEFAULTS).
"""
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.article import Article, ArticleRevision
from app.models.audit import AuditLog, SiteSetting
from app.services.article_service import ArticleService
from app.services import ai_gateway

logger = logging.getLogger("NewsAutopilot")

# Cambodia does not observe DST, so a fixed offset is exact and avoids tzdata dependency.
CAMBODIA_TZ = timezone(timedelta(hours=7))

DEFAULTS = {
    "AUTOPILOT_NEWS_ENABLED": "true",            # master switch for everything below
    "AUTOPILOT_DAILY_NEWS_ENABLED": "true",      # daily multi-category AI news generation
    "AUTOPILOT_DAILY_NEWS_HOUR": "7",            # hour of day, Cambodia time (UTC+7)
    "AUTOPILOT_AUTO_PUBLISH_ENABLED": "true",    # hybrid auto-publish of AI drafts
    "AUTOPILOT_PUBLISH_DELAY_HOURS": "2",        # review window before auto-publish
    "AUTOPILOT_MAX_PUBLISH_PER_RUN": "10",       # safety cap per worker cycle
    "AUTOPILOT_MIN_CONTENT_CHARS": "300",        # thin drafts never auto-publish
    "AUTOPILOT_ARCHIVE_AFTER_DAYS": "7",         # stale AI drafts / rejected -> ARCHIVED
    "AUTOPILOT_PURGE_AFTER_DAYS": "30",          # ARCHIVED (never public) -> deleted
    "AUTOPILOT_DISCOVERY_ENABLED": "true",       # AI visual discoveries (Discover section)
    "AUTOPILOT_DISCOVERY_INTERVAL_HOURS": "24",  # how often new discoveries are drafted
    "AUTOPILOT_QUIZ_ENABLED": "true",            # daily AI quiz (Cambodia time)
    "AUTOPILOT_TRAVEL_ENABLED": "true",          # AI travel guides & events
    "AUTOPILOT_TRAVEL_INTERVAL_HOURS": "168",    # weekly guide/event refresh
}

LAST_DAILY_RUN_KEY = "AUTOPILOT_DAILY_NEWS_LAST_RUN"
LAST_DISCOVERY_RUN_KEY = "AUTOPILOT_DISCOVERY_LAST_RUN"
LAST_TRAVEL_RUN_KEY = "AUTOPILOT_TRAVEL_LAST_RUN"
LAST_QUIZ_RUN_KEY = "AUTOPILOT_QUIZ_LAST_RUN"

# Engines whose output is trusted enough for hybrid auto-publish.
TRUSTED_ENGINES = {"gemini", "gemini_search_grounded"}


def is_trusted_engine(engine: str) -> bool:
    """Return True only for drafts produced by a real configured AI provider.

    The pluggable gateway tags engines as ``<provider_id>:<model>`` (e.g.
    ``openai:gpt-4o-mini``, ``gemini:gemini-2.5-flash``). Legacy bare ``gemini`` /
    ``gemini_search_grounded`` tags and any ``gemini*`` model name stay trusted. Template,
    local-extraction, fallback and untagged output (see ai_gateway.NON_TRUSTED_ENGINES) are
    never trusted and always need manual editorial review.
    """
    eng = str(engine or "").strip().lower()
    if not eng or eng in ai_gateway.NON_TRUSTED_ENGINES:
        return False
    if eng in TRUSTED_ENGINES or eng.startswith("gemini"):
        return True
    if ":" in eng:  # gateway provider engine
        provider_id = eng.split(":", 1)[0].strip()
        return bool(provider_id) and provider_id not in ai_gateway.NON_TRUSTED_ENGINES
    return False


def _utcnow_naive() -> datetime:
    """Naive UTC — matches how `DateTime` columns are stored (SQLite & Postgres without tz)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _as_naive_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


# --------------------------------------------------------------------------- settings
def get_setting(db: Session, key: str) -> str:
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if row and row.value_json is not None and str(row.value_json).strip() != "":
        return str(row.value_json).strip()
    return DEFAULTS.get(key, "")


def get_bool(db: Session, key: str) -> bool:
    return get_setting(db, key).lower() in ("1", "true", "yes", "on")


def get_int(db: Session, key: str) -> int:
    try:
        return int(float(get_setting(db, key)))
    except (TypeError, ValueError):
        return int(DEFAULTS[key])


def set_setting(db: Session, key: str, value: str, description: Optional[str] = None) -> None:
    row = db.query(SiteSetting).filter(SiteSetting.key == key).first()
    if row:
        row.value_json = value
    else:
        db.add(SiteSetting(key=key, value_json=value, description=description))
    db.commit()


def get_config(db: Session) -> dict:
    return {key: get_setting(db, key) for key in DEFAULTS} | {
        LAST_DAILY_RUN_KEY: get_setting(db, LAST_DAILY_RUN_KEY) or None,
        LAST_DISCOVERY_RUN_KEY: get_setting(db, LAST_DISCOVERY_RUN_KEY) or None,
        LAST_TRAVEL_RUN_KEY: get_setting(db, LAST_TRAVEL_RUN_KEY) or None,
        LAST_QUIZ_RUN_KEY: get_setting(db, LAST_QUIZ_RUN_KEY) or None,
    }


# --------------------------------------------------------------------------- helpers
def _metadata(article: Article) -> dict:
    if not article.ai_draft_metadata:
        return {}
    try:
        data = json.loads(article.ai_draft_metadata)
        return data if isinstance(data, dict) else {}
    except (TypeError, ValueError):
        return {}


def _engine(meta: dict) -> str:
    return str(meta.get("engine") or meta.get("generator") or "unknown")


def _audit(db: Session, action: str, article: Article, old: str, new: str) -> None:
    db.add(AuditLog(
        user_id=None,
        action=action,
        entity="ARTICLE",
        entity_id=article.id,
        old_value_json=old,
        new_value_json=new,
        request_id="news-autopilot",
    ))


def _revision(db: Session, article: Article, prev: str, new: str, summary: str) -> None:
    db.add(ArticleRevision(
        article_id=article.id,
        editor_user_id=None,
        previous_status=prev,
        new_status=new,
        change_summary=summary[:255],
    ))


@dataclass
class PublishVerdict:
    eligible: bool
    reason: str
    auto_publish_at: Optional[datetime]


def evaluate_draft(db: Session, article: Article, run_quality_gate: bool = True) -> PublishVerdict:
    """Decide whether an AI_DRAFT may be auto-published, and when."""
    delay_hours = get_int(db, "AUTOPILOT_PUBLISH_DELAY_HOURS")
    created = _as_naive_utc(article.created_at) or _utcnow_naive()
    publish_at = created + timedelta(hours=delay_hours)

    if article.status != "AI_DRAFT":
        return PublishVerdict(False, f"Status is {article.status}; only AI_DRAFT auto-publishes", None)

    meta = _metadata(article)
    if not meta:
        return PublishVerdict(False, "Not AI-generated; needs manual publish", None)

    engine = _engine(meta)
    if not is_trusted_engine(engine):
        return PublishVerdict(False, f"Drafted by '{engine}' (local/template), not a configured AI provider; needs manual review", None)

    min_chars = get_int(db, "AUTOPILOT_MIN_CONTENT_CHARS")
    if len((article.content or "").strip()) < min_chars:
        return PublishVerdict(False, f"Content shorter than {min_chars} characters", None)

    if run_quality_gate:
        checklist = ArticleService.validate_quality_gate(article, db)
        if not checklist.can_publish:
            return PublishVerdict(False, "Quality gate: " + "; ".join(checklist.missing_items), None)

    return PublishVerdict(True, "Will auto-publish unless rejected", publish_at)


# --------------------------------------------------------------------------- jobs
def auto_publish_ready_drafts(db: Session) -> dict:
    if not (get_bool(db, "AUTOPILOT_NEWS_ENABLED") and get_bool(db, "AUTOPILOT_AUTO_PUBLISH_ENABLED")):
        return {"published": 0, "skipped": 0, "disabled": True}

    delay_hours = get_int(db, "AUTOPILOT_PUBLISH_DELAY_HOURS")
    cap = max(0, get_int(db, "AUTOPILOT_MAX_PUBLISH_PER_RUN"))
    cutoff = _utcnow_naive() - timedelta(hours=delay_hours)

    candidates = (
        db.query(Article)
        .filter(Article.status == "AI_DRAFT", Article.created_at <= cutoff)
        .order_by(Article.created_at.asc())
        .limit(cap * 5 or 1)
        .all()
    )

    published, skipped = 0, 0
    for article in candidates:
        if published >= cap:
            break
        verdict = evaluate_draft(db, article)
        if not verdict.eligible:
            skipped += 1
            meta = _metadata(article)
            if meta.get("autopilot_hold_reason") != verdict.reason:
                meta["autopilot_hold_reason"] = verdict.reason
                article.ai_draft_metadata = json.dumps(meta)
                db.commit()
            continue
        try:
            ArticleService.publish_article(db, article.id, editor_user_id=None)
            _audit(db, "AI_AUTOPUBLISH", article, "AI_DRAFT", "PUBLISHED")
            db.commit()
            published += 1
            logger.info(f"Auto-published: {article.title}")
        except Exception as exc:  # quality gate race or DB error — leave as draft
            db.rollback()
            skipped += 1
            logger.warning(f"Auto-publish failed for {article.id}: {exc}")

    return {"published": published, "skipped": skipped}


def archive_stale_articles(db: Session) -> dict:
    if not get_bool(db, "AUTOPILOT_NEWS_ENABLED"):
        return {"archived": 0, "disabled": True}

    days = get_int(db, "AUTOPILOT_ARCHIVE_AFTER_DAYS")
    cutoff = _utcnow_naive() - timedelta(days=days)

    stale = (
        db.query(Article)
        .filter(
            Article.ai_draft_metadata.isnot(None),       # never touch human-written drafts
            Article.status.in_(["AI_DRAFT", "REJECTED"]),
            Article.created_at <= cutoff,
        )
        .limit(500)
        .all()
    )

    archived = 0
    for article in stale:
        # Rejected items: measure age from the rejection, not creation.
        if article.status == "REJECTED" and article.updated_at and _as_naive_utc(article.updated_at) > cutoff:
            continue
        prev = article.status
        article.status = "ARCHIVED"
        article.updated_at = _utcnow_naive()
        _revision(db, article, prev, "ARCHIVED", f"Autopilot: archived after {days} days in {prev}")
        _audit(db, "AI_ARCHIVE", article, prev, "ARCHIVED")
        archived += 1

    if archived:
        db.commit()
        logger.info(f"Archived {archived} stale AI articles.")
    return {"archived": archived}


def purge_old_archived(db: Session) -> dict:
    if not get_bool(db, "AUTOPILOT_NEWS_ENABLED"):
        return {"purged": 0, "disabled": True}

    days = get_int(db, "AUTOPILOT_PURGE_AFTER_DAYS")
    cutoff = _utcnow_naive() - timedelta(days=days)

    doomed = (
        db.query(Article)
        .filter(
            Article.status == "ARCHIVED",
            Article.ai_draft_metadata.isnot(None),
            Article.published_at.is_(None),               # never public -> no inbound links
            Article.updated_at.isnot(None),
            Article.updated_at <= cutoff,
        )
        .limit(200)
        .all()
    )

    purged = 0
    for article in doomed:
        try:
            _audit(db, "AI_PURGE", article, json.dumps({"title": article.title, "slug": article.slug}), "DELETED")
            db.delete(article)
            db.commit()
            purged += 1
        except Exception as exc:
            db.rollback()
            logger.warning(f"Purge failed for {article.id}: {exc}")

    if purged:
        logger.info(f"Purged {purged} archived AI articles older than {days} days.")
    return {"purged": purged}


# --------------------------------------------------------------------------- content lifecycle
def _content_meta(row) -> dict:
    if not getattr(row, "ai_metadata", None):
        return {}
    try:
        data = json.loads(row.ai_metadata)
        return data if isinstance(data, dict) else {}
    except (TypeError, ValueError):
        return {}


def _content_audit(db: Session, action: str, entity: str, entity_id: str, old: str, new: str) -> None:
    db.add(AuditLog(
        user_id=None,
        action=action,
        entity=entity,
        entity_id=entity_id,
        old_value_json=old,
        new_value_json=new,
        request_id="news-autopilot",
    ))


def section_is_due(db: Session, enabled_key: str, last_key: str, interval_hours: int) -> bool:
    """Generic interval scheduler for autopilot sections (discoveries, travel, quiz)."""
    if not (get_bool(db, "AUTOPILOT_NEWS_ENABLED") and get_bool(db, enabled_key)):
        return False
    last = get_setting(db, last_key)
    if not last:
        return True
    try:
        last_dt = datetime.fromisoformat(last)
    except ValueError:
        return True
    if last_dt.tzinfo is not None:
        last_dt = last_dt.astimezone(timezone.utc).replace(tzinfo=None)
    return _utcnow_naive() - last_dt >= timedelta(hours=interval_hours)


def mark_section_ran(db: Session, last_key: str, description: str) -> None:
    set_setting(db, last_key, _utcnow_naive().isoformat(), description)


def publish_ready_content(db: Session) -> dict:
    """Hybrid auto-publish for AI discoveries, guides and events past the review window."""
    from app.models.discovery import Discovery
    from app.models.guide_event import Event, TravelGuide

    if not (get_bool(db, "AUTOPILOT_NEWS_ENABLED") and get_bool(db, "AUTOPILOT_AUTO_PUBLISH_ENABLED")):
        return {"published": 0, "disabled": True}

    delay_hours = get_int(db, "AUTOPILOT_PUBLISH_DELAY_HOURS")
    min_chars = get_int(db, "AUTOPILOT_MIN_CONTENT_CHARS")
    cap = max(0, get_int(db, "AUTOPILOT_MAX_PUBLISH_PER_RUN"))
    cutoff = _utcnow_naive() - timedelta(hours=delay_hours)
    today_km = datetime.now(CAMBODIA_TZ).strftime("%Y-%m-%d")
    now = _utcnow_naive()
    published = {"discovery": 0, "guide": 0, "event": 0}
    held = 0

    def ready(row, created_at, body_text) -> bool:
        nonlocal held
        meta = _content_meta(row)
        if not meta or not is_trusted_engine(_engine(meta)):
            held += 1
            return False
        if _as_naive_utc(created_at) is None or _as_naive_utc(created_at) > cutoff:
            return False
        if len((body_text or "").strip()) < min_chars:
            held += 1
            return False
        return True

    if published_total(published) < cap:
        for disc in db.query(Discovery).filter(
            Discovery.is_published == 0, Discovery.ai_metadata.isnot(None), Discovery.created_at <= cutoff
        ).order_by(Discovery.created_at.asc()).limit(cap).all():
            if published_total(published) >= cap:
                break
            if not ready(disc, disc.created_at, disc.main_explanation):
                continue
            disc.is_published = 1
            disc.published_at = now
            _content_audit(db, "AI_AUTOPUBLISH", "DISCOVERY", disc.id, "0", "1")
            published["discovery"] += 1

    for guide in db.query(TravelGuide).filter(
        TravelGuide.status == "AI_DRAFT", TravelGuide.ai_metadata.isnot(None), TravelGuide.updated_at <= cutoff
    ).order_by(TravelGuide.updated_at.asc()).limit(cap).all():
        if published_total(published) >= cap:
            break
        if not ready(guide, guide.updated_at, guide.content):
            continue
        guide.status = "PUBLISHED"
        guide.published_at = now
        _content_audit(db, "AI_AUTOPUBLISH", "GUIDE", guide.id, "AI_DRAFT", "PUBLISHED")
        published["guide"] += 1

    for event in db.query(Event).filter(
        Event.status == "AI_DRAFT", Event.ai_metadata.isnot(None), Event.created_at <= cutoff
    ).order_by(Event.created_at.asc()).limit(cap).all():
        if published_total(published) >= cap:
            break
        # Never activate an event whose start date already passed while it waited in review.
        if (event.start_date or "9999") < today_km:
            event.status = "EXPIRED"
            _content_audit(db, "AI_ARCHIVE", "EVENT", event.id, "AI_DRAFT", "EXPIRED")
            held += 1
            continue
        event_meta = _content_meta(event)
        if not event_meta or not is_trusted_engine(_engine(event_meta)):
            held += 1
            continue
        if _as_naive_utc(event.created_at) is None or _as_naive_utc(event.created_at) > cutoff:
            continue
        if len((event.description or "").strip()) < 40:  # events are short by nature
            held += 1
            continue
        event.status = "ACTIVE"
        _content_audit(db, "AI_AUTOPUBLISH", "EVENT", event.id, "AI_DRAFT", "ACTIVE")
        published["event"] += 1

    db.commit()
    total = published_total(published)
    if total:
        logger.info(f"Auto-published content: {published}")
    return {"published": total, "by_type": published, "held": held}


def published_total(published: dict) -> int:
    return sum(published.values())


def expire_ended_events(db: Session) -> dict:
    """Non-destructive expiry: ended events stop showing but stay restorable."""
    from app.models.guide_event import Event

    if not get_bool(db, "AUTOPILOT_NEWS_ENABLED"):
        return {"expired": 0, "disabled": True}

    today_km = datetime.now(CAMBODIA_TZ).strftime("%Y-%m-%d")
    expired = 0
    for event in db.query(Event).filter(Event.status == "ACTIVE", Event.ai_metadata.isnot(None)).limit(500).all():
        end = event.end_date or event.start_date or ""
        if end and end < today_km:  # ISO dates compare correctly as strings
            event.status = "ENDED"
            _content_audit(db, "AI_ARCHIVE", "EVENT", event.id, "ACTIVE", "ENDED")
            expired += 1
    if expired:
        db.commit()
        logger.info(f"Expired {expired} ended AI events.")
    return {"expired": expired}


def purge_old_content(db: Session) -> dict:
    """Hard-delete AI content drafts that were never public after the purge window."""
    from app.models.discovery import Discovery
    from app.models.guide_event import Event, TravelGuide

    if not get_bool(db, "AUTOPILOT_NEWS_ENABLED"):
        return {"purged": 0, "disabled": True}

    days = get_int(db, "AUTOPILOT_PURGE_AFTER_DAYS")
    cutoff = _utcnow_naive() - timedelta(days=days)
    purged = 0

    for disc in db.query(Discovery).filter(
        Discovery.is_published == 0, Discovery.ai_metadata.isnot(None), Discovery.created_at <= cutoff
    ).limit(200).all():
        _content_audit(db, "AI_PURGE", "DISCOVERY", disc.id, json.dumps({"title": disc.title}), "DELETED")
        db.delete(disc)
        purged += 1

    for guide in db.query(TravelGuide).filter(
        TravelGuide.status == "AI_DRAFT", TravelGuide.ai_metadata.isnot(None), TravelGuide.updated_at <= cutoff
    ).limit(200).all():
        _content_audit(db, "AI_PURGE", "GUIDE", guide.id, json.dumps({"title": guide.title}), "DELETED")
        db.delete(guide)
        purged += 1

    for event in db.query(Event).filter(
        Event.status.in_(["AI_DRAFT", "EXPIRED"]), Event.ai_metadata.isnot(None), Event.created_at <= cutoff
    ).limit(200).all():
        _content_audit(db, "AI_PURGE", "EVENT", event.id, json.dumps({"name": event.name}), "DELETED")
        db.delete(event)
        purged += 1

    if purged:
        db.commit()
        logger.info(f"Purged {purged} unpublished AI content items older than {days} days.")
    return {"purged": purged}


def daily_news_is_due(db: Session, now_local: Optional[datetime] = None) -> bool:
    if not (get_bool(db, "AUTOPILOT_NEWS_ENABLED") and get_bool(db, "AUTOPILOT_DAILY_NEWS_ENABLED")):
        return False
    now_local = now_local or datetime.now(CAMBODIA_TZ)
    if now_local.hour < get_int(db, "AUTOPILOT_DAILY_NEWS_HOUR"):
        return False
    return get_setting(db, LAST_DAILY_RUN_KEY) != now_local.date().isoformat()


def mark_daily_news_ran(db: Session, now_local: Optional[datetime] = None) -> None:
    now_local = now_local or datetime.now(CAMBODIA_TZ)
    set_setting(db, LAST_DAILY_RUN_KEY, now_local.date().isoformat(),
                "Date (Cambodia time) the daily AI news job last ran")


def run_lifecycle(db: Session) -> dict:
    """Publish -> archive -> purge, for news and all AI content sections."""
    return {
        "publish": auto_publish_ready_drafts(db),
        "archive": archive_stale_articles(db),
        "purge": purge_old_archived(db),
        "content_publish": publish_ready_content(db),
        "events_expire": expire_ended_events(db),
        "content_purge": purge_old_content(db),
    }
