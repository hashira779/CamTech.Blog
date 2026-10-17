import os
import json
import re
import uuid
import urllib.request
import urllib.parse
from datetime import timedelta, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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
    WeddingWishResponse,
    YouTubeResolveResponse,
    CuratedSong,
)
from auth import verify_password, get_password_hash, create_access_token, get_current_wedding_user

router = APIRouter(prefix="/api/v1/wedding", tags=["Wedding Microservice"])

def normalize_phone(phone: str) -> str:
    return re.sub(r"[^\d+]", "", phone.strip())

def create_default_card(db: Session, user: WeddingUser) -> WeddingCard:
    base_slug = f"wedding-{user.phone[-4:] if len(user.phone) >= 4 else 'card'}-{uuid.uuid4().hex[:4]}"
    
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
        slug=base_slug,
        theme="royal_khmer_gold",
        title="សិរីសួស្តី អាពាហ៍ពិពាហ៍",
        groom_name=user.username if user.username else "ជា វិសាល",
        groom_title="កូនប្រុសច្បង",
        groom_parents="លោក ជា សុខុម & លោកស្រី គង់ ផល្លា",
        groom_image_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        bride_name="សុខ សុវណ្ណារី",
        bride_title="កូនស្រីពៅ",
        bride_parents="លោក សុខ ចន្ថា & លោកស្រី ម៉ៅ សុភ័ក្ត្រ",
        bride_image_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
        khmer_date="ថ្ងៃអាទិត្យ ៥កើត ខែមិគសិរ ឆ្នាំរោង ឆស័ក ព.ស. ២៥៦៩",
        solar_date="2026-11-28",
        solar_time="17:00",
        morning_agenda=default_morning,
        evening_reception=default_evening,
        cover_image_url="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        gallery_images=default_gallery,
        music_url="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
        khqr_image_url="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://bakong.nbc.org.kh",
        khqr_account_name="CHEA VISAL & SOK SOVANNARY",
        khqr_account_number="000 123 456 (ABA Bank)",
        enable_rsvp=True,
        enable_wishes=True,
        is_published=True
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "wedding-microservice", "version": "1.0.0"}

@router.post("/auth", response_model=WeddingAuthResponse)
def unified_wedding_auth(req: WeddingAuthRequest, db: Session = Depends(get_db)):
    phone = normalize_phone(req.phone)
    if not phone or len(phone) < 8:
        raise HTTPException(status_code=400, detail="សូមបញ្ចូលលេខទូរស័ព្ទឱ្យបានត្រឹមត្រូវ")

    user = db.query(WeddingUser).filter(WeddingUser.phone == phone).first()
    is_new = False

    if user:
        if not verify_password(req.password, user.password_hash):
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
        db.commit()
        db.refresh(user)

    card = db.query(WeddingCard).filter(WeddingCard.user_id == user.id).first()
    if not card:
        card = create_default_card(db, user)

    token_expires = timedelta(days=30)
    access_token = create_access_token(
        data={"sub": user.id, "phone": user.phone, "role": "WEDDING_USER"},
        expires_delta=token_expires
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
        card=WeddingCardResponse(
            id=card.id,
            slug=card.slug,
            theme=card.theme,
            title=card.title,
            groom_name=card.groom_name,
            groom_title=card.groom_title,
            groom_parents=card.groom_parents,
            groom_image_url=card.groom_image_url,
            bride_name=card.bride_name,
            bride_title=card.bride_title,
            bride_parents=card.bride_parents,
            bride_image_url=card.bride_image_url,
            khmer_date=card.khmer_date,
            solar_date=card.solar_date,
            solar_time=card.solar_time,
            morning_agenda=card.morning_agenda,
            evening_reception=card.evening_reception,
            cover_image_url=card.cover_image_url,
            gallery_images=card.gallery_images,
            music_url=card.music_url,
            khqr_image_url=card.khqr_image_url,
            khqr_account_name=card.khqr_account_name,
            khqr_account_number=card.khqr_account_number,
            enable_rsvp=card.enable_rsvp,
            enable_wishes=card.enable_wishes,
            is_published=card.is_published,
            wishes=[],
            created_at=card.created_at
        )
    )

