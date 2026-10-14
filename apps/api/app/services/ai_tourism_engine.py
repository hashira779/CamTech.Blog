"""
AI Tourism Engine — Automatic discovery of tourist places across all 25 provinces of Cambodia.
Uses Google Gemini AI to research, generate, and insert real tourist places into the database.
Designed to run once per week via APScheduler.
"""
import json
import uuid
import re
import os
import logging
import asyncio
import httpx
import urllib.parse
from datetime import datetime, timezone
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None
from app.common.config import settings
from app.common.database import SessionLocal
from app.models.location import Country, Destination
from app.models.place import Place
from app.models.audit import SiteSetting
from app.services.google_drive_service import storage_service
from app.services.s3_service import s3_service
from app.services.image_search_service import image_search_service
from app.services import ai_gateway

logger = logging.getLogger(__name__)

async def _call_you_com(prompt: str, api_key: str) -> str:
    if not api_key or not str(api_key).strip():
        return None
    api_key = str(api_key).strip()

    # 1. Try You.com Research API (fast 'lite' effort for rapid response)
    try:
        url = "https://api.you.com/v1/research"
        headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "input": f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON. No conversational commentary or markdown introduction.",
            "research_effort": "lite"
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                content = data.get("output", {}).get("content", "")
                if isinstance(content, (dict, list)):
                    return json.dumps(content)
                if content:
                    # Clean out citation marks like [[1]] or [[2]]
                    cleaned = re.sub(r'\[\[\d+\]\]', '', str(content))
                    return cleaned
    except Exception as e:
        logger.warning(f"You.com Research API failed: {e}")

    # 2. Try You.com Answer API as fallback (supported on standard developer keys)
    try:
        url = "https://api.you.com/v1/answer"
        headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "query": f"{prompt}\n\nReturn strictly valid JSON only."
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                answer = data.get("answer", "")
                if answer:
                    cleaned = re.sub(r'\[\[\d+\]\]', '', str(answer))
                    return cleaned
    except Exception as e:
        logger.warning(f"You.com Answer API fallback failed: {e}")

    return None

async def _you_web_search(query: str, api_key: str) -> dict:
    """Uses You.com Web Search API (https://ydc-index.io/v1/search) to get real search highlights and image thumbnails."""
    if not api_key or not str(api_key).strip():
        return None
    api_key = str(api_key).strip()
    headers = {"X-API-Key": api_key}
    params = {"query": query}

    # Primary official URL for You.com Search index is https://ydc-index.io/v1/search
    for url in ["https://ydc-index.io/v1/search", "https://api.you.com/v1/search"]:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    return res.json()
        except Exception as e:
            logger.warning(f"You.com Web Search at {url} failed: {e}")
            continue
    return None

BAD_IMAGE_KEYWORDS = [
    "flag", "symbol", "coat_of_arms", "icon", "map", "logo", "stub", 
    "diagram", "locator", ".svg", "emblem", "seal_of", "district_in",
    "blank", "placeholder", "commons-logo", "wikivoyage", "wikidata",
    # Reject business / ceremony / signing / politician photos for landmarks
    "signing", "mou", "agreement", "deliveree", "conference", "summit", 
    "handshake", "accord", "press_release", "official_portrait", "minister", 
    "diplomat", "meeting", "bilateral", "contract", "stadium", "football",
    # Reject third-party travel aggregator logos & badges
    "tripadvisor", "trip.com", "booking.com", "agoda", "expedia", 
    "banner", "badge", "watermark", "advertisement"
]

GENERIC_WIKI_PAGES = {
    'cambodia', 'kingdom of cambodia', 'tourism in cambodia', 'geography of cambodia', 
    'history of cambodia', 'culture of cambodia', 'politics of cambodia', 'economy of cambodia',
    'provinces of cambodia', 'transport in cambodia', 'demographics of cambodia'
}

def _score_wiki_page(title: str, place_name: str, clean_name: str) -> float:
    t_low = title.lower().strip()
    p_low = place_name.lower().strip()
    c_low = clean_name.lower().strip()
    if t_low in GENERIC_WIKI_PAGES or t_low.startswith('list of'):
        return -1.0
    if t_low == p_low or t_low == c_low:
        return 100.0
    if c_low in t_low or t_low in c_low:
        return 85.0
    words = [w for w in re.split(r'\W+', c_low) if len(w) > 2 and w not in ('the', 'and', 'cambodia', 'province', 'park', 'ancient', 'city', 'sanctuary', 'resort')]
    if not words:
        return 50.0 if any(w in t_low for w in re.split(r'\W+', c_low) if len(w) > 2) else 0.0
    matches = sum(1 for w in words if w in t_low)
    return (matches / len(words)) * 75.0 if matches > 0 else 0.0

