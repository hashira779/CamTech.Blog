from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.travel_service import TravelService
from app.schemas.travel import (
    CountryOut,
    DestinationOut,
    DestinationDetailOut,
    PlaceOut,
    PlaceListResponse,
    PlaceSuggestionCreate,
    PlaceSuggestionOut,
    TripOut,
    TripPlanRequest,
    TripPlanResponse,
    PlaceUpdate,
)

router = APIRouter(prefix="/travel", tags=["Travel"])

@router.get("/countries", response_model=List[CountryOut])
def get_countries(db: Session = Depends(get_db)):
    return TravelService.get_countries(db)

@router.get("/destinations", response_model=List[DestinationOut])
def get_destinations(
    featured_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    return TravelService.get_destinations(db, featured_only=featured_only)

@router.get("/destinations/{slug}", response_model=DestinationDetailOut)
def get_destination(slug: str, db: Session = Depends(get_db)):
    dest = TravelService.get_destination_by_slug(db, slug)
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    return dest

@router.get("/places", response_model=PlaceListResponse)
def get_places(
    destination: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    featured: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = TravelService.get_places(
        db,
        destination_slug=destination,
        place_type=type,
        search=search,
        is_featured=featured,
        limit=limit,
        offset=offset,
    )
    return PlaceListResponse(items=items, total=total)

@router.get("/places/{slug}", response_model=PlaceOut)
def get_place(slug: str, db: Session = Depends(get_db)):
    place = TravelService.get_place_by_slug(db, slug)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place

@router.post("/suggestions", response_model=PlaceSuggestionOut)
def submit_place_suggestion(
    req: PlaceSuggestionCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    suggestion = TravelService.create_place_suggestion(db, req, ip_address=client_ip)
    return suggestion

@router.get("/trips", response_model=List[TripOut])
def get_trips(
    destination: Optional[str] = Query(None),
    featured: bool = Query(False),
    db: Session = Depends(get_db),
):
    return TravelService.get_trips(db, destination_slug=destination, featured_only=featured)

@router.get("/trips/{slug}", response_model=TripOut)
def get_trip(slug: str, db: Session = Depends(get_db)):
    trip = TravelService.get_trip_by_slug(db, slug)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip itinerary not found")
    return trip

@router.post("/planner/generate", response_model=TripPlanResponse)
def generate_trip_plan(
    req: TripPlanRequest,
    db: Session = Depends(get_db),
):
    return TravelService.generate_trip_plan(db, req)

@router.patch("/places/{place_id}/status", response_model=PlaceOut)
def update_place_status(
    place_id: str,
    status: str = Query(..., description="ACTIVE, CLOSED, TEMPORARILY_CLOSED, ARCHIVED, MERGED"),
    reason: Optional[str] = Query(None),
    merged_into_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Admin non-destructive status update (no direct deletes)"""
    try:
        updated = TravelService.update_place_status(
            db,
            place_id=place_id,
            new_status=status,
            actor="Admin",
            reason=reason,
            merged_into_id=merged_into_id
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Place not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
