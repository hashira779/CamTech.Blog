"""
News Autopilot — hands-off lifecycle management for AI-generated news.

Policy (Hybrid publishing + archive-not-delete):
  1. AUTO-PUBLISH: AI_DRAFT articles produced by a real AI engine (Gemini) are published
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
}

LAST_DAILY_RUN_KEY = "AUTOPILOT_DAILY_NEWS_LAST_RUN"

# Engines whose output is trusted enough for hybrid auto-publish.
TRUSTED_ENGINES = {"gemini", "gemini_search_grounded"}


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
        LAST_DAILY_RUN_KEY: get_setting(db, LAST_DAILY_RUN_KEY) or None
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
    if engine not in TRUSTED_ENGINES:
        return PublishVerdict(False, f"Drafted by '{engine}' fallback, not Gemini; needs manual review", None)

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
    """Publish -> archive -> purge. Safe to call every worker cycle."""
    return {
        "publish": auto_publish_ready_drafts(db),
        "archive": archive_stale_articles(db),
        "purge": purge_old_archived(db),
    }
