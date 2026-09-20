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
    db: Session = Depends(get_db)
):
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
def get_article(slug_or_id: str, db: Session = Depends(get_db)):
    article = ArticleService.get_article_by_slug(db, slug_or_id)
    if not article:
        article = ArticleService.get_article_by_id(db, slug_or_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Increment view counter on retrieval
    article.views_count += 1
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
