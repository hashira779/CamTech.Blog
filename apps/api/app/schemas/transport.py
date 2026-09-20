from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.schemas.travel import DestinationOut, PlaceOut

class TransportHubOut(BaseModel):
    id: str
    destination_id: Optional[str] = None
    name: str
    local_name: Optional[str] = None
    slug: str
    hub_type: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    facilities_json: str
    status: str
    verification_status: str

    class Config:
        from_attributes = True

class TransportScheduleOut(BaseModel):
    id: str
    departure_time: str
    arrival_time: str
    days_of_week: str
    price_usd: float
    currency: str
    vehicle_class: str
    service_calendar_type: str
    status: str
    source: str
    booking_url: Optional[str] = None
    last_verified_at: datetime

    class Config:
        from_attributes = True

class TransportStopOut(BaseModel):
    id: str
    stop_name: str
    stop_order: int
    arrival_offset_minutes: int
    departure_offset_minutes: int
    hub: Optional[TransportHubOut] = None

    class Config:
        from_attributes = True

class TransportOperatorOut(BaseModel):
    id: str
    name: str
    local_name: Optional[str] = None
    slug: str
    operator_type: str
    description: str
    description_km: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    rating: float
    review_count: int
    amenities_json: str
    status: str
    verification_status: str
    last_verified_at: datetime

    class Config:
        from_attributes = True

class TransportRouteOut(BaseModel):
    id: str
    operator_id: str
    origin_destination_id: str
    destination_id: str
    name: str
    slug: str
    transport_type: str
    description: Optional[str] = None
    duration_minutes: int
    distance_km: float
    base_price_usd: float
    status: str
    verification_status: str
    last_verified_at: datetime
    operator: Optional[TransportOperatorOut] = None
    origin_hub: Optional[TransportHubOut] = None
    destination_hub: Optional[TransportHubOut] = None
    schedules: List[TransportScheduleOut] = []

    class Config:
        from_attributes = True

class RouteSearchResponse(BaseModel):
    origin: str
    destination: str
    total_options: int
    routes: List[TransportRouteOut]

class NearbyPlaceOut(BaseModel):
    place: PlaceOut
    distance_km: float
    estimated_walk_minutes: int
    estimated_drive_minutes: int

class NearbySearchResponse(BaseModel):
    reference_name: str
    reference_lat: float
    reference_lng: float
    radius_km: float
    total: int
    results: List[NearbyPlaceOut]

class TravelGuideOut(BaseModel):
    id: str
    destination_id: str
    title: str
    title_km: Optional[str] = None
    slug: str
    summary: str
    content: str
    hero_image_url: Optional[str] = None
    read_time_minutes: str
    status: str
    published_at: datetime

    class Config:
        from_attributes = True

class EventOut(BaseModel):
    id: str
    destination_id: str
    name: str
    name_km: Optional[str] = None
    slug: str
    description: str
    event_type: str
    venue: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    hero_image_url: Optional[str] = None
    status: str

    class Config:
        from_attributes = True
