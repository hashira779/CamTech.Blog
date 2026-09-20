from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.transport_service import TransportService
from app.services.nearby_service import NearbyService
from app.services.guide_service import GuideService
from app.schemas.transport import (
    TransportOperatorOut,
    TransportHubOut,
    TransportRouteOut,
    RouteSearchResponse,
    NearbySearchResponse,
    NearbyPlaceOut,
    TravelGuideOut,
    EventOut,
)

router = APIRouter(tags=["Transport & Guides"])

@router.get("/transport/search", response_model=RouteSearchResponse)
def search_transport_routes(
    origin: str = Query(..., description="Origin destination slug or name (e.g. phnom-penh)"),
    destination: str = Query(..., description="Target destination slug or name (e.g. siem-reap)"),
    type: Optional[str] = Query(None, description="BUS, MINIVAN, TRAIN, FERRY, TAXI"),
    db: Session = Depends(get_db),
):
    service = TransportService(db)
    routes = service.search_routes(
        origin_slug_or_name=origin,
        dest_slug_or_name=destination,
        transport_type=type
    )
    return RouteSearchResponse(
        origin=origin,
        destination=destination,
        total_options=len(routes),
        routes=routes
    )

@router.get("/transport/operators", response_model=List[TransportOperatorOut])
def get_transport_operators(
    type: Optional[str] = Query(None, description="Filter by BUS, MINIVAN, TRAIN, FERRY, TAXI"),
    db: Session = Depends(get_db),
):
    service = TransportService(db)
    return service.get_operators(operator_type=type)

@router.get("/transport/operators/{slug}", response_model=TransportOperatorOut)
def get_transport_operator(
    slug: str,
    db: Session = Depends(get_db),
):
    service = TransportService(db)
    operator = service.get_operator_by_slug(slug)
    if not operator:
        raise HTTPException(status_code=404, detail="Transport operator not found")
    return operator

@router.get("/transport/hubs", response_model=List[TransportHubOut])
def get_transport_hubs(
    destination_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None, description="BUS_STATION, MINIVAN_STATION, TRAIN_STATION, FERRY_PORT, AIRPORT"),
    db: Session = Depends(get_db),
):
    service = TransportService(db)
    return service.get_hubs(destination_id=destination_id, hub_type=type)

@router.get("/nearby", response_model=NearbySearchResponse)
def search_nearby(
    place: Optional[str] = Query(None, description="Reference place slug, e.g. angkor-wat"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude"),
    radius: float = Query(10.0, ge=0.5, le=100.0, description="Radius in kilometers"),
    type: Optional[str] = Query(None, description="Filter by ATTRACTION, ACCOMMODATION, RESTAURANT, etc."),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    service = NearbyService(db)
    if place:
        res = service.search_nearby_place(place_slug=place, radius_km=radius, place_type=type, limit=limit)
        if not res:
            raise HTTPException(status_code=404, detail=f"Reference place '{place}' not found")
        return res
    elif lat is not None and lng is not None:
        items = service.search_nearby_coordinates(lat=lat, lng=lng, radius_km=radius, place_type=type, limit=limit)
        return NearbySearchResponse(
            reference_name=f"Coordinates ({lat}, {lng})",
            reference_lat=lat,
            reference_lng=lng,
            radius_km=radius,
            total=len(items),
            results=items
        )
    else:
        raise HTTPException(status_code=400, detail="Must provide either 'place' slug or 'lat' and 'lng' parameters")

@router.get("/travel-guides", response_model=List[TravelGuideOut])
def get_travel_guides(
    destination: Optional[str] = Query(None, description="Destination slug"),
    db: Session = Depends(get_db),
):
    service = GuideService(db)
    return service.get_guides(destination_slug=destination)

@router.get("/travel-guides/{slug}", response_model=TravelGuideOut)
def get_travel_guide(
    slug: str,
    db: Session = Depends(get_db),
):
    service = GuideService(db)
    guide = service.get_guide_by_slug(slug)
    if not guide:
        raise HTTPException(status_code=404, detail="Travel guide not found")
    return guide

@router.get("/events", response_model=List[EventOut])
def get_events(
    destination: Optional[str] = Query(None, description="Destination slug"),
    db: Session = Depends(get_db),
):
    service = GuideService(db)
    return service.get_events(destination_slug=destination)
