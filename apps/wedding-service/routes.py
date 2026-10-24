import os
import json
import re
import uuid
import logging
import urllib.request
import urllib.parse
from datetime import timedelta, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status, UploadFile, File
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import WeddingUser, WeddingCard, WeddingWish
from schemas import (
    WeddingAuthRequest,
    WeddingAuthResponse,
    WeddingUserResponse,
    WeddingCardResponse,
    WeddingCardUpdate,
    WeddingWishCreate,
    WeddingWishPublic,
    WeddingWishResponse,
    WeddingResponsesList,
    WeddingResponsesSummary,
    YouTubeResolveResponse,
    CuratedSong,
    SlugCheckResult,
)
from auth import verify_password, get_password_hash, create_access_token, get_current_wedding_user
from security import (
    rate_limiter,
    client_ip,
    clean_slug,
    validate_slug,
    RESERVED_SLUGS,
    sniff_image_extension,
    MAX_UPLOAD_BYTES,
    MAX_FILES_PER_REQUEST,
)

logger = logging.getLogger("wedding")

router = APIRouter(prefix="/api/v1/wedding", tags=["Wedding Microservice"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
DEFAULT_THEME = "romduol_golden"
PUBLIC_WISHES_LIMIT = 200


def normalize_phone(phone: str) -> str:
    return re.sub(r"[^\d+]", "", phone.strip())


def _age(ts: Optional[datetime]) -> timedelta:
    if ts is None:
        return timedelta.max
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - ts


def serialize_card(card: WeddingCard, include_wishes: bool = True) -> WeddingCardResponse:
    """Single place that turns a row into the API shape. Guestbook entries are
    the public view (name + message); headcounts and phones stay owner-only."""
    data = {c.name: getattr(card, c.name) for c in card.__table__.columns}
    data["theme"] = data.get("theme") or DEFAULT_THEME
    data["wishes"] = []
    if include_wishes and card.enable_wishes:
        data["wishes"] = [
            WeddingWishPublic(
                id=w.id,
                guest_name=w.guest_name,
                blessing_message=w.blessing_message,
                created_at=w.created_at,
            )
            for w in card.wishes[:PUBLIC_WISHES_LIMIT]
            if (w.blessing_message or "").strip()
        ]
    return WeddingCardResponse(**data)


def create_default_card(db: Session, user: WeddingUser) -> WeddingCard:
    """A new couple starts from a filled-in sample so the editor and preview
    look complete, but as an unpublished draft: nothing is public, and no
    placeholder bank account is attached, until the owner publishes it."""
    tail = user.phone[-4:] if len(user.phone) >= 4 else "card"
    slug = f"wedding-{tail}-{uuid.uuid4().hex[:6]}"

    default_morning = json.dumps([
        {"time": "07:00 ព្រឹក", "title": "ពិធីហែកំណត់ / ហែជំនូន", "description": "ក្បួនហែជំនូនចូលគេហដ្ឋានមាតាបិតាខាងស្រី រៀបរាប់ផ្លែឈើ និងគ្រឿងបណ្ណាការ"},
        {"time": "08:30 ព្រឹក", "title": "ពិធីកាត់សក់បង្កក់សិរី", "description": "កាត់សក់សិរីសួស្តី ជូនពរជ័យដោយមេបា ចាស់ទុំ និងភ្ញៀវកិត្តិយស"},
        {"time": "09:30 ព្រឹក", "title": "ពិធីសំពះផ្ទឹម ចងដៃ និងបង្កក់សិរី", "description": "ពិធីសំពះផ្ទឹមប្រពៃណីបុរាណខ្មែរ ចងអំបោះក្រហម និងបាចផ្កាស្លាជ័យ"}
    ], ensure_ascii=False)

    default_evening = json.dumps({
        "venue": "មជ្ឈមណ្ឌលសន្និបាត និងពិព័រណ៍ ឌឹ ព្រេមៀ សេនធ័រ សែនសុខ",
        "hall": "អាគារ A (Building A)",
        "time": "05:00 ល្ងាច",
        "address": "ផ្លូវ 1003 សង្កាត់ភ្នំពេញថ្មី ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ",
        "map_url": "https://maps.google.com/?q=The+Premier+Center+Sen+Sok+Phnom+Penh"
    }, ensure_ascii=False)

    default_gallery = json.dumps([
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=80"
    ])

    card = WeddingCard(
        user_id=user.id,
        slug=slug,
        theme=DEFAULT_THEME,
        title="សិរីសួស្តី អាពាហ៍ពិពាហ៍",
        groom_name="ជា វិសាល",
        groom_title="កូនប្រុសច្បង",
        groom_parents="លោក ជា សុខុម & លោកស្រី គង់ ផល្លា",
        bride_name="សុខ សុវណ្ណារី",
        bride_title="កូនស្រីពៅ",
        bride_parents="លោក សុខ ចន្ថា & លោកស្រី ម៉ៅ សុភ័ក្ត្រ",
        khmer_date="ថ្ងៃអាទិត្យ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៩",
        solar_date="2026-11-28",
        solar_time="17:00",
        morning_agenda=default_morning,
        evening_reception=default_evening,
        cover_image_url="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        gallery_images=default_gallery,
        music_url=None,
        khqr_image_url=None,
        khqr_account_name=None,
        khqr_account_number=None,
        enable_rsvp=True,
        enable_wishes=True,
        is_published=False,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def get_or_create_card(db: Session, user: WeddingUser) -> WeddingCard:
    """One invitation per account. Opening the editor never creates a second
    row: the oldest card is the account's card."""
    card = (
        db.query(WeddingCard)
        .filter(WeddingCard.user_id == user.id)
        .order_by(WeddingCard.created_at.asc())
        .first()
    )
    return card or create_default_card(db, user)


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "wedding-microservice", "version": "1.1.0"}


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """/health only proves the process is up; this one proves it can reach its database."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("wedding readiness: database unreachable")
        raise HTTPException(status_code=503, detail="database unavailable")
    return {"status": "ready"}


@router.post("/auth", response_model=WeddingAuthResponse)
def unified_wedding_auth(req: WeddingAuthRequest, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    rate_limiter.check(f"auth:ip:{ip}", limit=20, window_seconds=600)

    phone = normalize_phone(req.phone)
    if not phone or len(phone) < 8 or len(phone) > 20:
        raise HTTPException(status_code=400, detail="សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ")

    # Per-account guard against password guessing from many addresses
    rate_limiter.check(f"auth:phone:{phone}", limit=10, window_seconds=900)

    user = db.query(WeddingUser).filter(WeddingUser.phone == phone).first()
    is_new = False

    if user:
        if not verify_password(req.password, user.password_hash):
            logger.info("wedding auth: wrong password for an existing account")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="លេខសម្ងាត់មិនត្រឹមត្រូវ (Incorrect password)"
            )
        if req.username and req.username.strip() and user.username != req.username.strip():
            user.username = req.username.strip()
            db.commit()
            db.refresh(user)
    else:
        is_new = True
        username = req.username.strip() if (req.username and req.username.strip()) else f"User {phone[-4:]}"
        user = WeddingUser(
            phone=phone,
            username=username,
            password_hash=get_password_hash(req.password)
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="គណនីនេះមានរួចហើយ សូមព្យាយាមម្តងទៀត (Account already exists, please retry)")
        db.refresh(user)

    card = get_or_create_card(db, user)

    access_token = create_access_token(
        data={"sub": user.id, "role": "WEDDING_USER"},
        expires_delta=timedelta(days=30)
    )

    return WeddingAuthResponse(
        access_token=access_token,
        token_type="bearer",
        is_new=is_new,
        user=WeddingUserResponse(
            id=user.id,
            phone=user.phone,
            username=user.username,
            created_at=user.created_at
        ),
        card=serialize_card(card),
    )


@router.get("/my-card", response_model=WeddingCardResponse)
def get_my_card(
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    return serialize_card(get_or_create_card(db, current_user))


@router.put("/my-card", response_model=WeddingCardResponse)
def update_my_card(
    update_data: WeddingCardUpdate,
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    card = get_or_create_card(db, current_user)

    update_dict = update_data.model_dump(exclude_unset=True)
    # Server-owned or non-nullable columns never accept null from the client
    for key in ("title", "groom_name", "groom_title", "groom_parents", "bride_name", "bride_title",
                "bride_parents", "khmer_date", "solar_date", "solar_time", "theme",
                "enable_rsvp", "enable_wishes", "is_published", "slug"):
        if key in update_dict and update_dict[key] is None:
            update_dict.pop(key)

    if "slug" in update_dict:
        new_slug = clean_slug(update_dict["slug"])
        if new_slug != card.slug:
            validate_slug(new_slug)
            taken = db.query(WeddingCard).filter(WeddingCard.slug == new_slug, WeddingCard.id != card.id).first()
            if taken:
                raise HTTPException(status_code=409, detail="តំណភ្ជាប់ (Slug) នេះមានអ្នកប្រើរួចហើយ (This link is already taken)")
        update_dict["slug"] = new_slug

    for field, value in update_dict.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(card, field, value)

    card.updated_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="តំណភ្ជាប់ (Slug) នេះមានអ្នកប្រើរួចហើយ (This link is already taken)")
    db.refresh(card)
    return serialize_card(card)


@router.get("/my-card/slug-check", response_model=List[SlugCheckResult])
def check_slugs(
    slug: List[str] = Query(..., max_length=80),
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    """Whether each proposed link could be this couple's, so the editor can
    say so while they type instead of failing on Save. Signed-in only, and a
    handful per call, so it is no cheaper a way to list other couples' links
    than opening them."""
    if len(slug) > 6:
        raise HTTPException(status_code=400, detail="Too many links in one check")
    card = get_or_create_card(db, current_user)
    results = []
    for raw in slug:
        s = clean_slug(raw)
        if s == card.slug:
            results.append(SlugCheckResult(slug=s, available=True, reason="yours"))
            continue
        try:
            validate_slug(s)
        except HTTPException:
            reason = "reserved" if s in RESERVED_SLUGS else "invalid"
            results.append(SlugCheckResult(slug=s, available=False, reason=reason))
            continue
        taken = db.query(WeddingCard.id).filter(WeddingCard.slug == s).first()
        results.append(SlugCheckResult(slug=s, available=not taken, reason="taken" if taken else "free"))
    return results


@router.get("/my-card/responses", response_model=WeddingResponsesList)
def get_my_responses(
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    card = get_or_create_card(db, current_user)
    rows = (
        db.query(WeddingWish)
        .filter(WeddingWish.card_id == card.id)
        .order_by(WeddingWish.created_at.desc())
        .all()
    )
    responses = [
        WeddingWishResponse(
            id=w.id,
            guest_name=w.guest_name,
            phone=w.phone,
            attendance=w.attendance or "attending",
            guest_count=w.guest_count if w.guest_count is not None else 1,
            blessing_message=w.blessing_message,
            created_at=w.created_at,
        )
        for w in rows
    ]
    attending = [r for r in responses if r.attendance == "attending"]
    summary = WeddingResponsesSummary(
        total_responses=len(responses),
        attending=len(attending),
        not_attending=sum(1 for r in responses if r.attendance == "not_attending"),
        unsure=sum(1 for r in responses if r.attendance == "unsure"),
        expected_guests=sum(r.guest_count for r in attending),
    )
    return WeddingResponsesList(summary=summary, responses=responses)


@router.delete("/my-card/responses/{wish_id}", status_code=204)
def delete_my_response(
    wish_id: str,
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    card = get_or_create_card(db, current_user)
    wish = db.query(WeddingWish).filter(WeddingWish.id == wish_id, WeddingWish.card_id == card.id).first()
    if not wish:
        raise HTTPException(status_code=404, detail="Response not found")
    db.delete(wish)
    db.commit()
    return None


@router.get("/card/{slug}", response_model=WeddingCardResponse)
def get_public_card(slug: str, db: Session = Depends(get_db)):
    card = db.query(WeddingCard).filter(WeddingCard.slug == clean_slug(slug)).first()
    # Drafts are indistinguishable from missing cards to the public
    if not card or not card.is_published:
        raise HTTPException(status_code=404, detail="Wedding card not found")
    return serialize_card(card)


@router.post("/card/{slug}/wish", response_model=WeddingWishPublic, status_code=201)
def add_wish(
    slug: str,
    wish_in: WeddingWishCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    card = db.query(WeddingCard).filter(WeddingCard.slug == clean_slug(slug)).first()
    if not card or not card.is_published:
        raise HTTPException(status_code=404, detail="Wedding card not found")
    if not card.enable_wishes and not card.enable_rsvp:
        raise HTTPException(status_code=403, detail="ការឆ្លើយតបត្រូវបានបិទ (Responses are closed for this invitation)")

    ip = client_ip(request)
    rate_limiter.check(f"wish:{card.id}:{ip}", limit=5, window_seconds=600)
    rate_limiter.check(f"wish:{card.id}", limit=300, window_seconds=3600)

    # Bots fill every field; pretend success without storing anything
    if wish_in.website:
        logger.info("wedding wish: honeypot triggered")
        return WeddingWishPublic(id=str(uuid.uuid4()), guest_name=wish_in.guest_name,
                                 blessing_message=wish_in.blessing_message,
                                 created_at=datetime.now(timezone.utc))

    # A double tap or a resubmitted form returns the existing response instead of a copy
    duplicate = (
        db.query(WeddingWish)
        .filter(
            WeddingWish.card_id == card.id,
            func.lower(WeddingWish.guest_name) == wish_in.guest_name.lower(),
            WeddingWish.blessing_message == wish_in.blessing_message,
        )
        .order_by(WeddingWish.created_at.desc())
        .first()
    )
    if duplicate and _age(duplicate.created_at) < timedelta(minutes=30):
        return WeddingWishPublic(id=duplicate.id, guest_name=duplicate.guest_name,
                                 blessing_message=duplicate.blessing_message,
                                 created_at=duplicate.created_at)

    attendance = wish_in.attendance if card.enable_rsvp else "unsure"
    guest_count = 0 if attendance == "not_attending" else max(1, wish_in.guest_count)
    wish = WeddingWish(
        card_id=card.id,
        guest_name=wish_in.guest_name,
        phone=(wish_in.phone or "").strip() or None,
        attendance=attendance,
        guest_count=guest_count,
        blessing_message=wish_in.blessing_message,
    )
    db.add(wish)
    db.commit()
    db.refresh(wish)

    return WeddingWishPublic(
        id=wish.id,
        guest_name=wish.guest_name,
        blessing_message=wish.blessing_message,
        created_at=wish.created_at
    )

# Every entry checked to exist and to play in an embedded player: a song
# that YouTube won't embed leaves the invitation silent
CURATED_WEDDING_SONGS = [
    {
        "id": "song-homrong-01",
        "title_km": "ហោមរោង (បើកពិធីមង្គលការ)",
        "title_en": "Hom Rong (Opening of the Ceremony)",
        "category": "ចាប់ផ្តើមពិធី",
        "video_id": "iLHnS6Zjdh8",
        "youtube_url": "https://www.youtube.com/watch?v=iLHnS6Zjdh8",
        "thumbnail_url": "https://i.ytimg.com/vi/iLHnS6Zjdh8/hqdefault.jpg"
    },
    {
        "id": "song-plengka-02",
        "title_km": "ភ្លេងការបុរាណខ្មែរ",
        "title_en": "Pleng Ka — Khmer Traditional Wedding Music",
        "category": "បទបុរាណប្រពៃណី",
        "video_id": "wfJoz4The1w",
        "youtube_url": "https://www.youtube.com/watch?v=wfJoz4The1w",
        "thumbnail_url": "https://i.ytimg.com/vi/wfJoz4The1w/hqdefault.jpg"
    },
    {
        "id": "song-smoung-03",
        "title_km": "ភ្លេងការ ស្មោង (ឈុតទី ១)",
        "title_en": "Phleng Ka Collection Vol. 1",
        "category": "បទបុរាណប្រពៃណី",
        "video_id": "aJqkEm6XHxQ",
        "youtube_url": "https://www.youtube.com/watch?v=aJqkEm6XHxQ",
        "thumbnail_url": "https://i.ytimg.com/vi/aJqkEm6XHxQ/hqdefault.jpg"
    },
    {
        "id": "song-kamdarong-04",
        "title_km": "ភ្លេងការកំដររោង",
        "title_en": "Pleng Ka for the Wedding Hall",
        "category": "កំដររោងការ",
        "video_id": "JB7p_x0uAI8",
        "youtube_url": "https://www.youtube.com/watch?v=JB7p_x0uAI8",
        "thumbnail_url": "https://i.ytimg.com/vi/JB7p_x0uAI8/hqdefault.jpg"
    },
    {
        "id": "song-norkorreach-05",
        "title_km": "ភ្លេងការ នគររាជ",
        "title_en": "Khmer Wedding Song — Nokor Reach",
        "category": "ជូនពរសិរីសួស្តី",
        "video_id": "v8lnHkZL1jk",
        "youtube_url": "https://www.youtube.com/watch?v=v8lnHkZL1jk",
        "thumbnail_url": "https://i.ytimg.com/vi/v8lnHkZL1jk/hqdefault.jpg"
    },
    {
        "id": "song-classic-06",
        "title_km": "ចម្រៀងការជំនាន់មុន (សាវុធ & សេរីយ៉ុង)",
        "title_en": "Classic Wedding Songs (Savuth & Sereyong)",
        "category": "មនោសញ្ចេតនា",
        "video_id": "wosq2c0ZB9E",
        "youtube_url": "https://www.youtube.com/watch?v=wosq2c0ZB9E",
        "thumbnail_url": "https://i.ytimg.com/vi/wosq2c0ZB9E/hqdefault.jpg"
    }
]

def extract_youtube_video_id(url: str) -> Optional[str]:
    url = url.strip()
    if re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
        r"(?:[?&]v=)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None

@router.get("/youtube-resolve", response_model=YouTubeResolveResponse)
def resolve_youtube_audio(url: str, request: Request):
    # Unauthenticated and each call holds a worker for up to 4 s on YouTube's oEmbed
    rate_limiter.check(f"yt:{client_ip(request)}", limit=30, window_seconds=600)
    if not url or not url.strip():
        return YouTubeResolveResponse(valid=False, error="សូមបញ្ចូល Link YouTube")

    vid = extract_youtube_video_id(url)
    if not vid:
        return YouTubeResolveResponse(valid=False, error="Link YouTube មិនត្រឹមត្រូវ (Invalid YouTube URL)")

    embed_url = f"https://www.youtube.com/embed/{vid}?enablejsapi=1&autoplay=1&loop=1"
    thumbnail_url = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    canonical_url = f"https://www.youtube.com/watch?v={vid}"

    title = f"ភ្លេងការខ្មែរ (YouTube ID: {vid})"
    author_name = "YouTube Music"

    try:
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(canonical_url)}&format=json"
        req = urllib.request.Request(
            oembed_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("title"):
                    title = data.get("title")
                if data.get("author_name"):
                    author_name = data.get("author_name")
                if data.get("thumbnail_url"):
                    thumbnail_url = data.get("thumbnail_url")
    except Exception:
        # Fallback to defaults
        pass

    return YouTubeResolveResponse(
        valid=True,
        video_id=vid,
        title=title,
        author_name=author_name,
        thumbnail_url=thumbnail_url,
        music_url=canonical_url,
        embed_url=embed_url
    )

@router.get("/curated-songs", response_model=List[CuratedSong])
def get_curated_songs():
    return [CuratedSong(**s) for s in CURATED_WEDDING_SONGS]


async def _store_upload(file: UploadFile) -> dict:
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="រូបភាពធំពេក (Image is larger than 8 MB)")
    ext = sniff_image_extension(content[:16])
    if not ext:
        raise HTTPException(status_code=415, detail="សូមផ្ទុកតែរូបភាព JPG, PNG, WebP ឬ GIF (Only JPG, PNG, WebP or GIF images)")
    filename = f"wedding_{uuid.uuid4().hex}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}", "filename": filename, "size": len(content)}


@router.post("/upload")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: WeddingUser = Depends(get_current_wedding_user),
):
    rate_limiter.check(f"upload:{current_user.id}", limit=120, window_seconds=3600)
    stored = await _store_upload(file)
    return {"success": True, **stored}


@router.post("/upload-multiple")
async def upload_multiple_images(
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: WeddingUser = Depends(get_current_wedding_user),
):
    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(status_code=400, detail=f"Upload at most {MAX_FILES_PER_REQUEST} images at once")
    rate_limiter.check(f"upload:{current_user.id}", limit=120, window_seconds=3600)
    results = [await _store_upload(f) for f in files]
    return {"success": True, "files": results, "count": len(results)}
