"""
AI Tourism Engine — Automatic discovery of tourist places across all 25 provinces of Cambodia.
Uses Google Gemini AI to research, generate, and insert real tourist places into the database.
Designed to run once per week via APScheduler.
"""
import json
import uuid
import re
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

def _call_you_com(prompt: str, api_key: str) -> str:
    import httpx
    if not api_key:
        return None
    try:
        url = "https://api.you.com/v1/research"
        headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "input": f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown blocks.",
            "research_effort": "standard"
        }
        res = httpx.post(url, json=payload, headers=headers, timeout=60.0)
        res.raise_for_status()
        data = res.json()
        return data.get("output", {}).get("content", "")
    except Exception as e:
        logger.warning(f"You.com Research API failed: {e}")
        return None

def _you_web_search(query: str, api_key: str) -> dict:
    """Uses You.com Web Search API to get real search highlights and image thumbnails."""
    import httpx
    if not api_key:
        return None
    try:
        url = "https://api.you.com/v1/search"
        headers = {"X-API-Key": api_key}
        params = {"query": query}
        res = httpx.get(url, params=params, headers=headers, timeout=15.0)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        logger.warning(f"You.com Web Search API failed: {e}")
        return None

async def fetch_wiki_images(place_name: str, province_name: str, local_name: str = None) -> list[str]:
    """Uses Wikipedia API with policy-compliant headers, multi-query variations, and flag/svg filtering to find real photos."""
    ua = "CamTechBlogDiscovery/2.0 (https://blog.camtech.cam; contact@camtech.cam) python-httpx/0.28.1"
    headers = {"User-Agent": ua}
    
    clean_name = re.sub(r'\(.*?\)', '', place_name).strip()
    queries = [
        f"{place_name} {province_name}",
        f"{place_name} Cambodia",
        place_name,
        f"{clean_name} {province_name}",
        f"{clean_name} Cambodia",
        clean_name,
    ]
    if local_name and local_name.strip():
        queries.append(f"{local_name.strip()} {province_name}")
        queries.append(local_name.strip())

    BAD_KEYWORDS = [
        "flag", "symbol", "coat_of_arms", "icon", "map", "logo", "stub", 
        "diagram", "locator", ".svg", "emblem", "seal_of", "district_in"
    ]

    async with httpx.AsyncClient(timeout=12, headers=headers) as client:
        # 1. Search English Wikipedia with distinct queries
        for q in dict.fromkeys(queries):
            url = f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrlimit=10&prop=pageimages&piprop=original&format=json"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    candidates = []
                    for p in pages.values():
                        if "original" in p:
                            src = p["original"]["source"]
                            src_lower = src.lower()
                            if not any(bad in src_lower for bad in BAD_KEYWORDS):
                                candidates.append(src)
                    if candidates:
                        return candidates
            except Exception as e:
                logger.debug(f"Wiki search error for {q}: {e}")

        # 2. Search Khmer Wikipedia if local_name is available
        if local_name and local_name.strip():
            url = f"https://km.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(local_name.strip())}&gsrlimit=5&prop=pageimages&piprop=original&format=json"
            try:
                res = await client.get(url)
                if res.status_code == 200:
                    pages = res.json().get("query", {}).get("pages", {})
                    candidates = []
                    for p in pages.values():
                        if "original" in p:
                            src = p["original"]["source"]
                            if not any(bad in src.lower() for bad in BAD_KEYWORDS):
                                candidates.append(src)
                    if candidates:
                        return candidates
            except Exception:
                pass

    return []



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
        api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'GEMINI_API_KEY').first()
        api_key = api_key_setting.value_json if api_key_setting else settings.AI_API_KEY
        if not api_key:
            raise ValueError("Google AI API Key is not configured. Set it in Admin > Settings.")
        return genai.Client(api_key=api_key)

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
        """Dynamically fetch available models and prioritize newer versions."""
        preferred = [
            settings.AI_MODEL_NAME or 'gemini-3.8-flash',
            'gemini-3.8-flash',
            'gemini-3.5-flash',
            'gemini-3.1-pro-preview',
            'gemini-3.0-pro',
            'gemini-3.0-flash'
        ]
        try:
            available = [m.name.replace('models/', '') for m in client.models.list()]
            dynamic_list = [m for m in preferred if m in available]
            
            # Filter out any deprecated '2.5' models in case the API still lists them
            dynamic_list = [m for m in dynamic_list if '2.5' not in m]
            
            # If for some reason preferred models aren't there, append other available gemini models
            if not dynamic_list:
                dynamic_list = [m for m in available if 'gemini' in m and '2.5' not in m]
                
            # Remove duplicates while preserving order
            return list(dict.fromkeys(dynamic_list)) if dynamic_list else preferred
        except Exception as e:
            logger.warning(f"Could not fetch dynamic models: {e}")
            return preferred

    async def discover_places_for_province(self, province_slug: str) -> dict:
        """Use Gemini AI to discover tourist places for a single province."""
        db = SessionLocal()
        try:
            client = self._get_gemini_client(db)
            self._ensure_cambodia_destinations(db)

            destination = db.query(Destination).filter(Destination.slug == province_slug).first()
            if not destination:
                raise ValueError(f"Province '{province_slug}' not found in database.")

            # Check how many places already exist for this destination
            existing_count = db.query(Place).filter(Place.destination_id == destination.id).count()
            existing_names = [p.name for p in db.query(Place.name).filter(Place.destination_id == destination.id).all()]

            model_name = settings.AI_MODEL_NAME or 'gemini-3.8-flash'

            prompt = f"""You are an expert Cambodia travel researcher and database builder.

Your task: Find real, existing tourist attractions, temples, restaurants, hotels, markets, waterfalls, 
natural sites, museums, and hidden gems in **{destination.name} Province, Cambodia**.

IMPORTANT RULES:
- Only include REAL places that actually exist. Do NOT invent fictional places.
- Include a mix of well-known and lesser-known places.
- Include the Khmer name (local_name) if you know it.
- Include real GPS coordinates (latitude, longitude) if possible.
- Include real opening hours, phone numbers, websites if available.
- For each place, assign a place_type from: ATTRACTION, TEMPLE, RESTAURANT, CAFE, MARKET, MUSEUM, WATERFALL, HOTEL, RESORT, ACTIVITY, HIDDEN_GEM, NATIONAL_PARK, BEACH, LAKE, MOUNTAIN, VILLAGE

Already in database ({existing_count} places): {', '.join(existing_names[:20]) if existing_names else 'None yet'}
Please find 15-20 NEW places that are NOT already in the database.

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

            # Fallback model chain — dynamically checked against API to avoid 404s
            fallback_models = self._get_dynamic_fallback_models(client)

            # Check if we have You.com API key
            you_api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_api_key_setting.value_json if you_api_key_setting else os.environ.get("YOU_API_KEY")
            you_response_text = _call_you_com(prompt, you_api_key)
            
            response_text = None
            last_error = None
            
            if you_response_text:
                response_text = you_response_text
                logger.info("Success with You.com API")
            else:
                for model_to_try in fallback_models:
                    try:
                        logger.info(f"Trying model: {model_to_try}")
                        response = client.models.generate_content(
                            model=model_to_try,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.4,
                                response_mime_type="application/json"
                            )
                        )
                        response_text = response.text
                        logger.info(f"Success with model: {model_to_try}")
                        break  # Success! Stop trying
                    except Exception as model_err:
                        last_error = model_err
                        error_msg = str(model_err)
                        if any(err_code in error_msg for err_code in ["503", "UNAVAILABLE", "overloaded", "404", "NOT_FOUND", "429", "RESOURCE_EXHAUSTED", "quota"]):
                            logger.warning(f"Model {model_to_try} failed ({error_msg[:30]}), trying next...")
                            continue
                        else:
                            raise model_err  # Non-recoverable error
    
                if response_text is None:
                    raise last_error or Exception("All AI models are currently unavailable. Please try again later.")

            # Parse response
            try:
                places_data = json.loads(response_text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response_text, re.DOTALL)
                if match:
                    places_data = json.loads(match.group(1))
                else:
                    raise ValueError(f"Failed to parse AI response for {destination.name}")

            if not isinstance(places_data, list):
                places_data = [places_data]

            # Check which places already exist and format for UI review
            processed_places = []
            for p in places_data:
                name = p.get("name", "").strip()
                if not name:
                    continue

                existing = db.query(Place).filter(
                    Place.destination_id == destination.id,
                    Place.name == name
                ).first()

                p["is_duplicate"] = bool(existing)
                p["destination_id"] = destination.id

                # Automatically discover real photo preview for review card
                try:
                    img_urls = await fetch_wiki_images(name, destination.name, p.get("local_name"))
                    if img_urls:
                        p["hero_image_url"] = img_urls[0]
                        p["gallery_json"] = json.dumps(img_urls[:4])
                    elif destination.hero_image_url:
                        p["hero_image_url"] = destination.hero_image_url
                except Exception:
                    p["hero_image_url"] = destination.hero_image_url

                processed_places.append(p)

            # Return raw data for approval immediately
            return {
                "province": destination.name,
                "province_slug": destination.slug,
                "discovered": len(processed_places),
                "places_data": processed_places
            }

        except Exception as e:
            db.rollback()
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
        finally:
            db.close()

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
                total_inserted += result["inserted"]
                logger.info(f"✅ {prov['name']}: {result['inserted']} new places added.")
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

            # 1. Fetch real-world data from You.com Web Search to augment AI prompt
            you_api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'YOU_API_KEY').first()
            you_api_key = you_api_key_setting.value_json if you_api_key_setting else os.environ.get("YOU_API_KEY")
            
            search_context = ""
            extracted_images = []
            
            if you_api_key:
                logger.info(f"Using You.com Web Search for '{place.name}' context...")
                search_data = _you_web_search(f"{place.name} {destination.name} Cambodia tourism", you_api_key)
                if search_data and "results" in search_data and "web" in search_data["results"]:
                    for idx, result in enumerate(search_data["results"]["web"][:5]):
                        title = result.get("title", "")
                        highlights = "\n".join(result.get("contents", {}).get("highlights", []))
                        search_context += f"Source {idx+1}: {title}\n{highlights}\n\n"
                        
                        # Grab real thumbnails!
                        thumb = result.get("thumbnail_url")
                        if thumb and thumb not in extracted_images:
                            extracted_images.append(thumb)
            
            client = self._get_gemini_client(db)
            
            prompt = f"""You are an expert Cambodia travel blogger and researcher.
