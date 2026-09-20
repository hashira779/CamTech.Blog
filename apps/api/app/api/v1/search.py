from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.search_service import SearchService
from app.schemas.search import SearchResponse

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=SearchResponse)
def search_global(
    q: str = Query(..., min_length=1),
    category: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=50),
    db: Session = Depends(get_db)
):
    results = SearchService.search(
        db=db,
        query_text=q,
        category=category,
        country=country,
        entity_type=type,
        limit=limit
    )
    return SearchResponse(
        query=q,
        total=len(results),
        results=results
    )
