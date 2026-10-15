from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from app.common.database import get_db
from app.models.article import Article, ArticleRevision
from app.models.source import Source, SourceFetchLog
from app.models.discovery import Discovery
from app.models.quiz import Quiz
from app.models.tool import Tool
from app.models.audit import AuditLog, SiteSetting
from app.models.user import User
from app.models.place import Place, PlaceSuggestion
from app.models.location import Destination
from app.schemas.travel import PlaceSuggestionOut
from app.services.auth_service import require_admin
from app.services.article_service import ArticleService
from app.services.google_drive_service import storage_service

router = APIRouter(prefix="/admin", tags=["Admin CMS"])

class ReviewActionRequest(BaseModel):
    article_id: str
    action: str  # APPROVE, REJECT, REQUEST_REVISION, PUBLISH, RESTORE
    notes: Optional[str] = None

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    total_articles = db.query(Article).count()
    published_articles = db.query(Article).filter(Article.status == "PUBLISHED").count()
    pending_reviews = db.query(Article).filter(Article.status.in_(["AI_DRAFT", "IN_REVIEW", "DRAFT"])).count()
    total_discoveries = db.query(Discovery).count()
    total_quizzes = db.query(Quiz).count()
    total_tools = db.query(Tool).count()
    total_sources = db.query(Source).count()
    active_sources = db.query(Source).filter(Source.is_active == True).count()

    total_views = db.query(func.sum(Article.views_count)).scalar() or 0
    total_shares = db.query(func.sum(Article.shares_count)).scalar() or 0

    top_stories = db.query(Article).filter(Article.status == "PUBLISHED").order_by(desc(Article.views_count)).limit(5).all()
    latest_logs = db.query(SourceFetchLog).order_by(desc(SourceFetchLog.fetched_at)).limit(5).all()

    return {
        "metrics": {
            "total_articles": total_articles,
            "published_articles": published_articles,
            "pending_reviews": pending_reviews,
            "total_discoveries": total_discoveries,
            "total_quizzes": total_quizzes,
            "total_tools": total_tools,
            "total_sources": total_sources,
            "active_sources": active_sources,
            "total_pageviews": total_views,
            "total_shares": total_shares
        },
        "top_stories": [
            {"id": a.id, "title": a.title, "views": a.views_count, "country": a.country}
            for a in top_stories
        ],
        "latest_ingestion_logs": [
            {"source_id": l.source_id, "status": l.status, "found": l.items_found, "ingested": l.items_ingested, "at": l.fetched_at.isoformat()}
            for l in latest_logs
        ]
    }

