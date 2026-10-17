from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class WeddingAuthRequest(BaseModel):
    phone: str = Field(..., description="Phone number, e.g. 012345678")
    username: Optional[str] = Field(None, description="Display name / Username")
    password: str = Field(..., min_length=4, description="Password")

class WeddingUserResponse(BaseModel):
    id: str
    phone: str
    username: str
    created_at: Optional[datetime] = None

class WeddingCardUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    theme: Optional[str] = None
    groom_name: Optional[str] = None
    groom_title: Optional[str] = None
    groom_parents: Optional[str] = None
    groom_image_url: Optional[str] = None
    bride_name: Optional[str] = None
    bride_title: Optional[str] = None
    bride_parents: Optional[str] = None
    bride_image_url: Optional[str] = None
    khmer_date: Optional[str] = None
    solar_date: Optional[str] = None
    solar_time: Optional[str] = None
    morning_agenda: Optional[str] = None
    evening_reception: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[str] = None
    music_url: Optional[str] = None
    khqr_image_url: Optional[str] = None
    khqr_account_name: Optional[str] = None
    khqr_account_number: Optional[str] = None
    enable_rsvp: Optional[bool] = None
    enable_wishes: Optional[bool] = None
    is_published: Optional[bool] = None

class WeddingWishCreate(BaseModel):
    guest_name: str
    phone: Optional[str] = None
    attendance: Optional[str] = "attending"
    guest_count: Optional[int] = 1
    blessing_message: str

class WeddingWishResponse(BaseModel):
    id: str
    guest_name: str
    attendance: str
    guest_count: int
    blessing_message: str
    created_at: Optional[datetime] = None

class WeddingCardResponse(BaseModel):
    id: str
    slug: str
    theme: str
    title: str
    groom_name: str
    groom_title: str
    groom_parents: str
    groom_image_url: Optional[str] = None
    bride_name: str
    bride_title: str
    bride_parents: str
    bride_image_url: Optional[str] = None
    khmer_date: str
    solar_date: str
    solar_time: str
    morning_agenda: Optional[str] = None
    evening_reception: Optional[str] = None
    cover_image_url: Optional[str] = None
    gallery_images: Optional[str] = None
    music_url: Optional[str] = None
    khqr_image_url: Optional[str] = None
    khqr_account_name: Optional[str] = None
    khqr_account_number: Optional[str] = None
    enable_rsvp: bool
    enable_wishes: bool
    is_published: bool
    wishes: Optional[List[WeddingWishResponse]] = []
    created_at: Optional[datetime] = None

class WeddingAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new: bool
    user: WeddingUserResponse
    card: Optional[WeddingCardResponse] = None