@router.get("/my-card", response_model=WeddingCardResponse)
def get_my_card(
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    card = db.query(WeddingCard).filter(WeddingCard.user_id == current_user.id).first()
    if not card:
        card = create_default_card(db, current_user)

    wishes_res = [
        WeddingWishResponse(
            id=w.id,
            guest_name=w.guest_name,
            attendance=w.attendance,
            guest_count=w.guest_count,
            blessing_message=w.blessing_message,
            created_at=w.created_at
        ) for w in card.wishes
    ]
    card_dict = {c.name: getattr(card, c.name) for c in card.__table__.columns}
    card_dict["wishes"] = wishes_res
    return WeddingCardResponse(**card_dict)

@router.put("/my-card", response_model=WeddingCardResponse)
def update_my_card(
    update_data: WeddingCardUpdate,
    current_user: WeddingUser = Depends(get_current_wedding_user),
    db: Session = Depends(get_db)
):
    card = db.query(WeddingCard).filter(WeddingCard.user_id == current_user.id).first()
    if not card:
        card = create_default_card(db, current_user)

    update_dict = update_data.model_dump(exclude_unset=True)
    if "slug" in update_dict and update_dict["slug"]:
        clean_slug = re.sub(r"[^a-zA-Z0-9-_]", "", update_dict["slug"].strip().lower())
        existing = db.query(WeddingCard).filter(WeddingCard.slug == clean_slug, WeddingCard.id != card.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="តំណភ្ជាប់ (Slug) នេះមានអ្នកប្រើរួចហើយ")
        update_dict["slug"] = clean_slug

    for field, value in update_dict.items():
        setattr(card, field, value)

    card.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(card)

    wishes_res = [
        WeddingWishResponse(
            id=w.id,
            guest_name=w.guest_name,
            attendance=w.attendance,
            guest_count=w.guest_count,
            blessing_message=w.blessing_message,
            created_at=w.created_at
        ) for w in card.wishes
    ]
    card_dict = {c.name: getattr(card, c.name) for c in card.__table__.columns}
    card_dict["wishes"] = wishes_res
    return WeddingCardResponse(**card_dict)

@router.get("/card/{slug}", response_model=WeddingCardResponse)
def get_public_card(slug: str, db: Session = Depends(get_db)):
    card = db.query(WeddingCard).filter(WeddingCard.slug == slug.lower()).first()
    if not card or not card.is_published:
        raise HTTPException(status_code=404, detail="Wedding card not found")

    wishes_res = [
        WeddingWishResponse(
            id=w.id,
            guest_name=w.guest_name,
            attendance=w.attendance,
            guest_count=w.guest_count,
            blessing_message=w.blessing_message,
            created_at=w.created_at
        ) for w in card.wishes
    ]
    card_dict = {c.name: getattr(card, c.name) for c in card.__table__.columns}
    card_dict["wishes"] = wishes_res
    return WeddingCardResponse(**card_dict)

@router.post("/card/{slug}/wish", response_model=WeddingWishResponse)
def add_wish(
    slug: str,
    wish_in: WeddingWishCreate,
    db: Session = Depends(get_db)
):
    card = db.query(WeddingCard).filter(WeddingCard.slug == slug.lower()).first()
    if not card or not card.is_published:
        raise HTTPException(status_code=404, detail="Wedding card not found")

    if not card.enable_wishes:
        raise HTTPException(status_code=400, detail="Wishes disabled")

    wish = WeddingWish(
        card_id=card.id,
        guest_name=wish_in.guest_name.strip(),
        phone=wish_in.phone.strip() if wish_in.phone else None,
        attendance=wish_in.attendance or "attending",
        guest_count=max(1, wish_in.guest_count or 1),
        blessing_message=wish_in.blessing_message.strip()
    )
    db.add(wish)
    db.commit()
    db.refresh(wish)

    return WeddingWishResponse(
        id=wish.id,
        guest_name=wish.guest_name,
        attendance=wish.attendance,
        guest_count=wish.guest_count,
        blessing_message=wish.blessing_message,
        created_at=wish.created_at
    )

CURATED_WEDDING_SONGS = [
    {
        "id": "song-blessing-01",
        "title_km": "របាំជូនពរ (ភ្លេងការបុរាណខ្មែរ)",
        "title_en": "Robam Choun Por (Traditional Blessing Dance)",
        "category": "ជូនពរសិរីសួស្តី",
        "video_id": "Wj_P9cKzW2U",
        "youtube_url": "https://www.youtube.com/watch?v=Wj_P9cKzW2U",
        "thumbnail_url": "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80"
    },
    {
        "id": "song-procession-02",
        "title_km": "ពិធីហែកំណត់ / ហែជំនូនចូលរោងជ័យ",
        "title_en": "Hae Khnom (Traditional Groom Procession)",
        "category": "ពិធីហែជំនូន",
        "video_id": "8G-G4nC0GqY",
        "youtube_url": "https://www.youtube.com/watch?v=8G-G4nC0GqY",
        "thumbnail_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80"
    },
    {
        "id": "song-katsok-03",
        "title_km": "ពិធីកាត់សក់បង្កក់សិរីមង្គល",
        "title_en": "Kat Sok Bangkork Serey (Hair Cutting Ceremony)",
        "category": "ពិធីកាត់សក់",
        "video_id": "7o3Fv64Bq0E",
        "youtube_url": "https://www.youtube.com/watch?v=7o3Fv64Bq0E",
        "thumbnail_url": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80"
    },
    {
        "id": "song-phtum-04",
        "title_km": "ពិធីសំពះផ្ទឹម ចងដៃសិរីសួស្តី",
        "title_en": "Sompeah Phtum (Sacred Knot Tying Ceremony)",
        "category": "ពិធីសំពះផ្ទឹម",
        "video_id": "4jS9XwLz7g0",
        "youtube_url": "https://www.youtube.com/watch?v=4jS9XwLz7g0",
        "thumbnail_url": "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=400&q=80"
    },
    {
        "id": "song-pka-sla-05",
        "title_km": "ផ្កាស្លាបីទង (មរតកភ្លេងការបុរាណ)",
        "title_en": "Pka Sla Bei Torng (Heritage Wedding Melody)",
        "category": "បទបុរាណប្រពៃណី",
        "video_id": "m9Y1Z9w8Q2c",
        "youtube_url": "https://www.youtube.com/watch?v=m9Y1Z9w8Q2c",
        "thumbnail_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80"
    },
    {
        "id": "song-destiny-06",
        "title_km": "គូព្រេងនិស្ស័យ (ស្នេហ៍ស្មោះស័ក្តិសិទ្ធិ)",
        "title_en": "Destined Soulmates (Khmer Love Symphony)",
        "category": "មនោសញ្ចេតនា",
        "video_id": "2g811Eo7K8U",
        "youtube_url": "https://www.youtube.com/watch?v=2g811Eo7K8U",
        "thumbnail_url": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80"
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
def resolve_youtube_audio(url: str):
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

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        ext = ".jpg"
    filename = f"wedding_{uuid.uuid4().hex[:12]}{ext}"
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    content = await file.read()
    try:
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as f:
            f.write(content)
        return {
            "success": True,
            "url": f"/uploads/{filename}",
            "filename": filename,
            "size": len(content)
        }
    except Exception:
        import base64
        mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
        b64 = f"data:{mime};base64,{base64.b64encode(content).decode('utf-8')}"
        return {
            "success": True,
            "url": b64,
            "filename": filename,
            "size": len(content)
        }

@router.post("/upload-multiple")
async def upload_multiple_images(files: List[UploadFile] = File(...)):
    results = []
    upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
    try:
        os.makedirs(upload_dir, exist_ok=True)
    except Exception:
        pass

    for file in files:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            ext = ".jpg"
        filename = f"wedding_{uuid.uuid4().hex[:12]}{ext}"
        content = await file.read()
        try:
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as f:
                f.write(content)
            results.append({
                "url": f"/uploads/{filename}",
                "filename": filename,
                "size": len(content)
            })
        except Exception:
            import base64
            mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
            b64 = f"data:{mime};base64,{base64.b64encode(content).decode('utf-8')}"
            results.append({
                "url": b64,
                "filename": filename,
                "size": len(content)
            })
    return {"success": True, "files": results, "count": len(results)}