@router.get("/review-queue")
def get_review_queue(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Returns pending articles for the 3-column review workspace."""
    articles = db.query(Article).filter(
        Article.status.in_(["AI_DRAFT", "IN_REVIEW", "DRAFT", "NEEDS_REVISION"])
    ).order_by(desc(Article.created_at)).all()

    output = []
    for a in articles:
        checklist = ArticleService.validate_quality_gate(a, db)
        output.append({
            "id": a.id,
            "title": a.title,
            "status": a.status,
            "country": a.country,
            "source_name": a.source_attribution_text or "External Provider",
            "source_url": a.primary_source_url,
            "summary": a.summary,
            "content": a.content,
            "key_points": a.key_points,
            "why_it_matters": a.why_it_matters,
            "created_at": a.created_at.isoformat(),
            "quality_gate": {
                "can_publish": checklist.can_publish,
                "missing": checklist.missing_items
            }
        })
    return output

@router.post("/review-action")
def process_review_action(
    req: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    article = db.query(Article).filter(Article.id == req.article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    prev_status = article.status
    if req.action == "PUBLISH":
        try:
            article, _ = ArticleService.publish_article(db, article.id, editor_user_id=current_user.id)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif req.action == "APPROVE":
        article.status = "APPROVED"
    elif req.action == "REJECT":
        article.status = "REJECTED"
    elif req.action == "REQUEST_REVISION":
        article.status = "NEEDS_REVISION"
    elif req.action == "RESTORE":
        # Archived -> back into manual review (never re-enters the auto-publish pipeline).
        article.status = "IN_REVIEW"
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {req.action}")

    article.updated_at = datetime.now(timezone.utc)

    # Log revision
    rev = ArticleRevision(
        article_id=article.id,
        editor_user_id=current_user.id,
        previous_status=prev_status,
        new_status=article.status,
        change_summary=f"Editorial decision: {req.action}. Notes: {req.notes or 'None'}"
    )
    db.add(rev)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action=f"ARTICLE_{req.action}",
        entity="ARTICLE",
        entity_id=article.id,
        old_value_json=prev_status,
        new_value_json=article.status
    )
    db.add(audit)
    db.commit()

    return {"success": True, "new_status": article.status}

@router.get("/audit-logs")
def list_audit_logs(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "user_id": l.user_id,
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    folder_path: Optional[str] = Form(None),
    current_user: User = Depends(require_admin)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    # Auto-generate year/month folder structure if none is provided
    if not folder_path:
        from datetime import datetime
        now = datetime.now()
        folder_path = f"Uploads/{now.year}/{now.strftime('%m')}"

    content = await file.read()
    result = await storage_service.upload_file(file.filename, content, file.content_type, folder_path=folder_path)
    return result

@router.get("/storage/{file_id}")
async def view_storage_image(
    file_id: str
):
    try:
        stream_generator, mime_type = await storage_service.stream_file(file_id)
        return StreamingResponse(
            stream_generator,
            media_type=mime_type,
            headers={"Cache-Control": "public, max-age=604800"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Image not found: {str(e)}")

@router.get("/storage/files")
async def list_storage_files(
    current_user: User = Depends(require_admin)
):
    try:
        files = await storage_service.list_files()
        return {"items": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/storage/{file_id}")
async def delete_storage_file(
    file_id: str,
    current_user: User = Depends(require_admin)
):
    try:
        success = await storage_service.delete_file(file_id)
        if not success:
            raise HTTPException(status_code=404, detail="File not found or could not be deleted")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.services.ai_news_service import ai_news_service

class GenerateNewsRequest(BaseModel):
    category_slug: Optional[str] = None
    all_categories: bool = False

@router.post("/ai/generate-news")
async def generate_ai_news(
    req: Optional[GenerateNewsRequest] = None,
    current_user: User = Depends(require_admin)
):
    try:
        if req and req.all_categories:
            result = await ai_news_service.generate_all_categories()
            return result
        elif req and req.category_slug:
            result = await ai_news_service.generate_news_for_category(
                category_slug=req.category_slug,
                override_author_id=current_user.id
            )
            return result
        else:
            result = await ai_news_service.generate_news_for_category(
                category_slug='technology', 
                override_author_id=current_user.id
            )
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/scan/cambodia-news")
async def scan_cambodia_news(
    count: int = Query(3, ge=1, le=10),
    current_user: User = Depends(require_admin)
):
    """Scan and generate fresh Cambodia local tech, telecom, and national news."""
    try:
        res = await ai_news_service.generate_news_for_category(
            category_slug="cambodia",
            count=count,
            override_author_id=current_user.id
        )
        return {
            "status": "success",
            "section": "Cambodia News",
            "country": "KH",
            "result": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/scan/world-news")
async def scan_world_news(
    count: int = Query(3, ge=1, le=10),
    current_user: User = Depends(require_admin)
):
    """Scan and generate international technology and world news."""
    try:
        res = await ai_news_service.generate_news_for_category(
            category_slug="technology",
            count=count,
            override_author_id=current_user.id
        )
        return {
            "status": "success",
            "section": "World News",
            "country": "WORLD",
            "result": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/scan/discoveries")
async def scan_discoveries(
    count: int = Query(2, ge=1, le=5),
    current_user: User = Depends(require_admin)
):
    """Scan and generate in-depth visual science & technology explainers."""
    from app.services.discovery_service import discovery_service
    try:
        res = await discovery_service.scan_and_generate_discoveries(count=count)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/scan/quizzes")
async def scan_quizzes(
    current_user: User = Depends(require_admin)
):
    """Scan and generate new interactive daily challenge quiz."""
    from app.services.quiz_service import QuizService
    try:
        res = await QuizService.scan_and_generate_quizzes(count=1)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/scan/all")
async def scan_all_content_sections(
    current_user: User = Depends(require_admin)
):
    """
    Master Scanner: scans Cambodia News, World News, Visual Discoveries, and Quizzes in one operation.
    """
    from app.services.discovery_service import discovery_service
    from app.services.quiz_service import QuizService

    results = {}
    # 1. Cambodia News
    try:
        results["cambodia_news"] = await ai_news_service.generate_news_for_category("cambodia", count=2, override_author_id=current_user.id)
    except Exception as e:
        results["cambodia_news"] = {"error": str(e)}

    # 2. World News
    try:
        results["world_news"] = await ai_news_service.generate_news_for_category("technology", count=2, override_author_id=current_user.id)
    except Exception as e:
        results["world_news"] = {"error": str(e)}

    # 3. Discoveries
    try:
        results["discoveries"] = await discovery_service.scan_and_generate_discoveries(count=2)
    except Exception as e:
        results["discoveries"] = {"error": str(e)}

    # 4. Quizzes
    try:
        results["quizzes"] = await QuizService.scan_and_generate_quizzes(count=1)
    except Exception as e:
        results["quizzes"] = {"error": str(e)}

    return {
        "status": "success",
        "message": "Full multi-section scan completed across News (Cambodia & World), Discoveries, and Quizzes.",
        "results": results
    }

@router.post("/ai/enhance-news-images")
async def enhance_news_images(
    limit: int = Query(50, description="Max number of articles to process"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Scans articles that are missing a hero image or using generic fallbacks,
    searches for high-resolution relevant imagery, and updates them in the database.
    """
    from app.services.image_search_service import image_search_service
    from app.models.category import Category
    from app.services.filing import hero_provenance_ok

    # Anything with no hero, or a hero we cannot honestly show (stock pool, stock host,
    # or a caption from a different publisher than the file), is re-checked.
    candidates = db.query(Article).order_by(Article.created_at.desc()).limit(max(limit * 4, limit)).all()
    articles_to_fix = [
        art for art in candidates
        if not art.hero_image_url or not hero_provenance_ok(art.hero_image_url, art.hero_image_credit)[0]
    ][:limit]

    updated_count = 0
    cleared_count = 0
    updated_items = []

    for art in articles_to_fix:
        cat_slug = "technology"
        if art.category_id:
            cat = db.query(Category).filter(Category.id == art.category_id).first()
            if cat:
                cat_slug = cat.slug

        img_url, credit, alt = await image_search_service.search_news_image(
            title=art.title,
            category=cat_slug,
            country=art.country or "WORLD"
        )
        art.hero_image_url = img_url
        art.hero_image_credit = credit
        art.hero_image_alt = alt
        updated_count += 1
        if not img_url:
            cleared_count += 1
        updated_items.append({"id": art.id, "title": art.title, "image_url": img_url})

    db.commit()
    return {
        "status": "success",
        "updated_count": updated_count,
        # Stories counted here now publish with no photograph instead of a wrong one.
        "cleared_count": cleared_count,
        "articles": updated_items
    }

@router.post("/ai/enhance-place-images")
async def enhance_place_images(
    limit: int = Query(50, description="Max number of places to process"),
    force: bool = Query(False, description="Re-scan selected places even when their images already pass verification"),
    place_ids: Optional[str] = Query(None, description="Comma-separated place ids; targets one place from the admin row menu"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Give places a photograph that actually shows them, and name the ones that could not be fixed.

    Selection used to be "the hero is empty", which made a wrong photograph invisible to the
    scan: a place that already carried a hero was never a candidate, so pressing the button
    reported success while the wrong picture stayed on the card. A place is now a candidate
    whenever its stored images fail the same verifier that admits new ones
    (``place_image_audit``), and every outcome is reported by name instead of as one count:

    ``replaced``    verified photos were found and written over the old ones. Each row says
                    which half changed: ``hero_changed`` is the picture on the card, the one a
                    reader sees; ``gallery_changed`` is only the album behind it
    ``cleared``     nothing was found and the old image was provably unusable (stock pool,
                    local placeholder, not a URL) - the card now shows no photo, not a wrong one
    ``unconfirmed`` a photo is on the card, nothing better was found, and the old image is only
                    *suspect* (an opaque Wikimedia filename scores 0.0 without proof), so it is
                    kept and listed for a human
    ``no_photo``    the place never had a photo and Commons/Wikipedia have none of it; the card
                    shows the honest "not verified yet" tile instead of a stand-in
    ``confirmed_ok`` the filename-only audit was suspicious but researching the photo with its
                    article / Commons title proved it right - nothing was rewritten
    """
    import json
    from app.models.place import Place

    query = db.query(Place)
    ids = [i.strip() for i in (place_ids or "").split(",") if i.strip()]
    if ids:
        query = query.filter(Place.id.in_(ids))
    rows = query.order_by(Place.created_at.desc()).all()

    targets = []
    already_trusted = 0
    for p in rows:
        audit = place_image_audit(p.hero_image_url, p.gallery_json, p.name, p.local_name)
        if audit["needs_work"] or force:
            targets.append((p, audit))
        else:
            already_trusted += 1
    places_to_fix = targets[:limit]

    replaced: list[dict] = []
    cleared: list[dict] = []
    unconfirmed: list[dict] = []
    no_photo: list[dict] = []
    confirmed_ok: list[dict] = []

    for p, audit in places_to_fix:
        dest_name = p.destination.name if p.destination else "Cambodia"
        hero_before = p.hero_image_url
        gallery_before = parse_gallery_urls(p.gallery_json)
        hero, gallery = await ai_tourism_engine._resolve_place_images(
            name=p.name,
            dest_name=dest_name,
            place_type=p.place_type,
            local_name=p.local_name,
            target_count=12
        )

        if hero or gallery:
            new_hero = hero or (gallery[0] if gallery else None)
            # The audit only had a filename to judge; this resolver had the article / Commons
            # title. When both land on the same pictures the photographs were right all along,
            # and saying "replaced" would invent a change the reader will not see.
            hero_changed = bool(new_hero) and not same_image(new_hero, hero_before)
            gallery_changed = image_set_changed(gallery_before, gallery)
            if not hero_changed and not gallery_changed:
                confirmed_ok.append({
                    "id": p.id, "name": p.name, "province": dest_name,
                    "hero_image_url": new_hero, "verified_images": len(gallery),
                    "reasons": audit["reasons"],
                })
                continue
            p.hero_image_url = new_hero
            p.gallery_json = json.dumps(gallery)
            replaced.append({
                "id": p.id, "name": p.name, "province": dest_name,
                "hero_before": hero_before, "hero_image_url": p.hero_image_url,
                "hero_changed": hero_changed, "gallery_changed": gallery_changed,
                "verified_images": len(gallery), "reasons": audit["reasons"],
            })
            continue

        # Nothing verified was found. Only an image that is provably unusable may be removed
        # here - a low filename score is a suspicion, and deleting on a suspicion would discard
        # legitimate Wikimedia photos whose filenames simply do not repeat the place name.
        provably_unusable = [
            u for u in ([hero_before] if hero_before else []) + gallery_before
            if not u.startswith("http") or is_generic_place_image(u)
        ]
        if provably_unusable:
            keep_gallery = [u for u in gallery_before if u not in provably_unusable]
            p.hero_image_url = None if (hero_before in provably_unusable) else hero_before
            p.gallery_json = json.dumps(keep_gallery)
            cleared.append({
                "id": p.id, "name": p.name, "province": dest_name,
                "hero_before": hero_before, "removed": len(provably_unusable),
                "reasons": audit["reasons"],
            })
        elif hero_before and audit["needs_work"]:
            # A picture is on the card and we could not prove it right - keep it, flag it.
            unconfirmed.append({
                "id": p.id, "name": p.name, "province": dest_name,
                "hero": hero_before, "hero_score": audit["hero_score"],
                "reasons": audit["reasons"],
            })
        elif not hero_before:
            # Nothing stored and nothing found: Wikipedia and Commons simply have no photo of
            # this place. The card shows the honest "not verified yet" tile, not a stand-in.
            no_photo.append({
                "id": p.id, "name": p.name, "province": dest_name,
                "reasons": audit["reasons"],
            })

    db.commit()
    return {
        "status": "success",
        # Kept so older admin builds still read a number; it is replaced + cleared.
        "updated_count": len(replaced) + len(cleared),
        "replaced_count": len(replaced),
        "hero_replaced_count": sum(1 for r in replaced if r["hero_changed"]),
        "gallery_only_count": sum(1 for r in replaced if r["gallery_changed"] and not r["hero_changed"]),
        "cleared_count": len(cleared),
        "unconfirmed_count": len(unconfirmed),
        "no_photo_found_count": len(no_photo),
        "confirmed_ok_count": len(confirmed_ok),
        "places_examined": len(rows),
        "places_selected": len(places_to_fix),
        "already_trusted": already_trusted,
        "more_pending": max(0, len(targets) - len(places_to_fix)),
        "places": replaced,
        "no_verified_image": cleared,
        "needs_editorial_attention": unconfirmed,
        "no_photo_found": no_photo,
        "images_confirmed_ok": confirmed_ok,
    }

# ----------------------------------------------------------------- News Autopilot
@router.get("/autopilot")
def get_news_autopilot_status(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Autopilot config + per-draft verdicts (when each AI draft will go live, or why it's held)."""
    from app.services import news_autopilot

    drafts = db.query(Article).filter(Article.status == "AI_DRAFT").order_by(Article.created_at.asc()).limit(200).all()
    pending = []
    for a in drafts:
        verdict = news_autopilot.evaluate_draft(db, a)
        pending.append({
            "id": a.id,
            "title": a.title,
            "eligible": verdict.eligible,
            "reason": verdict.reason,
            "auto_publish_at": (verdict.auto_publish_at.isoformat() + "Z") if verdict.auto_publish_at else None,
        })
    db.rollback()  # quality gate may fill SEO defaults; keep this endpoint read-only

    recent = db.query(AuditLog).filter(AuditLog.action.like("AI_%")).order_by(desc(AuditLog.created_at)).limit(20).all()
    return {
        "config": news_autopilot.get_config(db),
        "pending": pending,
        "recent_actions": [
            {"action": l.action, "entity_id": l.entity_id, "from": l.old_value_json,
             "to": l.new_value_json, "at": l.created_at.isoformat()}
            for l in recent
        ],
    }


@router.post("/autopilot/run")
def run_news_autopilot_now(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Run publish/archive/purge immediately instead of waiting for the next worker cycle."""
    from app.services import news_autopilot
    return news_autopilot.run_lifecycle(db)


@router.post("/autopilot/generate")
async def generate_content_now(
    section: str = Query(..., description="discoveries | quiz | travel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Trigger an AI generation run for one content section on demand."""
    from app.services.ai_content_service import ai_content_service
    section = (section or "").lower()
    if section == "discoveries":
        return await ai_content_service.generate_discoveries()
    if section == "quiz":
        return await ai_content_service.generate_daily_quiz()
    if section == "travel":
        return await ai_content_service.generate_travel_content()
    raise HTTPException(status_code=400, detail="section must be one of: discoveries, quiz, travel")


class SettingUpdate(BaseModel):
    key: str
    value_json: str
    description: Optional[str] = None

@router.get("/settings")
def get_site_settings(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    settings = db.query(SiteSetting).all()
    return [{"key": s.key, "value_json": s.value_json, "description": s.description} for s in settings]

@router.put("/settings")
def update_site_settings(updates: List[SettingUpdate], db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    for update in updates:
        setting = db.query(SiteSetting).filter(SiteSetting.key == update.key).first()
        if setting:
            setting.value_json = update.value_json
            if update.description:
                setting.description = update.description
        else:
            new_setting = SiteSetting(
                key=update.key,
                value_json=update.value_json,
                description=update.description
            )
            db.add(new_setting)
    
    db.commit()
    return {"success": True}


# --------------------------------------------------------------------------- AI providers
class ProvidersUpdate(BaseModel):
    providers: List[Dict[str, Any]]

class ProviderTest(BaseModel):
    provider_id: str

@router.get("/ai-providers")
def get_ai_providers(current_user: User = Depends(require_admin)):
    """Redacted provider config (fallback order) plus the built-in vendor catalog."""
    from app.services import ai_gateway
    return {
        "providers": ai_gateway.redacted_providers(),
        "catalog": ai_gateway.catalog(),
        "has_active": ai_gateway.has_any_configured_provider(),
    }

@router.put("/ai-providers")
def save_ai_providers(
    payload: ProvidersUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Persist the provider registry. Masked keys keep the stored secret; a real string
    overwrites it; '__CLEAR__' removes it. Order in the list is fallback priority."""
    from app.services import ai_gateway
    try:
        ai_gateway.save_providers(db, payload.providers)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid provider config: {e}")
    return {"success": True, "providers": ai_gateway.redacted_providers()}

@router.post("/ai-providers/test")
def test_ai_provider(
    payload: ProviderTest,
    current_user: User = Depends(require_admin),
):
    """Ping one provider with a tiny prompt so the editor can verify a key works."""
    from app.services import ai_gateway
    return ai_gateway.test_provider(payload.provider_id)

from app.services.ai_tourism_engine import (                       # noqa: E402
    ai_tourism_engine,
    image_set_changed,
    is_generic_place_image,
    parse_gallery_urls,
    place_image_audit,
    same_image,
)

@router.post("/ai/tourism-scan")
async def run_tourism_full_scan(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """Run AI Tourism Engine across ALL 25 provinces of Cambodia with dynamic database auto-persistence.

    The scan keeps running after this response; progress and the real counts come from
    GET /admin/ai/tourism-scan/status.
    """
    try:
        if ai_tourism_engine.is_scan_running():
            raise HTTPException(
                status_code=409,
                detail="A discovery scan is already running. Watch its progress instead of starting another."
            )
        source = ai_tourism_engine.discovery_source()
        background_tasks.add_task(ai_tourism_engine.run_full_scan)
        return {
            "status": "started",
            "discovery_source": source,
            "message": (
                "Discovery scan started in the background. Follow GET /admin/ai/tourism-scan/status "
                "for progress; discovered places are auto-saved to the database."
            ),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/tourism-scan/status")
async def tourism_scan_status(current_user: User = Depends(require_admin)):
    """Live progress of the background discovery scan, plus the result of the last completed run."""
    return ai_tourism_engine.get_scan_status()

@router.post("/ai/tourism-scan/{province_slug}")
async def run_tourism_province_scan(
    province_slug: str,
    auto_save: bool = Query(False, description="Automatically save discovered places to database"),
    current_user: User = Depends(require_admin)
):
    """Run AI Tourism Engine for a single province."""
    try:
        result = await ai_tourism_engine.discover_places_for_province(province_slug, auto_save=auto_save)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/tourism-save")
async def ai_tourism_save_place(place_data: dict, current_user: User = Depends(require_admin)):
    try:
        result = await ai_tourism_engine.save_approved_place(place_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/tourism-places/{province_slug}")
def admin_get_tourism_places(province_slug: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.place import Place
    from app.models.location import Destination
    dest = db.query(Destination).filter(Destination.slug == province_slug).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    places = db.query(Place).filter(Place.destination_id == dest.id).order_by(Place.name).all()
    return [{
        "id": p.id,
        "name": p.name,
        "local_name": p.local_name,
        "slug": p.slug,
        "place_type": p.place_type,
        "description": p.description,
        "description_km": p.description_km,
        "address": p.address,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "phone": p.phone,
        "website": p.website,
        "email": p.email,
        "opening_hours": p.opening_hours,
        "price_level": p.price_level,
        "hero_image_url": p.hero_image_url,
        "gallery_json": p.gallery_json,
        "tags_json": p.tags_json,
        "verification_status": p.verification_status,
        "status": p.status,
        "rating": p.rating,
        "review_count": p.review_count,
        "views_count": p.views_count,
        "is_featured": p.is_featured,
        "created_at": p.created_at.isoformat() if p.created_at else None
    } for p in places]

@router.delete("/tourism-places/{place_id}")
def admin_delete_tourism_place(place_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from app.models.place import Place
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    db.delete(place)
    db.commit()
    return {"success": True}

@router.post("/tourism-places/{place_id}/update-via-ai")
async def update_tourism_place_via_ai(place_id: str, current_user: User = Depends(require_admin)):
    result = await ai_tourism_engine.update_place_via_ai(place_id)
    if result["status"] == "failed":
        raise HTTPException(status_code=500, detail=result.get("message", "Update failed"))
    return result

class DestinationUpdateRequest(BaseModel):
    hero_image_url: Optional[str] = None
    overview: Optional[str] = None
    best_time_to_visit: Optional[str] = None
    is_featured: Optional[bool] = None
    symbol_name: Optional[str] = None
    symbol_name_km: Optional[str] = None
    symbol_nickname: Optional[str] = None
    symbol_nickname_km: Optional[str] = None
    symbol_monument_type: Optional[str] = None
    symbol_story: Optional[str] = None
    symbol_photo_spot_tip: Optional[str] = None
    symbol_must_try_specialty: Optional[str] = None
    symbol_accent_color: Optional[str] = None
    symbol_emoji: Optional[str] = None
    symbol_image_url: Optional[str] = None

@router.patch("/destinations/{slug}")
def admin_update_destination(
    slug: str,
    update: DestinationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update destination details (hero image, overview, symbol, etc.)"""
    from app.models.location import Destination
    dest = db.query(Destination).filter(Destination.slug == slug).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    if update.hero_image_url is not None:
        dest.hero_image_url = update.hero_image_url
    if update.overview is not None:
        dest.overview = update.overview
    if update.best_time_to_visit is not None:
        dest.best_time_to_visit = update.best_time_to_visit
    if update.is_featured is not None:
        dest.is_featured = update.is_featured
    if update.symbol_name is not None:
        dest.symbol_name = update.symbol_name
    if update.symbol_name_km is not None:
        dest.symbol_name_km = update.symbol_name_km
    if update.symbol_nickname is not None:
        dest.symbol_nickname = update.symbol_nickname
    if update.symbol_nickname_km is not None:
        dest.symbol_nickname_km = update.symbol_nickname_km
    if update.symbol_monument_type is not None:
        dest.symbol_monument_type = update.symbol_monument_type
    if update.symbol_story is not None:
        dest.symbol_story = update.symbol_story
    if update.symbol_photo_spot_tip is not None:
        dest.symbol_photo_spot_tip = update.symbol_photo_spot_tip
    if update.symbol_must_try_specialty is not None:
        dest.symbol_must_try_specialty = update.symbol_must_try_specialty
    if update.symbol_accent_color is not None:
        dest.symbol_accent_color = update.symbol_accent_color
    if update.symbol_emoji is not None:
        dest.symbol_emoji = update.symbol_emoji
    if update.symbol_image_url is not None:
        dest.symbol_image_url = update.symbol_image_url
    db.commit()
    db.refresh(dest)
    return {"success": True, "slug": dest.slug, "hero_image_url": dest.hero_image_url}

class DatabaseMigrateRequest(BaseModel):
    target_url: str
    copy_data: bool = False

@router.post("/database/migrate")
def admin_migrate_database(
    req: DatabaseMigrateRequest,
    current_user: User = Depends(require_admin)
):
    """
    Super System: Connects to a new database and runs auto-migration (creating tables).
    If copy_data is True, attempts to copy existing data.
    """
    from sqlalchemy import create_engine
    from app.common.database import Base, engine as current_engine
    
    try:
        # 1. Connect to new target database
        new_engine = create_engine(req.target_url)
        
        # 2. Automatically create all tables (Smart System feature)
        Base.metadata.create_all(bind=new_engine)
        
        message = "Successfully connected and generated all tables in the new database."
        
        # 3. Optional: Try to copy data
        if req.copy_data:
            from sqlalchemy.orm import Session
            
            with new_engine.begin() as new_conn:
                with current_engine.begin() as old_conn:
                    for table in Base.metadata.sorted_tables:
                        try:
                            rows = old_conn.execute(table.select()).fetchall()
                            if rows:
                                rows_data = [row._asdict() for row in rows]
                                new_conn.execute(table.insert(), rows_data)
                        except Exception as table_err:
                            print(f"Failed to copy table {table.name}: {table_err}")
            
            message += " Data transfer attempt completed."
            
        return {"success": True, "message": message}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database migration failed: {str(e)}")

@router.get("/place-suggestions", response_model=List[PlaceSuggestionOut])
def get_place_suggestions(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, REJECTED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    query = db.query(PlaceSuggestion)
    if status:
        query = query.filter(PlaceSuggestion.status == status.upper())
    return query.order_by(desc(PlaceSuggestion.created_at)).all()

class SuggestionReviewRequest(BaseModel):
    moderation_notes: Optional[str] = None
    
@router.post("/place-suggestions/{suggestion_id}/approve")
def approve_place_suggestion(
    suggestion_id: str,
    req: SuggestionReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    suggestion = db.query(PlaceSuggestion).filter(PlaceSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
        
    if suggestion.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Suggestion already {suggestion.status.lower()}")
        
    suggestion.status = "APPROVED"
    suggestion.moderation_notes = req.moderation_notes
    
    # Process based on type
    dest = db.query(Destination).filter(Destination.slug == suggestion.destination_slug).first()
    if not dest:
        raise HTTPException(status_code=400, detail="Destination not found")
        
    if suggestion.suggestion_type == "NEW_PLACE":
        from app.services.travel_service import slugify
        base_slug = slugify(suggestion.place_name) or "place"
        slug = base_slug
        counter = 1
        while db.query(Place).filter(Place.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        new_place = Place(
            destination_id=dest.id,
            name=suggestion.place_name,
            slug=slug,
            place_type=suggestion.place_type or "ATTRACTION",
            description=suggestion.details,
            status="ACTIVE",
            verification_status="USER_SUBMITTED"
        )
        db.add(new_place)
        
    db.commit()
    return {"success": True, "message": "Suggestion approved"}

@router.post("/place-suggestions/{suggestion_id}/reject")
def reject_place_suggestion(
    suggestion_id: str,
    req: SuggestionReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    suggestion = db.query(PlaceSuggestion).filter(PlaceSuggestion.id == suggestion_id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
        
    if suggestion.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Suggestion already {suggestion.status.lower()}")
        
    suggestion.status = "REJECTED"
    suggestion.moderation_notes = req.moderation_notes
    db.commit()
    return {"success": True, "message": "Suggestion rejected"}
