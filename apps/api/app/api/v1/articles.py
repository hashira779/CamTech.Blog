from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.article_service import ArticleService
from app.schemas.article import ArticleOut, ArticleCreate, ArticleUpdate, ArticleListResponse, QualityChecklist
from app.services.auth_service import require_admin, get_current_user
from app.models.user import User

router = APIRouter(prefix="/articles", tags=["Articles"])

@router.get("", response_model=ArticleListResponse)
def list_articles(
    country: Optional[str] = Query(None, description="Country filter (e.g. KH, WORLD)"),
    category: Optional[str] = Query(None, description="Category slug"),
    author: Optional[str] = Query(None, description="Author slug"),
    source: Optional[str] = Query(None, description="Source slug"),
    status: Optional[str] = Query("PUBLISHED", description="Article status filter"),
    search: Optional[str] = Query(None, description="Search term"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    # Unreviewed AI drafts, rejected and archived stories are editor-only.
    if (status or "").upper() != "PUBLISHED":
        require_admin(current_user)
    skip = (page - 1) * limit
    articles, total = ArticleService.get_articles(
        db=db,
        country=country,
        category_slug=category,
        author_slug=author,
        source_slug=source,
        status=status,
        search=search,
        skip=skip,
        limit=limit
    )
    return ArticleListResponse(
        items=articles,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{slug_or_id}", response_model=ArticleOut)
def get_article(
    slug_or_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    article = ArticleService.get_article_by_slug(db, slug_or_id)
    if not article:
        article = ArticleService.get_article_by_id(db, slug_or_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.status != "PUBLISHED":
        try:
            require_admin(current_user)
        except HTTPException:
            raise HTTPException(status_code=404, detail="Article not found")
        return article  # editor preview: don't count views on unpublished drafts
    
    # Increment view counter on retrieval
    article.views_count = (article.views_count or 0) + 1
    db.commit()
    return article

@router.get("/{article_id}/quality-gate", response_model=QualityChecklist)
def get_quality_gate(article_id: str, db: Session = Depends(get_db)):
    article = ArticleService.get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleService.validate_quality_gate(article, db)

@router.post("", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(
    article_in: ArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    article = ArticleService.create_article(db, article_in, editor_user_id=current_user.id)
    return article

@router.post("/{article_id}/publish", response_model=ArticleOut)
def publish_article(
    article_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    try:
        article, checklist = ArticleService.publish_article(db, article_id, editor_user_id=current_user.id)
        return article
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{article_id}")
def delete_article(
    article_id: str,
    permanent: bool = Query(False, description="Hard-delete instead of archiving"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Archive-first delete: the first delete hides the article (ARCHIVED, restorable).
    Deleting an already-archived article (or permanent=true) removes it for good."""
    from datetime import datetime, timezone
    from app.models.article import Article, ArticleRevision
    from app.models.audit import AuditLog

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if permanent or article.status == "ARCHIVED":
        db.add(AuditLog(user_id=current_user.id, action="ARTICLE_DELETE", entity="ARTICLE",
                        entity_id=article.id, old_value_json=article.title, new_value_json="DELETED"))
        db.delete(article)
        db.commit()
        return {"success": True, "deleted": True, "archived": False}

    prev = article.status
    article.status = "ARCHIVED"
    article.updated_at = datetime.now(timezone.utc)
    db.add(ArticleRevision(article_id=article.id, editor_user_id=current_user.id, previous_status=prev,
                           new_status="ARCHIVED", change_summary="Archived from admin (restorable)"))
    db.add(AuditLog(user_id=current_user.id, action="ARTICLE_ARCHIVE", entity="ARTICLE",
                    entity_id=article.id, old_value_json=prev, new_value_json="ARCHIVED"))
    db.commit()
    return {"success": True, "deleted": False, "archived": True}
