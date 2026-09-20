from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.common.database import get_db
from app.models.discovery import Discovery
from app.schemas.discovery import DiscoveryOut, DiscoveryListResponse

router = APIRouter(prefix="/discoveries", tags=["Discoveries"])

@router.get("", response_model=DiscoveryListResponse)
def list_discoveries(
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    query = db.query(Discovery).filter(Discovery.is_published == 1)
    if category:
        query = query.filter(Discovery.category.ilike(f"%{category}%"))
    
    total = query.count()
    items = query.order_by(desc(Discovery.published_at)).limit(limit).all()
    return DiscoveryListResponse(items=items, total=total)

@router.get("/{slug}", response_model=DiscoveryOut)
def get_discovery(slug: str, db: Session = Depends(get_db)):
    item = db.query(Discovery).filter(Discovery.slug == slug, Discovery.is_published == 1).first()
    if not item:
        raise HTTPException(status_code=404, detail="Discovery not found")
    item.views_count += 1
    db.commit()
    return item
