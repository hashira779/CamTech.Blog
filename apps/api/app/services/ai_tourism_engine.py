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

async def fetch_wiki_images(place_name: str, province_name: str, local_name: str = None) -> list[str]:
    """Uses Wikipedia API with policy-compliant headers and fast queries to find real photos."""
    ua = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"
    headers = {"User-Agent": ua}
    
    clean_name = re.sub(r'\(.*?\)', '', place_name).strip()
    queries = [
        f"{place_name} Cambodia",
        f"{place_name} {province_name}",
    ]
    if clean_name and clean_name != place_name:
        queries.append(f"{clean_name} Cambodia")
    if local_name and local_name.strip():
        queries.append(local_name.strip())

    BAD_KEYWORDS = [
        "flag", "symbol", "coat_of_arms", "icon", "map", "logo", "stub", 
        "diagram", "locator", ".svg", "emblem", "seal_of", "district_in"
    ]

    async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
        # Search Wikipedia with distinct queries
        for q in dict.fromkeys(queries):
            url = f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrlimit=3&prop=pageimages|extracts&exintro=1&explaintext=1&piprop=original&format=json"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    candidates = []
                    for p in pages.values():
                        title = p.get("title", "")
                        extract = p.get("extract", "").lower()
                        # Strict relevance check: must relate to Cambodia, Khmer, or target province
                        is_relevant = (
                            "cambodia" in extract or "khmer" in extract or
                            (province_name and province_name.lower() in extract) or
                            "cambodia" in title.lower() or
                            (clean_name and clean_name.lower() in title.lower())
                        )
                        if not is_relevant:
                            continue

                        if "original" in p:
                            src = p["original"]["source"]
                            src_lower = src.lower()
                            if not any(bad in src_lower for bad in BAD_KEYWORDS):
                                candidates.append(src)
                    if candidates:
                        return candidates
            except Exception as e:
                logger.debug(f"Wiki search error for {q}: {e}")

    return []



# Distinct category-specific photo library (Unsplash royalty-free images tailored to Cambodia / SE Asia travel)
CATEGORY_FALLBACK_IMAGES = {
    "WATERFALL": [
        "https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80",
    ],
    "TEMPLE": [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop&q=80",
    ],
    "HOTEL": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80",
    ],
    "RESORT": [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&auto=format&fit=crop&q=80",
    ],
    "NATIONAL_PARK": [
        "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&auto=format&fit=crop&q=80",
    ],
    "ACTIVITY": [
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
    ],
    "RESTAURANT": [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80",
    ],
    "CAFE": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
    ],
    "MARKET": [
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800&auto=format&fit=crop&q=80",
    ],
    "MUSEUM": [
        "https://images.unsplash.com/photo-1565034946487-077786996e27?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop&q=80",
    ],
    "BEACH": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80",
    ],
    "LAKE": [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1439853941329-a93ac9e8636e?w=800&auto=format&fit=crop&q=80",
    ],
    "MOUNTAIN": [
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    ],
    "VILLAGE": [
        "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80",
    ],
    "ATTRACTION": [
        "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&auto=format&fit=crop&q=80",
    ]
}

