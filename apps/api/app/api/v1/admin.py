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
    action: str  # APPROVE, REJECT, REQUEST_REVISION, PUBLISH
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

@router.post("/ai/generate-news")
async def generate_ai_news(
    current_user: User = Depends(require_admin)
):
    try:
        # Fetch technology category id
        # In a real app we might pass this, for now we can use a known category id or fetch it
        result = await ai_news_service.generate_and_publish_news(
            category_id='ca82761b-c4b3-43a0-82fd-75188f694e2e', 
            author_id=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

from app.services.ai_tourism_engine import ai_tourism_engine

@router.post("/ai/tourism-scan")
async def run_tourism_full_scan(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin)
):
    """Run AI Tourism Engine across ALL 25 provinces of Cambodia."""
    try:
        background_tasks.add_task(ai_tourism_engine.run_full_scan)
        return {"status": "started", "message": "Full tourism scan started in the background. It may take several minutes."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/tourism-scan/{province_slug}")
async def run_tourism_province_scan(
    province_slug: str,
    current_user: User = Depends(require_admin)
):
    """Run AI Tourism Engine for a single province."""
    try:
        # Now it is fast enough to run synchronously because image fetching is moved to the save endpoint
        result = await ai_tourism_engine.discover_places_for_province(province_slug)
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

@router.patch("/destinations/{slug}")
def admin_update_destination(
    slug: str,
    update: DestinationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update destination details (hero image, overview, etc.)"""
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
        new_place = Place(
            destination_id=dest.id,
            name=suggestion.place_name,
            slug=slugify(suggestion.place_name),
            place_type=suggestion.place_type,
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
