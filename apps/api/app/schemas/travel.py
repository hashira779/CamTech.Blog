from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class CountryBase(BaseModel):
    code: str
    name: str
    name_km: Optional[str] = None
    currency_code: Optional[str] = "USD"
    is_active: Optional[bool] = True

class CountryCreate(CountryBase):
    pass

class CountryOut(CountryBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class DestinationBase(BaseModel):
    name: str
    name_km: Optional[str] = None
    slug: str
    overview: str
    overview_km: Optional[str] = None
    hero_image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    best_time_to_visit: Optional[str] = None
    practical_info: Optional[str] = None
    is_featured: Optional[bool] = False

class DestinationCreate(DestinationBase):
    country_id: str

class DestinationOut(DestinationBase):
    id: str
    country_id: str
    views_count: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AccommodationOut(BaseModel):
    id: str
    property_type: str
    star_rating: int
    price_range: str
    check_in_time: str
    check_out_time: str
    room_types_json: str
    has_swimming_pool: bool
    has_free_wifi: bool
    has_breakfast: bool
    booking_url: Optional[str] = None

    class Config:
        from_attributes = True

class PlaceBase(BaseModel):
    destination_id: str
    name: str
    local_name: Optional[str] = None
    place_type: str
    description: str
    description_km: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    opening_hours: Optional[str] = None
    price_level: Optional[str] = "$$"
    hero_image_url: Optional[str] = None
    gallery_json: Optional[str] = "[]"
    amenities_json: Optional[str] = "[]"
    tags_json: Optional[str] = "[]"
    is_featured: Optional[bool] = False

class PlaceCreate(PlaceBase):
    slug: Optional[str] = None

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    local_name: Optional[str] = None
    description: Optional[str] = None
    description_km: Optional[str] = None
    address: Optional[str] = None
    opening_hours: Optional[str] = None
    price_level: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    hero_image_url: Optional[str] = None
    status: Optional[str] = None  # ACTIVE, CLOSED, TEMPORARILY_CLOSED, ARCHIVED

class PlaceOut(PlaceBase):
    id: str
    slug: str
    verification_status: str
    status: str
    rating: float
    review_count: int
    views_count: int
    created_at: datetime
    updated_at: datetime
    accommodation: Optional[AccommodationOut] = None

    class Config:
        from_attributes = True

class DestinationDetailOut(DestinationOut):
    places: List[PlaceOut] = []
    country: Optional[CountryOut] = None

class PlaceListResponse(BaseModel):
    items: List[PlaceOut]
    total: int

class DestinationListResponse(BaseModel):
    items: List[DestinationOut]
    total: int

# Suggestion Schemas
class PlaceSuggestionCreate(BaseModel):
    suggestion_type: str  # NEW_PLACE, UPDATE_INFO, REPORT_CLOSED, INACCURACY
    place_id: Optional[str] = None
    place_name: str
    destination_slug: str
    place_type: Optional[str] = "ATTRACTION"
    details: str
    submitter_name: Optional[str] = None
    submitter_contact: Optional[str] = None
    source_notes: Optional[str] = None

class PlaceSuggestionOut(PlaceSuggestionCreate):
    id: str
    status: str
    moderation_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Trip Schemas
class TripDayItemOut(BaseModel):
    id: str
    place_id: Optional[str] = None
    time_of_day: str
    start_time: Optional[str] = None
    title: str
    description: Optional[str] = None
    duration_minutes: int
    order_index: int
    place: Optional[PlaceOut] = None

    class Config:
        from_attributes = True

class TripDayOut(BaseModel):
    id: str
    day_number: int
    title: str
    summary: Optional[str] = None
    items: List[TripDayItemOut] = []

    class Config:
        from_attributes = True

class TripOut(BaseModel):
    id: str
    destination_id: str
    title: str
    title_km: Optional[str] = None
    slug: str
    description: str
    description_km: Optional[str] = None
    duration_days: int
    travel_style: str
    budget_level: str
    hero_image_url: Optional[str] = None
    is_featured: bool
    is_curated: bool
    status: str
    created_at: datetime
    days: List[TripDayOut] = []

    class Config:
        from_attributes = True

class TripListResponse(BaseModel):
    items: List[TripOut]
    total: int

# Interactive Trip Planner Generator Request/Response
class TripPlanRequest(BaseModel):
    destination_slug: str
    duration_days: int = 3
    travel_style: str = "CULTURAL"  # CULTURAL, RELAXED, ADVENTURE, LUXURY, FAMILY
    budget_level: str = "$$"         # $, $$, $$$, $$$$
    interests: List[str] = ["Temples", "Food", "Nature"]

class GeneratedTripDayItem(BaseModel):
    time_of_day: str
    start_time: str
    title: str
    description: str
    place_id: Optional[str] = None
    place_name: Optional[str] = None
    duration_minutes: int
    estimated_cost: str

class GeneratedTripDay(BaseModel):
    day_number: int
    title: str
    theme: str
    items: List[GeneratedTripDayItem]

class TripPlanResponse(BaseModel):
    destination_name: str
    destination_slug: str
    duration_days: int
    travel_style: str
    budget_level: str
    summary: str
    days: List[GeneratedTripDay]
