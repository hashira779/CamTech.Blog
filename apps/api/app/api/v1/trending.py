from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.trending_service import TrendingService
from app.schemas.trending import TrendingResponse

router = APIRouter(prefix="/trending", tags=["Trending"])

@router.get("", response_model=TrendingResponse)
def get_trending(limit: int = Query(6, ge=1, le=20), db: Session = Depends(get_db)):
    data = TrendingService.get_trending_items(db, limit)
    return TrendingResponse(
        cambodia=data["cambodia"],
        world=data["world"],
        editor_picks=data["editor_picks"]
    )
