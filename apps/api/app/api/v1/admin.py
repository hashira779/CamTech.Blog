from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from pydantic import BaseModel
from app.common.database import get_db
from app.models.article import Article, ArticleRevision
from app.models.source import Source, SourceFetchLog
from app.models.discovery import Discovery
from app.models.quiz import Quiz
from app.models.tool import Tool
from app.models.audit import AuditLog
from app.models.user import User
from app.services.auth_service import require_admin
from app.services.article_service import ArticleService

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