I have a place in my database named "{place.name}" located in {destination.name} Province, Cambodia.
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

            # Use You.com Research API as fallback
            you_response_text = _call_you_com(prompt, you_api_key)
            
            response_text = None
            last_error = None
            
            if you_response_text:
                response_text = you_response_text
                logger.info("Success with You.com API")
            else:
                for model_to_try in fallback_models:
                    try:
                        tools_config = None
                        if "gemini-3.8" in model_to_try or "gemini-3.5" in model_to_try or "gemini-2.5" in model_to_try:
                            tools_config = [types.Tool(google_search=types.GoogleSearch())]
                            
                        response = client.models.generate_content(
                            model=model_to_try,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.7,
                                response_mime_type="application/json",
                                tools=tools_config
                            )
                        )
                        response_text = response.text
                        break
                    except Exception as model_err:
                        last_error = model_err
                        error_msg = str(model_err)
                        if any(err_code in error_msg for err_code in ["503", "UNAVAILABLE", "overloaded", "404", "NOT_FOUND", "429", "RESOURCE_EXHAUSTED", "quota"]):
                            logger.warning(f"Update model {model_to_try} failed ({error_msg[:30]}), trying next...")
                            continue
                        else:
                            raise model_err
                
                if response_text is None:
                    raise last_error or Exception("All AI models are currently unavailable.")

            try:
                ai_data = json.loads(response_text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response_text, re.DOTALL)
                if match:
                    ai_data = json.loads(match.group(1))
                else:
                    raise ValueError(f"Failed to parse AI response.")

            # Update place object
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
                
            # Assign explicitly extracted Real You.com images or Wikipedia fallback
            hero_url = None
            gallery_raw = []
            if extracted_images:
                hero_url = extracted_images[0]
                gallery_raw = extracted_images[1:]
            else:
                # Fallback to Wikipedia images with full query variations
                wiki_images = await fetch_wiki_images(place.name, destination.name, place.local_name)
                if wiki_images:
                    hero_url = wiki_images[0]
                    gallery_raw = wiki_images
                elif not place.hero_image_url or "/images/destinations/" in place.hero_image_url:
                    hero_url = destination.hero_image_url
                    gallery_raw = [destination.hero_image_url] if destination.hero_image_url else []
                
            if hero_url:
                final_hero = hero_url
                # 1. Backup to Google Drive if configured
                try:
                    await storage_service.upload_file_from_url(hero_url, f"Destinations/{destination.name}")
                except Exception as g_err:
                    logger.warning(f"Google Drive upload warning: {g_err}")

                # 2. Upload to Cloudflare R2 for fast public display
                try:
                    r2_url = await s3_service.upload_file_from_url(hero_url, f"Destinations/{destination.name}")
                    if r2_url and r2_url.startswith("http"):
                        final_hero = r2_url
                except Exception as r2_err:
                    logger.warning(f"R2 upload warning: {r2_err}")

                place.hero_image_url = final_hero
                
            if gallery_raw and isinstance(gallery_raw, list):
                gallery = []
                for url in gallery_raw:
                    if url and url.startswith("http"):
                        try:
                            await storage_service.upload_file_from_url(url, f"Destinations/{destination.name}")
                        except Exception:
                            pass
                        try:
                            r2_url = await s3_service.upload_file_from_url(url, f"Destinations/{destination.name}")
                            gallery.append(r2_url if (r2_url and r2_url.startswith("http")) else url)
                        except Exception:
                            gallery.append(url)
                    else:
                        gallery.append(url)
                place.gallery_json = json.dumps(gallery)

            place.verification_status = "AI_UPDATED"
            
            db.commit()

            return {"status": "success", "message": f"Updated {place.name} successfully."}

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update place via AI: {e}")
            error_str = str(e)
            user_message = f"Error: {error_str}"
            if "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower() or "429" in error_str:
                user_message = "Gemini API Quota Exceeded. Please try again tomorrow or upgrade your plan."
            elif "API key not valid" in error_str or "API_KEY_INVALID" in error_str:
                user_message = "Your Google Gemini API Key is invalid. Please check Settings."
                
            return {"status": "failed", "message": user_message}
        finally:
            db.close()


    async def save_approved_place(self, place_dict: dict) -> dict:
        db = SessionLocal()
        try:
            name = place_dict.get("name", "").strip()
            dest_id = place_dict.get("destination_id")
            if not name or not dest_id:
                raise ValueError("Missing name or destination_id")

            existing = db.query(Place).filter(Place.destination_id == dest_id, Place.name == name).first()
            if existing:
                return {"status": "skipped", "message": "Already exists"}

            base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"
            while db.query(Place).filter(Place.slug == slug).first():
                slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

            # Fetch images for the approved place
            destination = db.query(Destination).filter(Destination.id == dest_id).first()
            dest_name = destination.name if destination else "Cambodia"
            
            hero_url = place_dict.get("hero_image_url")
            gallery_json = place_dict.get("gallery_json", "[]")
            
            # Fetch images if not already provided or if placeholder
            if not hero_url or "/images/destinations/" in hero_url:
                img_urls = await fetch_wiki_images(name, dest_name, place_dict.get("local_name"))
                if img_urls:
                    hero_url = img_urls[0]
                    gallery_json = json.dumps(img_urls[:4])
                elif destination and destination.hero_image_url:
                    hero_url = destination.hero_image_url

            # Dual storage synchronization:
            # 1. Google Drive for persistent backup
            # 2. Cloudflare R2 for fast public display
            if hero_url and hero_url.startswith("http"):
                try:
                    await storage_service.upload_file_from_url(hero_url, f"Destinations/{dest_name}")
                except Exception as g_err:
                    logger.warning(f"Google Drive upload warning: {g_err}")

                try:
                    r2_url = await s3_service.upload_file_from_url(hero_url, f"Destinations/{dest_name}")
                    if r2_url and r2_url.startswith("http"):
                        hero_url = r2_url
                except Exception as r2_err:
                    logger.warning(f"R2 upload warning: {r2_err}")

            # Process gallery items similarly if any
            try:
                gallery_list = json.loads(gallery_json) if isinstance(gallery_json, str) else (gallery_json or [])
                updated_gallery = []
                for g_item in gallery_list:
                    if g_item and g_item.startswith("http"):
                        try:
                            await storage_service.upload_file_from_url(g_item, f"Destinations/{dest_name}")
                        except Exception:
                            pass
                        try:
                            r2_g = await s3_service.upload_file_from_url(g_item, f"Destinations/{dest_name}")
                            updated_gallery.append(r2_g if (r2_g and r2_g.startswith("http")) else g_item)
                        except Exception:
                            updated_gallery.append(g_item)
                    else:
                        updated_gallery.append(g_item)
                gallery_json = json.dumps(updated_gallery)
            except Exception:
                pass


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