async def fetch_wiki_images(place_name: str, province_name: str, local_name: str = None, max_images: int = 15) -> list[str]:
    """Uses Wikipedia API with pageimages and embedded article media to find real high-resolution photos."""
    ua = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"
    headers = {"User-Agent": ua}
    
    clean_name = re.sub(r'\(.*?\)', '', place_name).strip()
    queries = [
        clean_name,
        f"{clean_name} Cambodia",
        f"{clean_name} {province_name}",
    ]
    if local_name and local_name.strip():
        queries.append(local_name.strip())

    found_images = []
    seen = set()

    async with httpx.AsyncClient(timeout=7.0, headers=headers) as client:
        for q in dict.fromkeys(queries):
            url = f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrlimit=5&prop=pageimages|extracts&exintro=1&explaintext=1&piprop=original&format=json"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = list(res.json().get("query", {}).get("pages", {}).values())
                    # Sort candidates by title relevance to the place
                    scored_pages = []
                    for p in pages:
                        score = _score_wiki_page(p.get("title", ""), place_name, clean_name)
                        if score > 20:
                            scored_pages.append((score, p))
                    scored_pages.sort(key=lambda x: x[0], reverse=True)

                    for score, p in scored_pages:
                        title = p.get("title", "")
                        # 1. Primary Pageimage
                        if "original" in p:
                            src = p["original"]["source"]
                            src_clean = src.split("?")[0]
                            if not any(bad in src_clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                                if src_clean not in seen:
                                    seen.add(src_clean)
                                    found_images.append(src)

                        # 2. Extract photos embedded within the relevant Wikipedia article
                        if title and len(found_images) < max_images:
                            art_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&generator=images&gimlimit=25&prop=imageinfo&iiprop=url|mime&format=json"
                            try:
                                art_res = await client.get(art_url)
                                if art_res.status_code == 200:
                                    art_pages = art_res.json().get("query", {}).get("pages", {})
                                    for img_p in art_pages.values():
                                        for info in img_p.get("imageinfo", []):
                                            u = info.get("url", "")
                                            u_clean = u.split("?")[0]
                                            mime = info.get("mime", "")
                                            if "image/" in mime and not any(bad in u_clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                                                if any(u_clean.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                                                    if u_clean not in seen:
                                                        seen.add(u_clean)
                                                        found_images.append(u)
                            except Exception:
                                pass
            except Exception as e:
                logger.debug(f"Wiki search error for {q}: {e}")

            if len(found_images) >= max_images:
                break

    return found_images

async def fetch_commons_images(place_name: str, province_name: str, max_images: int = 15) -> list[str]:
    """Queries Wikimedia Commons open media library for verified cultural and travel photos (1600px Full-HD)."""
    ua = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"
    headers = {"User-Agent": ua}
    clean_name = re.sub(r'\(.*?\)', '', place_name).strip()
    
    queries = [
        f"{clean_name} {province_name}",
        f"{clean_name} Cambodia",
        clean_name
    ]
    
    found = []
    seen = set()

    async with httpx.AsyncClient(timeout=7.0, headers=headers) as client:
        for q in queries:
            url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1600&format=json&gsrlimit={max_images}"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    for p in pages.values():
                        for info in p.get("imageinfo", []):
                            u = info.get("thumburl") or info.get("url", "")
                            u_clean = u.split("?")[0]
                            mime = info.get("mime", "")
                            if "image/" in mime and not any(bad in u_clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                                if any(u_clean.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                                    if u_clean not in seen:
                                        seen.add(u_clean)
                                        found.append(u)
            except Exception:
                pass
            if len(found) >= max_images:
                break

    return found

async def fetch_you_images(place_name: str, province_name: str, you_api_key: str, max_images: int = 12) -> list[str]:
    """Queries You.com Web Search index to extract real travel thumbnails and images."""
    if not you_api_key:
        return []
    found = []
    seen = set()
    try:
        search_data = await asyncio.wait_for(_you_web_search(f"{place_name} {province_name} Cambodia travel tourism", you_api_key), timeout=4.0)
        if search_data and "results" in search_data:
            # 1. Image results if present
            for img_item in search_data["results"].get("images", []):
                u = img_item.get("url") or img_item.get("thumbnail_url")
                if u and u.startswith("http") and u not in seen:
                    seen.add(u)
                    found.append(u)
            # 2. Web search thumbnails (TripAdvisor, Booking, blogs)
            for r in search_data["results"].get("web", []):
                thumb = r.get("thumbnail_url")
                if thumb and thumb.startswith("http") and not any(bad in thumb.lower() for bad in BAD_IMAGE_KEYWORDS):
                    if not any(bad in thumb.lower() for bad in ["logo", "icon", "favicon", "trip.com", "tripadvisor", "booking", "agoda"]):
                        if thumb not in seen:
                            seen.add(thumb)
                            found.append(thumb)
    except Exception:
        pass
    return found[:max_images]

# Minimal single fallback photo per category — only used when ALL real image sources fail
CATEGORY_FALLBACK_IMAGE = {
    "WATERFALL":     "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/800px-Bou_Sra_Waterfall.jpg",
    "TEMPLE":        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "ACCOMMODATION": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Raffles_Hotel_Le_Royal.jpg/800px-Raffles_Hotel_Le_Royal.jpg",
    "RESTAURANT":    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Phnom_Penh_-_Street_Food.jpg/800px-Phnom_Penh_-_Street_Food.jpg",
    "CAFE":          "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Phnom_Penh_-_Street_Food.jpg/800px-Phnom_Penh_-_Street_Food.jpg",
    "MARKET":        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Phsar_Thmei.jpg/800px-Phsar_Thmei.jpg",
    "MUSEUM":        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/National_Museum_Phnom_Penh.jpg/800px-National_Museum_Phnom_Penh.jpg",
    "NATIONAL_PARK": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bokor_National_Park.jpg/800px-Bokor_National_Park.jpg",
    "BEACH":         "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Otres_Beach.jpg/800px-Otres_Beach.jpg",
    "LAKE":          "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Tonle_Sap_Lake.jpg/800px-Tonle_Sap_Lake.jpg",
    "MOUNTAIN":      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bokor_National_Park.jpg/800px-Bokor_National_Park.jpg",
    "VILLAGE":       "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/800px-Bou_Sra_Waterfall.jpg",
    "ACTIVITY":      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "ATTRACTION":    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Angkor_Wat.jpg/800px-Angkor_Wat.jpg",
    "RESORT":        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Raffles_Hotel_Le_Royal.jpg/800px-Raffles_Hotel_Le_Royal.jpg",
    "HIDDEN_GEM":    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Bou_Sra_Waterfall.jpg/800px-Bou_Sra_Waterfall.jpg",
}

def get_category_fallback_photo(place_type: str, name: str) -> str:
    """Return a single fallback photo for a place type. Only used when real image sources fail."""
    ptype = (place_type or "ATTRACTION").upper()
    return CATEGORY_FALLBACK_IMAGE.get(ptype, CATEGORY_FALLBACK_IMAGE["ATTRACTION"])

def get_category_fallback_gallery(place_type: str, name: str, count: int = 12) -> list[str]:
    """Return a rich, diverse fallback gallery. Real images should come from Wikipedia/Commons/web search."""
    return image_search_service.get_diverse_place_gallery(place_type, name, count)


# All 25 provinces/cities of Cambodia
CAMBODIA_PROVINCES = [
    {"name": "Phnom Penh", "name_km": "ភ្នំពេញ", "slug": "phnom-penh", "hero_image_url": "/images/destinations/phnom-penh.jpg"},
    {"name": "Siem Reap", "name_km": "សៀមរាប", "slug": "siem-reap", "hero_image_url": "/images/destinations/siem-reap.jpg"},
    {"name": "Sihanoukville", "name_km": "ក្រុងព្រះសីហនុ", "slug": "sihanoukville", "hero_image_url": "/images/destinations/sihanoukville.jpg"},
    {"name": "Battambang", "name_km": "បាត់ដំបង", "slug": "battambang", "hero_image_url": "/images/destinations/battambang.jpg"},
    {"name": "Kampot", "name_km": "កំពត", "slug": "kampot", "hero_image_url": "/images/destinations/kampot.jpg"},
    {"name": "Kep", "name_km": "កែប", "slug": "kep", "hero_image_url": "/images/destinations/kep.jpg"},
    {"name": "Kratie", "name_km": "ក្រចេះ", "slug": "kratie", "hero_image_url": "/images/destinations/kratie.jpg"},
    {"name": "Mondulkiri", "name_km": "មណ្ឌលគិរី", "slug": "mondulkiri", "hero_image_url": "/images/destinations/mondulkiri.jpg"},
    {"name": "Ratanakiri", "name_km": "រតនគិរី", "slug": "ratanakiri", "hero_image_url": "/images/destinations/ratanakiri.jpg"},
    {"name": "Stung Treng", "name_km": "ស្ទឹងត្រែង", "slug": "stung-treng", "hero_image_url": "/images/destinations/stung-treng.jpg"},
    {"name": "Pursat", "name_km": "ពោធិ៍សាត់", "slug": "pursat", "hero_image_url": "/images/destinations/pursat.jpg"},
    {"name": "Kampong Cham", "name_km": "កំពង់ចាម", "slug": "kampong-cham", "hero_image_url": "/images/destinations/kampong-cham.jpg"},
    {"name": "Kampong Chhnang", "name_km": "កំពង់ឆ្នាំង", "slug": "kampong-chhnang", "hero_image_url": "/images/destinations/kampong-chhnang.jpg"},
    {"name": "Kampong Speu", "name_km": "កំពង់ស្ពឺ", "slug": "kampong-speu", "hero_image_url": "/images/destinations/kampong-speu.jpg"},
    {"name": "Kampong Thom", "name_km": "កំពង់ធំ", "slug": "kampong-thom", "hero_image_url": "/images/destinations/kampong-thom.jpg"},
    {"name": "Kandal", "name_km": "កណ្តាល", "slug": "kandal", "hero_image_url": "/images/destinations/kandal.jpg"},
    {"name": "Koh Kong", "name_km": "កោះកុង", "slug": "koh-kong", "hero_image_url": "/images/destinations/koh-kong.jpg"},
    {"name": "Preah Vihear", "name_km": "ព្រះវិហារ", "slug": "preah-vihear", "hero_image_url": "/images/destinations/preah-vihear.jpg"},
    {"name": "Prey Veng", "name_km": "ព្រៃវែង", "slug": "prey-veng", "hero_image_url": "/images/destinations/prey-veng.jpg"},
    {"name": "Svay Rieng", "name_km": "ស្វាយរៀង", "slug": "svay-rieng", "hero_image_url": "/images/destinations/svay-rieng.jpg"},
    {"name": "Takeo", "name_km": "តាកែវ", "slug": "takeo", "hero_image_url": "/images/destinations/takeo.jpg"},
    {"name": "Banteay Meanchey", "name_km": "បន្ទាយមានជ័យ", "slug": "banteay-meanchey", "hero_image_url": "/images/destinations/banteay-meanchey.jpg"},
    {"name": "Oddar Meanchey", "name_km": "ឧត្ដរមានជ័យ", "slug": "oddar-meanchey", "hero_image_url": "/images/destinations/oddar-meanchey.jpg"},
    {"name": "Pailin", "name_km": "ប៉ៃលិន", "slug": "pailin", "hero_image_url": "/images/destinations/pailin.jpg"},
    {"name": "Tboung Khmum", "name_km": "ត្បូងឃ្មុំ", "slug": "tboung-khmum", "hero_image_url": "/images/destinations/tboung-khmum.jpg"},
]


class AITourismEngine:
    """
    Super engine that uses the pluggable AI gateway to discover and populate tourist
    places for all 25 provinces of Cambodia automatically.
    """

    def _get_curated_fallback_places(self, province_slug: str, dest_name: str, dest_id: str, default_hero: str, existing_names_set: set) -> list[dict]:
        """Load verified heritage candidate places for this province."""
        json_path = os.path.join(os.path.dirname(__file__), "..", "data_province_candidates.json")
        candidates = []
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    all_candidates = json.load(f)
                    candidates = all_candidates.get(province_slug, [])
            except Exception as e:
                logger.warning(f"Failed to load candidate places JSON: {e}")

        processed = []
        for p in candidates:
            name = p.get("name", "").strip()
            if not name:
                continue
            p_type = p.get("place_type", "ATTRACTION")
            is_dup = name.lower() in existing_names_set
            hero_photo = get_category_fallback_photo(p_type, name)
            gallery_photos = get_category_fallback_gallery(p_type, name, 12)
            processed.append({
                "name": name,
                "local_name": p.get("local_name"),
                "place_type": p_type,
                "description": p.get("description", f"Notable tourist landmark in {dest_name} Province, Cambodia."),
                "description_km": p.get("description_km"),
                "address": p.get("address", f"{dest_name} Province, Cambodia"),
                "latitude": p.get("latitude"),
                "longitude": p.get("longitude"),
                "opening_hours": p.get("opening_hours", "08:00 AM - 05:00 PM daily"),
                "price_level": p.get("price_level", "$$"),
                "phone": p.get("phone"),
                "website": p.get("website"),
                "tags": p.get("tags", ["Heritage", "Culture"]),
                "rating": p.get("rating", 4.7),
                "is_duplicate": is_dup,
                "destination_id": dest_id,
                "hero_image_url": hero_photo,
                "gallery_json": json.dumps(gallery_photos)
            })
        return processed

    async def _resolve_place_images(
        self,
        name: str,
        dest_name: str,
        place_type: str,
        local_name: str = None,
        you_api_key: str = None,
        target_count: int = 12
    ) -> tuple[str, list[str]]:
        """
        Multi-source intelligent image discovery:
        Finds at least 10-12+ authentic images for a place across:
        1. Wikipedia article pageimages & section photos
        2. Wikimedia Commons high-resolution photography
        3. You.com web search thumbnails
        4. Curated category travel photo library padding (ensuring 10+ photos)
        """
        all_images = []
        seen = set()

        def _add(u: str):
            if not u or not u.startswith("http"):
                return
            clean = u.split("?")[0].strip()
            if clean not in seen and not any(bad in clean.lower() for bad in BAD_IMAGE_KEYWORDS):
                seen.add(clean)
                all_images.append(u)

        # 1. Concurrently query Wikipedia & Wikimedia Commons
        try:
            tasks = [
                fetch_wiki_images(name, dest_name, local_name, max_images=10),
                fetch_commons_images(name, dest_name, max_images=12)
            ]
            if you_api_key:
                tasks.append(fetch_you_images(name, dest_name, you_api_key, max_images=8))

            results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=9.0)
            for res in results:
                if isinstance(res, list):
                    for img in res:
                        _add(img)
        except Exception as e:
            logger.debug(f"Image discovery notice for {name}: {e}")

        # Ensure high-resolution, diverse photography padding
        if len(all_images) < target_count:
            diverse_photos = image_search_service.get_diverse_place_gallery(place_type, name, count=target_count)
            for p in diverse_photos:
                _add(p)

        hero = all_images[0]
        gallery = all_images[:target_count]
        return hero, gallery

    async def _resolve_candidate_image(
        self,
        name: str,
        dest_name: str,
        place_type: str,
        local_name: str = None,
        you_api_key: str = None,
        default_hero: str = None
    ) -> str:
        """Compatibility wrapper returning primary hero image."""
        hero, _ = await self._resolve_place_images(name, dest_name, place_type, local_name, you_api_key, target_count=12)
        return hero


    def _ensure_cambodia_destinations(self, db):
        """Ensure all 25 provinces exist as Destinations in the database."""
        # Ensure Cambodia country exists
        cambodia = db.query(Country).filter(Country.code == "KH").first()
        if not cambodia:
            cambodia = Country(
                code="KH",
                name="Cambodia",
                name_km="កម្ពុជា",
                currency_code="USD",
                is_active=True
            )
            db.add(cambodia)
            db.commit()
            db.refresh(cambodia)
        # Ensure all 25 destinations exist with real hero images
        created_count = 0
        for prov in CAMBODIA_PROVINCES:
            existing = db.query(Destination).filter(Destination.slug == prov["slug"]).first()
            if not existing:
                dest = Destination(
                    country_id=cambodia.id,
                    name=prov["name"],
                    name_km=prov["name_km"],
                    slug=prov["slug"],
                    overview=f"Explore {prov['name']}, one of Cambodia's beautiful provinces.",
                    hero_image_url=prov.get("hero_image_url"),
                    is_featured=prov["slug"] in ["phnom-penh", "siem-reap", "sihanoukville", "battambang", "kampot"],
                    status="ACTIVE"
                )
                db.add(dest)
                created_count += 1
            else:
                if not existing.hero_image_url or "1600585154340" in existing.hero_image_url:
                    existing.hero_image_url = prov.get("hero_image_url")
                    created_count += 1
        
        if created_count > 0:
            db.commit()
            logger.info(f"Updated/Created {created_count} destination records with verified images.")
            
    async def discover_places_for_province(self, province_slug: str, auto_save: bool = False) -> dict:
        """Use Gemini AI to discover tourist places for a single province."""
        db = SessionLocal()
        try:
            self._ensure_cambodia_destinations(db)

            destination = db.query(Destination).filter(Destination.slug == province_slug).first()
            if not destination:
                raise ValueError(f"Province '{province_slug}' not found in database.")

            dest_id = destination.id
            dest_name = destination.name
            dest_slug = destination.slug
            default_hero = destination.hero_image_url or "/images/destinations/phnom-penh.jpg"

            # Check how many places already exist for this destination
            existing_count = db.query(Place).filter(Place.destination_id == dest_id).count()
            existing_names = [p.name for p in db.query(Place.name).filter(Place.destination_id == dest_id).all()]
            existing_names_set = set(n.strip().lower() for n in existing_names)

            you_api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_api_key_setting.value_json if you_api_key_setting else os.environ.get("YOU_API_KEY")
        finally:
            db.close()

        try:
            prompt = f"""You are an expert Cambodia travel researcher and database builder.

Your task: Find real, existing tourist attractions, temples, restaurants, hotels, markets, waterfalls, 
natural sites, museums, and hidden gems in **{dest_name} Province, Cambodia**.

IMPORTANT RULES:
- Only include REAL places that actually exist. Do NOT invent fictional places.
- Include a mix of well-known and lesser-known places.
- Include the Khmer name (local_name) if you know it.
- Include real GPS coordinates (latitude, longitude) if possible.
- Include real opening hours, phone numbers, websites if available.
- For each place, assign a place_type from: ATTRACTION, TEMPLE, RESTAURANT, CAFE, MARKET, MUSEUM, WATERFALL, HOTEL, RESORT, ACTIVITY, HIDDEN_GEM, NATIONAL_PARK, BEACH, LAKE, MOUNTAIN, VILLAGE

Already in database ({existing_count} places): {', '.join(existing_names[:20]) if existing_names else 'None yet'}
Please find 8-12 NEW places that are NOT already in the database.

Return a JSON array of objects. Each object must have these keys:
- name: English name
- local_name: Khmer name (or null)  
- place_type: One of the types listed above
- description: 2-3 sentence description in English
- description_km: Description in Khmer (or null)
- address: Street address or location description
- latitude: GPS latitude (float or null)
- longitude: GPS longitude (float or null)
- opening_hours: e.g. "07:00 AM - 05:00 PM daily" (or null)
- price_level: One of FREE, $, $$, $$$, $$$$
- phone: Phone number (or null)
- website: Website URL (or null)
- tags: Array of string tags, e.g. ["UNESCO", "Family Friendly", "Photography"]
- rating: Estimated rating 1.0-5.0
"""

            response_text = None

            if ai_gateway.has_any_configured_provider():
                text, meta = await asyncio.to_thread(
                    ai_gateway.generate_text, prompt, use_search=True, timeout=30.0
                )
                if text:
                    response_text = text
                    logger.info(f"Place discovery via {(meta or {}).get('engine')}")

            if not response_text and you_api_key:
                logger.info("Trying You.com API fallback...")
                response_text = await _call_you_com(prompt, you_api_key)

            # If all external AI failed or no API key, use verified curated heritage candidates!
            if not response_text:
                logger.info(f"External AI unavailable or unconfigured, using curated heritage database for {dest_name}...")
                curated_places = self._get_curated_fallback_places(dest_slug, dest_name, dest_id, default_hero, existing_names_set)
                
                saved_to_db = 0
                if auto_save:
                    for p in curated_places:
                        if not p.get("is_duplicate"):
                            try:
                                save_res = await self.save_approved_place(p)
                                if save_res.get("status") == "success":
                                    saved_to_db += 1
                                    p["saved_to_db"] = True
                            except Exception as s_err:
                                logger.warning(f"Auto-save failed for curated {p.get('name')}: {s_err}")

                return {
                    "province": dest_name,
                    "province_slug": dest_slug,
                    "discovered": len(curated_places),
                    "saved_to_db": saved_to_db,
                    "places_data": curated_places,
                    "source": "curated_heritage"
                }

            # Parse response
            places_data = None
            try:
                places_data = json.loads(response_text)
            except json.JSONDecodeError:
                # 1. Try markdown code block
                match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response_text, re.DOTALL)
                if match:
                    try:
                        places_data = json.loads(match.group(1))
                    except Exception:
                        pass
                
                # 2. Try raw brackets if markdown search missed
                if not places_data:
                    match = re.search(r'(\[\s*\{.*?\}\s*\])', response_text, re.DOTALL)
                    if match:
                        try:
                            places_data = json.loads(match.group(1))
                        except Exception:
                            pass

                if not places_data:
                    logger.warning(f"Failed to parse JSON from AI response, using curated fallback: {response_text[:100]}...")
                    curated_places = self._get_curated_fallback_places(dest_slug, dest_name, dest_id, default_hero, existing_names_set)
                    saved_to_db = 0
                    if auto_save:
                        for p in curated_places:
                            if not p.get("is_duplicate"):
                                try:
                                    save_res = await self.save_approved_place(p)
                                    if save_res.get("status") == "success":
                                        saved_to_db += 1
                                        p["saved_to_db"] = True
                                except Exception as s_err:
                                    logger.warning(f"Auto-save failed for curated {p.get('name')}: {s_err}")

                    return {
                        "province": dest_name,
                        "province_slug": dest_slug,
                        "discovered": len(curated_places),
                        "saved_to_db": saved_to_db,
                        "places_data": curated_places,
                        "source": "curated_heritage"
                    }

            if not isinstance(places_data, list):
                places_data = [places_data]

            # Enrich candidate places with authentic, distinct images in parallel
            default_hero = destination.hero_image_url or "/images/destinations/phnom-penh.jpg"
            async def _enrich_candidate(p):
                name = p.get("name", "").strip()
                p_type = p.get("place_type", "ATTRACTION")
                local_name = p.get("local_name")
                hero, gallery = await self._resolve_place_images(name, dest_name, p_type, local_name, you_api_key, target_count=12)
                p["is_duplicate"] = name.lower() in existing_names_set
                p["destination_id"] = dest_id
                p["hero_image_url"] = hero
                p["gallery_json"] = json.dumps(gallery)
                return p

            valid_places = [p for p in places_data if p.get("name", "").strip()]
            processed_places = await asyncio.gather(*[_enrich_candidate(p) for p in valid_places])

            saved_to_db = 0
            if auto_save:
                for p in processed_places:
                    if not p.get("is_duplicate"):
                        try:
                            save_res = await self.save_approved_place(p)
                            if save_res.get("status") == "success":
                                saved_to_db += 1
                                p["saved_to_db"] = True
                        except Exception as s_err:
                            logger.warning(f"Auto-save failed for {p.get('name')}: {s_err}")

            return {
                "province": dest_name,
                "province_slug": dest_slug,
                "discovered": len(processed_places),
                "saved_to_db": saved_to_db,
                "places_data": processed_places
            }

        except Exception as e:
            logger.error(f"AI Tourism Engine error for {province_slug}: {e}")
            
            # If it's an API Error from google-genai, return a friendly message
            error_str = str(e)
            user_message = f"Error: {error_str}"
            if "API key not valid" in error_str or "API_KEY_INVALID" in error_str:
                user_message = "Your Google Gemini API Key is invalid. Please check Settings."
            elif "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower() or "429" in error_str:
                user_message = "Gemini API Quota Exceeded. Please try again tomorrow or upgrade your plan."
            elif "Failed to parse" in error_str:
                user_message = "AI returned an invalid format. Please try again."
            
            return {
                "status": "failed",
                "error": error_str,
                "message": user_message
            }

    async def run_full_scan(self) -> dict:
        """
        Run a full scan across ALL 25 provinces.
        This is the main entry point for the weekly cron job and admin trigger.
        Discovers AND automatically saves places directly to the database dynamically.
        """
        db = SessionLocal()
        try:
            self._ensure_cambodia_destinations(db)
        finally:
            if db.is_active:
                db.close()

        results = []
        total_inserted = 0
        errors = []

        for prov in CAMBODIA_PROVINCES:
            try:
                logger.info(f"🔍 Scanning {prov['name']} with auto-save...")
                result = await self.discover_places_for_province(prov["slug"], auto_save=True)
                results.append(result)
                saved_count = result.get("saved_to_db", 0)
                total_inserted += saved_count
                logger.info(f"✅ {prov['name']}: {saved_count} new places saved to database.")
            except Exception as e:
                error_msg = f"❌ {prov['name']}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)

        return {
            "status": "completed",
            "total_provinces_scanned": len(CAMBODIA_PROVINCES),
            "total_new_places": total_inserted,
            "results": results,
            "errors": errors
        }

    async def update_place_via_ai(self, place_id: str) -> dict:
        """Update an existing place using AI and Wikipedia."""
        db = SessionLocal()
        try:
            place = db.query(Place).filter(Place.id == place_id).first()
            if not place:
                return {"status": "failed", "message": "Place not found."}
                
            destination = db.query(Destination).filter(Destination.id == place.destination_id).first()
            if not destination:
                return {"status": "failed", "message": "Destination not found."}

            place_name = place.name
            place_local_name = place.local_name
            place_curr_hero = place.hero_image_url
            dest_name = destination.name
            dest_hero = destination.hero_image_url

            you_api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_api_key_setting.value_json if you_api_key_setting else os.environ.get("YOU_API_KEY")
        finally:
            db.close()

        try:
            # 1. Fetch real-world data from You.com Web Search to augment AI prompt
            search_context = ""
            extracted_images = []
            
            if you_api_key:
                logger.info(f"Using You.com Web Search for '{place_name}' context...")
                search_data = await _you_web_search(f"{place_name} {dest_name} Cambodia tourism", you_api_key)
                if search_data and "results" in search_data and "web" in search_data["results"]:
                    for idx, result in enumerate(search_data["results"]["web"][:5]):
                        title = result.get("title", "")
                        snippets = result.get("snippets", [])
                        if not snippets and result.get("description"):
                            snippets = [result.get("description")]
                        elif not snippets and result.get("contents", {}).get("highlights"):
                            snippets = result.get("contents", {}).get("highlights", [])
                        highlights = "\n".join(snippets) if isinstance(snippets, list) else str(snippets)
                        search_context += f"Source {idx+1}: {title}\n{highlights}\n\n"
                        
                        # Grab real thumbnails!
                        thumb = result.get("thumbnail_url")
                        if thumb and thumb not in extracted_images:
                            extracted_images.append(thumb)
            
            prompt = f"""You are an expert Cambodia travel blogger and researcher.
I have a place in my database named "{place_name}" located in {dest_name} Province, Cambodia.
Please write a highly detailed, up-to-date blog post.

{"Here is some fresh search data to base your writing on:" if search_context else ""}
{search_context}

Provide VERY DETAILED, rich blog content (10+ paragraphs if possible) covering history, architecture, travel tips, opening hours, exact ticket prices, and upcoming events.

Return a JSON object with these keys ONLY:
- name: English name
- local_name: Khmer name (or null)  
- place_type: One of ATTRACTION, TEMPLE, RESTAURANT, CAFE, MARKET, MUSEUM, WATERFALL, HOTEL, RESORT, ACTIVITY, HIDDEN_GEM
- description: VERY detailed blog post style description in English (10+ paragraphs)
- description_km: VERY detailed description in Khmer (or null)
- address: Street address or location description
- latitude: GPS latitude (float or null)
- longitude: GPS longitude (float or null)
- opening_hours: e.g. "07:00 AM - 05:00 PM daily" (or null)
- price_level: One of FREE, $, $$, $$$, $$$$
- phone: Phone number (or null)
- website: Website URL (or null)
- tags: Array of string tags, e.g. ["UNESCO", "Family Friendly", "Photography"]
- rating: Estimated rating 1.0-5.0
"""
            response_text = None

            if you_api_key:
                logger.info("Attempting You.com API for place update...")
                response_text = await _call_you_com(prompt, you_api_key)

            if not response_text and ai_gateway.has_any_configured_provider():
                text, meta = await asyncio.to_thread(
                    ai_gateway.generate_text, prompt, use_search=True, timeout=30.0
                )
                if text:
                    response_text = text

            if response_text is None:
                return {
                    "status": "failed",
                    "message": "AI update unavailable. Configure an AI provider (and optional You.com key) in Settings."
                }

            try:
                ai_data = json.loads(response_text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response_text, re.DOTALL)
                if match:
                    ai_data = json.loads(match.group(1))
                else:
                    raise ValueError(f"Failed to parse AI response.")

            # Multi-source photo discovery: discover at least 10-12+ authentic images per place
            hero_url, gallery_raw = await self._resolve_place_images(
                ai_data.get("name", place_name),
                dest_name,
                ai_data.get("place_type", "ATTRACTION"),
                ai_data.get("local_name", place_local_name),
                you_api_key,
                target_count=12
            )

            # Prepend any extracted You.com web thumbnails
            if extracted_images:
                for ext_u in reversed(extracted_images):
                    if ext_u and ext_u not in gallery_raw:
                        gallery_raw.insert(0, ext_u)
                hero_url = gallery_raw[0]

            if hero_url:
                try:
                    hero_url = await self._sync_single_image(hero_url, dest_name, ai_data.get("name", place_name))
                except Exception as hero_err:
                    logger.warning(f"Hero sync notice: {hero_err}")

            synced_gallery_json = None
            if gallery_raw:
                try:
                    gallery_tasks = [self._sync_single_image(url, dest_name, ai_data.get("name", place_name)) for url in gallery_raw[:12] if url and url.startswith("http")]
                    if gallery_tasks:
                        synced_gallery = await asyncio.gather(*gallery_tasks, return_exceptions=True)
                        synced_items = [
                            synced if isinstance(synced, str) else orig
                            for synced, orig in zip(synced_gallery, gallery_raw[:12])
                            if isinstance(synced, str) or isinstance(orig, str)
                        ]
                        synced_gallery_json = json.dumps(synced_items)
                except Exception as g_err:
                    logger.warning(f"Gallery sync error: {g_err}")
                    synced_gallery_json = json.dumps(gallery_raw[:12])


            # Fast atomic write to DB
            db = SessionLocal()
            try:
                place = db.query(Place).filter(Place.id == place_id).first()
                if not place:
                    return {"status": "failed", "message": "Place not found during commit."}

                place.name = ai_data.get("name", place.name)
                place.local_name = ai_data.get("local_name") or place.local_name
                place.place_type = ai_data.get("place_type") or place.place_type
                place.description = ai_data.get("description") or place.description
                place.description_km = ai_data.get("description_km") or place.description_km
                place.address = ai_data.get("address") or place.address
                place.latitude = ai_data.get("latitude") or place.latitude
                place.longitude = ai_data.get("longitude") or place.longitude
                place.phone = ai_data.get("phone") or place.phone
                place.website = ai_data.get("website") or place.website
                place.opening_hours = ai_data.get("opening_hours") or place.opening_hours
                place.price_level = ai_data.get("price_level") or place.price_level
                place.rating = ai_data.get("rating") or place.rating
                
                if ai_data.get("tags") and isinstance(ai_data["tags"], list):
                    place.tags_json = json.dumps(ai_data["tags"])

                if hero_url:
                    place.hero_image_url = hero_url
                if synced_gallery_json:
                    place.gallery_json = synced_gallery_json

                place.verification_status = "AI_UPDATED"
                db.commit()
                return {"status": "success", "message": f"Updated {place.name} successfully."}
            except Exception as commit_err:
                db.rollback()
                raise commit_err
            finally:
                db.close()

        except Exception as e:
            logger.error(f"Failed to update place via AI: {e}")
            error_str = str(e)
            user_message = f"Error: {error_str}"
            if "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower() or "429" in error_str:
                user_message = "Gemini API Quota Exceeded. Please try again tomorrow or upgrade your plan."
            elif "API key not valid" in error_str or "API_KEY_INVALID" in error_str:
                user_message = "Your Google Gemini API Key is invalid. Please check Settings."
                
            return {"status": "failed", "message": user_message}

    async def _sync_single_image(self, img_url: str, dest_name: str, place_name: str = None) -> str:
        """
        Downloads image bytes ONCE and uploads to both Google Drive (backup) and Cloudflare R2 (fast CDN) in parallel.
        Returns the Cloudflare R2 public CDN URL if available, otherwise falls back to img_url.
        """
        if not img_url or not img_url.startswith("http"):
            return img_url

        has_gdrive = storage_service.is_configured()
        has_r2 = s3_service.is_configured()
        if not has_gdrive and not has_r2:
            return img_url
            
        # If already on Cloudflare R2, no need to re-upload
        r2_client, r2_cfg = s3_service._get_client_and_config()
        if r2_cfg and r2_cfg.get("public_domain") and r2_cfg["public_domain"] in img_url:
            return img_url

        try:
            headers = {
                "User-Agent": "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1",
                "Accept": "image/*,*/*;q=0.8"
            }
            async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
                res = await client.get(img_url, headers=headers)
                if res.status_code != 200 or not res.content:
                    return img_url
                content = res.content
                content_type = res.headers.get("Content-Type", "image/jpeg")
        except Exception as dl_err:
            logger.warning(f"Download failed for {img_url}: {dl_err}")
            return img_url

        import urllib.parse
        parsed = urllib.parse.urlparse(img_url)
        filename = os.path.basename(parsed.path)
        if not filename or '.' not in filename:
            ext = ".png" if "png" in content_type else ".jpg"
            filename = f"image{ext}"

        folder_path = f"Destinations/{dest_name}"
        if place_name:
            import re
            safe_place = re.sub(r'[^a-zA-Z0-9_\-\s]', '', place_name).strip()
            if safe_place:
                folder_path = f"{folder_path}/{safe_place}"

        async def upload_gdrive():
            if not has_gdrive:
                return
            try:
                await storage_service.upload_file(filename, content, content_type, folder_path)
            except Exception as e:
                logger.warning(f"Google Drive upload warning: {e}")

        async def upload_r2():
            if not has_r2:
                return None
            try:
                return await s3_service.upload_file(filename, content, content_type, folder_path)
            except Exception as e:
                logger.warning(f"Cloudflare R2 upload warning: {e}")
                return None

        try:
            # Parallel execution with 12s safety timeout
            results = await asyncio.wait_for(
                asyncio.gather(upload_gdrive(), upload_r2(), return_exceptions=True),
                timeout=12.0
            )
            r2_res = results[1]
            if isinstance(r2_res, str) and r2_res.startswith("http"):
                return r2_res
        except Exception as sync_err:
            logger.warning(f"Dual storage sync timeout or error for {img_url}: {sync_err}")

        return img_url

    async def save_approved_place(self, place_dict: dict) -> dict:
        name = place_dict.get("name", "").strip()
        dest_id = place_dict.get("destination_id")

        # If destination_id is not directly provided, dynamically resolve from slug or province name
        if not dest_id:
            slug_candidate = place_dict.get("destination_slug") or place_dict.get("province_slug")
            province_name = place_dict.get("province")
            db_res = SessionLocal()
            try:
                if slug_candidate:
                    dest = db_res.query(Destination).filter(Destination.slug == slug_candidate).first()
                    if dest:
                        dest_id = dest.id
                if not dest_id and province_name:
                    dest = db_res.query(Destination).filter(Destination.name.ilike(f"%{province_name.strip()}%")).first()
                    if dest:
                        dest_id = dest.id
            finally:
                db_res.close()

        if not name or not dest_id:
            raise ValueError("Missing name or destination_id")

        db = SessionLocal()
        try:
            existing = db.query(Place).filter(Place.destination_id == dest_id, Place.name == name).first()
            if existing:
                return {"status": "skipped", "message": "Already exists"}

            destination = db.query(Destination).filter(Destination.id == dest_id).first()
            dest_name = destination.name if destination else "Cambodia"
            dest_hero = destination.hero_image_url if destination else None
        finally:
            db.close()

        # Fetch images for the approved place OUTSIDE the database session
        hero_url = place_dict.get("hero_image_url")
        gallery_json = place_dict.get("gallery_json", "[]")

        # Load You.com key if configured
        db = SessionLocal()
        try:
            you_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_key_setting.value_json if you_key_setting else os.environ.get("YOU_API_KEY")
        finally:
            db.close()

        # Check gallery completeness: ensure at least 10+ photos
        gallery_list = json.loads(gallery_json) if isinstance(gallery_json, str) else (gallery_json or [])
        if not hero_url or "/images/destinations/" in hero_url or len(gallery_list) < 10:
            discovered_hero, discovered_gallery = await self._resolve_place_images(
                name,
                dest_name,
                place_dict.get("place_type", "ATTRACTION"),
                place_dict.get("local_name"),
                you_api_key,
                target_count=12
            )
            if not hero_url or "/images/destinations/" in hero_url:
                hero_url = discovered_hero
            if len(gallery_list) < 10:
                gallery_list = discovered_gallery
            gallery_json = json.dumps(gallery_list)

        # Dual storage synchronization:
        # 1. Google Drive for persistent backup
        # 2. Cloudflare R2 for fast public display
        if hero_url and hero_url.startswith("http"):
            try:
                hero_url = await self._sync_single_image(hero_url, dest_name, name)
            except Exception as hero_err:
                logger.warning(f"Hero image sync failed for {name}, keeping original URL: {hero_err}")

        # Process gallery items concurrently (up to 12 photos)
        try:
            if gallery_list and isinstance(gallery_list, list):
                gallery_tasks = [self._sync_single_image(g, dest_name, name) for g in gallery_list[:12] if g and g.startswith("http")]
                if gallery_tasks:
                    synced_items = await asyncio.gather(*gallery_tasks, return_exceptions=True)
                    final_gallery = [
                        synced if isinstance(synced, str) else orig
                        for synced, orig in zip(synced_items, gallery_list[:12])
                        if isinstance(synced, str) or isinstance(orig, str)
                    ]
                    gallery_json = json.dumps(final_gallery)
        except Exception as gal_err:
            logger.warning(f"Gallery sync error: {gal_err}")


        # Fast atomic insert into DB
        db = SessionLocal()
        try:
            base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
            while db.query(Place).filter(Place.slug == slug).first():
                slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

            # Clean & sanitize coordinate and numeric data
            raw_lat = place_dict.get("latitude")
            raw_lng = place_dict.get("longitude")
            try:
                lat = float(raw_lat) if raw_lat is not None and str(raw_lat).strip() != "" else None
            except (ValueError, TypeError):
                lat = None

            try:
                lng = float(raw_lng) if raw_lng is not None and str(raw_lng).strip() != "" else None
            except (ValueError, TypeError):
                lng = None

            raw_rating = place_dict.get("rating", 4.5)
            try:
                rating = float(raw_rating) if raw_rating is not None and str(raw_rating).strip() != "" else 4.5
            except (ValueError, TypeError):
                rating = 4.5

            raw_tags = place_dict.get("tags", [])
            if isinstance(raw_tags, str):
                try:
                    raw_tags = json.loads(raw_tags)
                except Exception:
                    raw_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
            tags_json = json.dumps(raw_tags if isinstance(raw_tags, list) else [])

            new_place = Place(
                id=uuid.uuid4().hex,
                destination_id=dest_id,
                name=name,
                local_name=place_dict.get("local_name"),
                slug=slug,
                place_type=place_dict.get("place_type", "ATTRACTION"),
                description=place_dict.get("description", ""),
                description_km=place_dict.get("description_km"),
                address=place_dict.get("address"),
                latitude=lat,
                longitude=lng,
                opening_hours=place_dict.get("opening_hours"),
                price_level=place_dict.get("price_level", "$$"),
                phone=place_dict.get("phone"),
                website=place_dict.get("website"),
                hero_image_url=hero_url,
                gallery_json=gallery_json,
                tags_json=tags_json,
                rating=rating,
                verification_status="AI_GENERATED",
                status="ACTIVE",
                is_featured=False
            )
            db.add(new_place)
            db.commit()
            return {"status": "success", "message": f"Saved {name}"}
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

ai_tourism_engine = AITourismEngine()