def get_category_fallback_photo(place_type: str, name: str) -> str:
    """Return a unique, themed photo based on place_type and name hash."""
    ptype = (place_type or "ATTRACTION").upper()
    pool = CATEGORY_FALLBACK_IMAGES.get(ptype, CATEGORY_FALLBACK_IMAGES["ATTRACTION"])
    idx = abs(hash(name)) % len(pool)
    return pool[idx]

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
    Super engine that uses Google Gemini to discover and populate tourist places
    for all 25 provinces of Cambodia automatically.
    """

    def _get_gemini_client(self, db):
        """Get Gemini client using API key from DB settings or env fallback."""
        if genai is None:
            return None
        api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'GEMINI_API_KEY').first()
        api_key = api_key_setting.value_json if api_key_setting else settings.AI_API_KEY
        if not api_key:
            return None
        return genai.Client(api_key=api_key)

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
                "gallery_json": "[]"
            })
        return processed

    async def _resolve_candidate_image(
        self,
        name: str,
        dest_name: str,
        place_type: str,
        local_name: str = None,
        you_api_key: str = None,
        default_hero: str = None
    ) -> str:
        """Find a real photo via Wikipedia or You.com; fall back to a distinct category photo."""
        # 1. Try fast Wikipedia image lookup with relevance filter
        try:
            wiki_imgs = await asyncio.wait_for(fetch_wiki_images(name, dest_name, local_name), timeout=2.5)
            if wiki_imgs:
                return wiki_imgs[0]
        except Exception:
            pass

        # 2. Try fast You.com Web Search thumbnails
        if you_api_key:
            try:
                search_data = await asyncio.wait_for(_you_web_search(f"{name} {dest_name} Cambodia", you_api_key), timeout=2.5)
                if search_data and "results" in search_data and "web" in search_data["results"]:
                    for r in search_data["results"]["web"][:4]:
                        thumb = r.get("thumbnail_url")
                        if thumb and thumb.startswith("http") and not any(bad in thumb.lower() for bad in ["logo", "icon", "favicon"]):
                            return thumb
            except Exception:
                pass

        # 3. Use distinct, high-quality category-specific photo
        return get_category_fallback_photo(place_type, name)

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
            
    def _get_dynamic_fallback_models(self, client) -> list[str]:
        """Prioritized list of real Google Gemini models."""
        preferred = []
        if settings.AI_MODEL_NAME and not any(fake in settings.AI_MODEL_NAME for fake in ["3.8", "3.5", "3.0", "3.1"]):
            preferred.append(settings.AI_MODEL_NAME)
        preferred.extend([
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ])
        return list(dict.fromkeys(preferred))

    async def discover_places_for_province(self, province_slug: str) -> dict:
        """Use Gemini AI to discover tourist places for a single province."""
        db = SessionLocal()
        try:
            client = self._get_gemini_client(db)
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
            last_error = None

            if client:
                fallback_models = self._get_dynamic_fallback_models(client)
                for model_to_try in fallback_models:
                    try:
                        logger.info(f"Trying Gemini model: {model_to_try}")
                        
                        def _generate_gemini(m=model_to_try):
                            return client.models.generate_content(
                                model=m,
                                contents=prompt,
                                config=types.GenerateContentConfig(
                                    temperature=0.4,
                                    response_mime_type="application/json"
                                )
                            )

                        # Strict 14-second timeout per model so overall request never times out
                        response = await asyncio.wait_for(asyncio.to_thread(_generate_gemini), timeout=14.0)
                        response_text = response.text
                        logger.info(f"Success with model: {model_to_try}")
                        break
                    except asyncio.TimeoutError:
                        logger.warning(f"Model {model_to_try} timed out after 14s, trying next model...")
                        last_error = TimeoutError(f"Model {model_to_try} timed out")
                        continue
                    except Exception as model_err:
                        last_error = model_err
                        logger.warning(f"Model {model_to_try} failed: {model_err}, trying next...")
                        continue

            if not response_text and you_api_key:
                logger.info("Trying You.com API fallback...")
                response_text = await _call_you_com(prompt, you_api_key)

            # If all external AI failed or no API key, use verified curated heritage candidates!
            if not response_text:
                logger.info(f"External AI unavailable or unconfigured, using curated heritage database for {dest_name}...")
                curated_places = self._get_curated_fallback_places(dest_slug, dest_name, dest_id, default_hero, existing_names_set)
                return {
                    "province": dest_name,
                    "province_slug": dest_slug,
                    "discovered": len(curated_places),
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
                    return {
                        "province": dest_name,
                        "province_slug": dest_slug,
                        "discovered": len(curated_places),
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
                hero = await self._resolve_candidate_image(name, dest_name, p_type, local_name, you_api_key, default_hero)
                p["is_duplicate"] = name.lower() in existing_names_set
                p["destination_id"] = dest_id
                p["hero_image_url"] = hero
                p["gallery_json"] = "[]"
                return p

            valid_places = [p for p in places_data if p.get("name", "").strip()]
            processed_places = await asyncio.gather(*[_enrich_candidate(p) for p in valid_places])

            # Return raw data for approval immediately (typically under 3-5 seconds)
            return {
                "province": dest_name,
                "province_slug": dest_slug,
                "discovered": len(processed_places),
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
        This is the main entry point for the weekly cron job.
        """
        db = SessionLocal()
        try:
            # Fast-fail validation: ensure API key exists before scanning 25 provinces
            self._get_gemini_client(db)
            self._ensure_cambodia_destinations(db)
        except ValueError as e:
            db.close()
            return {
                "status": "failed",
                "error": str(e),
                "message": "Please configure the Google Gemini API Key in Settings first."
            }
        finally:
            if db.is_active: # Only close if we didn't already
                db.close()

        results = []
        total_inserted = 0
        errors = []

        for prov in CAMBODIA_PROVINCES:
            try:
                logger.info(f"🔍 Scanning {prov['name']}...")
                result = await self.discover_places_for_province(prov["slug"])
                results.append(result)
                discovered_count = result.get("discovered", 0)
                total_inserted += discovered_count
                logger.info(f"✅ {prov['name']}: {discovered_count} new places discovered.")
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
            client = self._get_gemini_client(db)
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
            fallback_models = self._get_dynamic_fallback_models(client)

            response_text = None
            last_error = None

            if you_api_key:
                logger.info("Attempting You.com API for place update...")
                response_text = await _call_you_com(prompt, you_api_key)

            if not response_text and client:
                for model_to_try in fallback_models:
                    try:
                        tools_config = None
                        if "gemini-2.5" in model_to_try or "gemini-2.0" in model_to_try:
                            try:
                                tools_config = [types.Tool(google_search=types.GoogleSearch())]
                            except Exception:
                                tools_config = None
                            
                        def _generate_update(m=model_to_try, tc=tools_config):
                            return client.models.generate_content(
                                model=m,
                                contents=prompt,
                                config=types.GenerateContentConfig(
                                    temperature=0.7,
                                    response_mime_type="application/json",
                                    tools=tc
                                )
                            )
                        response = await asyncio.wait_for(asyncio.to_thread(_generate_update), timeout=18.0)
                        response_text = response.text
                        break
                    except asyncio.TimeoutError:
                        logger.warning(f"Update model {model_to_try} timed out after 18s")
                        continue
                    except Exception as model_err:
                        last_error = model_err
                        logger.warning(f"Update model {model_to_try} failed: {model_err}")
                        continue
                
            if response_text is None:
                return {
                    "status": "failed",
                    "message": "AI update unavailable. Please check Google Gemini API Key in Settings."
                }

            try:
                ai_data = json.loads(response_text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response_text, re.DOTALL)
                if match:
                    ai_data = json.loads(match.group(1))
                else:
                    raise ValueError(f"Failed to parse AI response.")

            # Assign explicitly extracted Real You.com images or Wikipedia fallback
            hero_url = None
            gallery_raw = []
            if extracted_images:
                hero_url = extracted_images[0]
                gallery_raw = extracted_images[1:]
            else:
                # Fallback to Wikipedia images with full query variations
                wiki_images = await fetch_wiki_images(ai_data.get("name", place_name), dest_name, ai_data.get("local_name", place_local_name))
                if wiki_images:
                    hero_url = wiki_images[0]
                    gallery_raw = wiki_images
                elif not place_curr_hero or "/images/destinations/" in place_curr_hero:
                    hero_url = dest_hero
                    gallery_raw = [dest_hero] if dest_hero else []
                
            if hero_url:
                hero_url = await self._sync_single_image(hero_url, dest_name, ai_data.get("name", place_name))
                
            synced_gallery_json = None
            if gallery_raw and isinstance(gallery_raw, list):
                gallery_tasks = [self._sync_single_image(url, dest_name, ai_data.get("name", place_name)) for url in gallery_raw[:4] if url and url.startswith("http")]
                if gallery_tasks:
                    synced_gallery = await asyncio.gather(*gallery_tasks, return_exceptions=True)
                    synced_gallery_json = json.dumps([item for item in synced_gallery if isinstance(item, str)])

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
            try:
                await storage_service.upload_file(filename, content, content_type, folder_path)
            except Exception as e:
                logger.warning(f"Google Drive upload warning: {e}")

        async def upload_r2():
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

        # Fetch real images if not already provided or if placeholder/province cover
        if not hero_url or "/images/destinations/" in hero_url:
            # 1. Try Wikipedia with relevance verification
            img_urls = await fetch_wiki_images(name, dest_name, place_dict.get("local_name"))

            # 2. Try You.com Web Search thumbnails
            if not img_urls and you_api_key:
                try:
                    search_data = await _you_web_search(f"{name} {dest_name} Cambodia", you_api_key)
                    if search_data and "results" in search_data and "web" in search_data["results"]:
                        img_urls = [r.get("thumbnail_url") for r in search_data["results"]["web"] if r.get("thumbnail_url") and not any(bad in r.get("thumbnail_url", "").lower() for bad in ["logo", "icon", "favicon"])]
                except Exception:
                    pass

            if img_urls:
                hero_url = img_urls[0]
                gallery_json = json.dumps(img_urls[:4])
            else:
                # 3. Use distinct category-specific photo
                hero_url = get_category_fallback_photo(place_dict.get("place_type"), name)

        # Dual storage synchronization:
        # 1. Google Drive for persistent backup
        # 2. Cloudflare R2 for fast public display
        if hero_url and hero_url.startswith("http"):
            try:
                hero_url = await self._sync_single_image(hero_url, dest_name, name)
            except Exception as hero_err:
                logger.warning(f"Hero image sync failed for {name}, keeping original URL: {hero_err}")

        # Process gallery items concurrently
        try:
            gallery_list = json.loads(gallery_json) if isinstance(gallery_json, str) else (gallery_json or [])
            if gallery_list and isinstance(gallery_list, list):
                gallery_tasks = [self._sync_single_image(g, dest_name, name) for g in gallery_list[:4] if g and g.startswith("http")]
                if gallery_tasks:
                    synced_items = await asyncio.gather(*gallery_tasks, return_exceptions=True)
                    gallery_json = json.dumps([item for item in synced_items if isinstance(item, str)])
        except Exception as gal_err:
            logger.warning(f"Gallery sync error: {gal_err}")

        # Fast atomic insert into DB
        db = SessionLocal()
        try:
            base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
            while db.query(Place).filter(Place.slug == slug).first():
                slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

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
                latitude=place_dict.get("latitude"),
                longitude=place_dict.get("longitude"),
                opening_hours=place_dict.get("opening_hours"),
                price_level=place_dict.get("price_level", "$$"),
                phone=place_dict.get("phone"),
                website=place_dict.get("website"),
                hero_image_url=hero_url,
                gallery_json=gallery_json,
                tags_json=json.dumps(place_dict.get("tags", [])),
                rating=place_dict.get("rating", 4.5),
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
