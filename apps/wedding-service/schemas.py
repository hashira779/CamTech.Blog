import json
import re
from datetime import datetime, timezone
from typing import Optional, List, Literal, Dict
from pydantic import BaseModel, Field, field_validator

from security import is_safe_url


def _as_utc(value):
    """Rows store naive UTC; say so on the wire, or browsers read it as local time."""
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class _UtcTimes(BaseModel):
    @field_validator("created_at", "updated_at", mode="before", check_fields=False)
    @classmethod
    def _utc(cls, v):
        return _as_utc(v)



class WeddingAuthRequest(BaseModel):
    phone: str = Field(..., max_length=30, description="Phone number")
    username: Optional[str] = Field(None, max_length=100, description="Display name / Username")
    password: str = Field(..., min_length=4, max_length=128, description="Password")

class WeddingUserResponse(_UtcTimes):
    id: str
    phone: str
    username: str
    created_at: Optional[datetime] = None


def _check_url(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip()
    if not is_safe_url(value):
        raise ValueError("must be an http(s) link or an uploaded file path")
    return value


# Places in the wedding-hall scene where a couple can put their own kbach
# ornament image (a transparent PNG). Mirrors apps/web/src/lib/wedding-ornaments.ts
ORNAMENT_SLOTS = (
    "stage_arch", "stage_center", "wall_panel", "post_strip", "border",
    "pendant", "gable", "naga", "wall_pattern", "flower",
)


class WeddingCardUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=60)
    theme: Optional[str] = Field(None, max_length=50, pattern=r"^[a-z0-9_]+$")
    groom_name: Optional[str] = Field(None, max_length=100)
    groom_title: Optional[str] = Field(None, max_length=100)
    groom_parents: Optional[str] = Field(None, max_length=255)
    groom_image_url: Optional[str] = Field(None, max_length=500)
    bride_name: Optional[str] = Field(None, max_length=100)
    bride_title: Optional[str] = Field(None, max_length=100)
    bride_parents: Optional[str] = Field(None, max_length=255)
    bride_image_url: Optional[str] = Field(None, max_length=500)
    khmer_date: Optional[str] = Field(None, max_length=255)
    solar_date: Optional[str] = Field(None, max_length=50, pattern=r"^(\d{4}-\d{2}-\d{2})?$")
    solar_time: Optional[str] = Field(None, max_length=50)
    morning_agenda: Optional[str] = Field(None, max_length=20000)
    evening_reception: Optional[str] = Field(None, max_length=5000)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    gallery_images: Optional[str] = Field(None, max_length=40000)
    music_url: Optional[str] = Field(None, max_length=500)
    khqr_image_url: Optional[str] = Field(None, max_length=500)
    khqr_account_name: Optional[str] = Field(None, max_length=100)
    khqr_account_number: Optional[str] = Field(None, max_length=100)
    enable_rsvp: Optional[bool] = None
    enable_wishes: Optional[bool] = None
    is_published: Optional[bool] = None

    # The full set of ornament images: what is sent replaces what was stored,
    # and a slot left out (or sent empty) goes back to the scene's drawing
    ornaments: Optional[Dict[str, Optional[str]]] = None

    @field_validator("ornaments")
    @classmethod
    def _ornaments(cls, v: Optional[Dict[str, Optional[str]]]) -> Optional[Dict[str, str]]:
        if v is None:
            return None
        out: Dict[str, str] = {}
        for slot, url in v.items():
            if slot not in ORNAMENT_SLOTS:
                raise ValueError(f"Unknown ornament place: {slot}")
            url = (url or "").strip()
            if not url:
                continue
            if len(url) > 500 or not is_safe_url(url):
                raise ValueError(f"Invalid image link for {slot}")
            out[slot] = url
        return out

    @field_validator("groom_image_url", "bride_image_url", "cover_image_url", "music_url", "khqr_image_url")
    @classmethod
    def _urls(cls, v: Optional[str]) -> Optional[str]:
        return _check_url(v)

    @field_validator("groom_name", "bride_name", "groom_title", "bride_title", "groom_parents", "bride_parents")
    @classmethod
    def _tidy_names(cls, v: Optional[str]) -> Optional[str]:
        """Drop zero-width characters and collapse runs of spaces, which
        pasted or IME-typed names often carry and which show as odd gaps."""
        if v is None:
            return v
        v = re.sub(r"[\u200B-\u200D\uFEFF]", "", v)
        return re.sub(r"\s+", " ", v).strip()

    @field_validator("gallery_images")
    @classmethod
    def _gallery(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        try:
            items = json.loads(v)
        except ValueError:
            raise ValueError("gallery must be a JSON list of links")
        if not isinstance(items, list) or len(items) > 60:
            raise ValueError("gallery must be a list of at most 60 links")
        for item in items:
            if not isinstance(item, str) or len(item) > 500 or not is_safe_url(item):
                raise ValueError("every gallery item must be an http(s) link or an uploaded file path")
        return json.dumps(items, ensure_ascii=False)

    @field_validator("morning_agenda")
    @classmethod
    def _agenda(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        try:
            items = json.loads(v)
        except ValueError:
            raise ValueError("agenda must be a JSON list")
        if not isinstance(items, list) or len(items) > 30:
            raise ValueError("agenda must be a list of at most 30 items")
        clean = []
        for item in items:
            if not isinstance(item, dict):
                raise ValueError("agenda items must be objects")
            clean.append({
                "time": str(item.get("time", ""))[:60],
                "title": str(item.get("title", ""))[:200],
                "description": str(item.get("description", ""))[:1000],
            })
        return json.dumps(clean, ensure_ascii=False)

    @field_validator("evening_reception")
    @classmethod
    def _reception(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        try:
            obj = json.loads(v)
        except ValueError:
            raise ValueError("reception must be a JSON object")
        if not isinstance(obj, dict):
            raise ValueError("reception must be a JSON object")
        map_url = str(obj.get("map_url", "") or "")
        if not is_safe_url(map_url):
            raise ValueError("map link must be an http(s) link")
        clean = {
            "venue": str(obj.get("venue", ""))[:255],
            "hall": str(obj.get("hall", "") or "")[:255],
            "time": str(obj.get("time", ""))[:60],
            "address": str(obj.get("address", ""))[:500],
            "map_url": map_url[:1000],
        }
        return json.dumps(clean, ensure_ascii=False)


class WeddingWishCreate(BaseModel):
    guest_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    attendance: Literal["attending", "not_attending", "unsure"] = "attending"
    guest_count: int = Field(1, ge=0, le=20)
    blessing_message: str = Field(..., min_length=1, max_length=1000)
    # Honeypot: real guests never see or fill this field
    website: Optional[str] = Field(None, max_length=200)

    @field_validator("guest_name", "blessing_message")
    @classmethod
    def _not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


class WeddingWishPublic(_UtcTimes):
    """What any visitor can see in the guestbook: no phone, no headcount."""
    id: str
    guest_name: str
    blessing_message: str
    created_at: Optional[datetime] = None


class WeddingWishResponse(_UtcTimes):
    """Full response, only for the card's owner."""
    id: str
    guest_name: str
    phone: Optional[str] = None
    attendance: str
    guest_count: int
    blessing_message: str
    created_at: Optional[datetime] = None


class WeddingResponsesSummary(BaseModel):
    total_responses: int
    attending: int
    not_attending: int
    unsure: int
    expected_guests: int


class WeddingResponsesList(BaseModel):
    summary: WeddingResponsesSummary
    responses: List[WeddingWishResponse]


class WeddingCardResponse(_UtcTimes):
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
    wishes: Optional[List[WeddingWishPublic]] = []
    ornaments: Dict[str, str] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class WeddingAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new: bool
    user: WeddingUserResponse
    card: Optional[WeddingCardResponse] = None

class SlugCheckResult(BaseModel):
    slug: str
    available: bool
    # free: nobody has it; yours: already this card's link; taken: another
    # couple's; invalid: wrong characters or length; reserved: an app path
    reason: Literal["free", "yours", "taken", "invalid", "reserved"]


class YouTubeResolveResponse(BaseModel):
    valid: bool
    video_id: Optional[str] = None
    title: Optional[str] = None
    author_name: Optional[str] = None
    thumbnail_url: Optional[str] = None
    music_url: Optional[str] = None
    embed_url: Optional[str] = None
    error: Optional[str] = None

class CuratedSong(BaseModel):
    id: str
    title_km: str
    title_en: str
    category: str
    video_id: str
    youtube_url: str
    thumbnail_url: str
