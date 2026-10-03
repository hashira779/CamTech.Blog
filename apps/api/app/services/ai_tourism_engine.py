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
from google import genai
from google.genai import types
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

async def fetch_wiki_images(place_name: str, province_name: str) -> list[str]:
    """Uses Wikipedia API to find up to 3 original images for a place"""
    try:
        # Search for place + province for better context, or just place
        query = urllib.parse.quote(f"{place_name} {province_name}")
        url = f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={query}&gsrlimit=15&prop=pageimages&piprop=original&format=json"
        
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers={'User-Agent': 'CamTechBlog/1.0'})
            if res.status_code == 200:
                data = res.json()
                pages = data.get('query', {}).get('pages', {})
                urls = []
                for page_id, page_data in pages.items():
                    if 'original' in page_data:
                        urls.append(page_data['original']['source'])
                return urls
    except Exception as e:
        logger.warning(f"Wiki image fetch failed for {place_name}: {e}")
    return []



# All 25 provinces/cities of Cambodia
CAMBODIA_PROVINCES = [
    {"name": "Phnom Penh", "name_km": "ភ្នំពេញ", "slug": "phnom-penh"},
    {"name": "Siem Reap", "name_km": "សៀមរាប", "slug": "siem-reap"},
    {"name": "Sihanoukville", "name_km": "ក្រុងព្រះសីហនុ", "slug": "sihanoukville"},
    {"name": "Battambang", "name_km": "បាត់ដំបង", "slug": "battambang"},
    {"name": "Kampot", "name_km": "កំពត", "slug": "kampot"},
    {"name": "Kep", "name_km": "កែប", "slug": "kep"},
    {"name": "Kratie", "name_km": "ក្រចេះ", "slug": "kratie"},
    {"name": "Mondulkiri", "name_km": "មណ្ឌលគិរី", "slug": "mondulkiri"},
    {"name": "Ratanakiri", "name_km": "រតនគិរី", "slug": "ratanakiri"},
    {"name": "Stung Treng", "name_km": "ស្ទឹងត្រែង", "slug": "stung-treng"},
    {"name": "Pursat", "name_km": "ពោធិ៍សាត់", "slug": "pursat"},
    {"name": "Kampong Cham", "name_km": "កំពង់ចាម", "slug": "kampong-cham"},
    {"name": "Kampong Chhnang", "name_km": "កំពង់ឆ្នាំង", "slug": "kampong-chhnang"},
    {"name": "Kampong Speu", "name_km": "កំពង់ស្ពឺ", "slug": "kampong-speu"},
    {"name": "Kampong Thom", "name_km": "កំពង់ធំ", "slug": "kampong-thom"},
    {"name": "Kandal", "name_km": "កណ្តាល", "slug": "kandal"},
    {"name": "Koh Kong", "name_km": "កោះកុង", "slug": "koh-kong"},
    {"name": "Preah Vihear", "name_km": "ព្រះវិហារ", "slug": "preah-vihear"},
    {"name": "Prey Veng", "name_km": "ព្រៃវែង", "slug": "prey-veng"},
    {"name": "Svay Rieng", "name_km": "ស្វាយរៀង", "slug": "svay-rieng"},
    {"name": "Takeo", "name_km": "តាកែវ", "slug": "takeo"},
    {"name": "Banteay Meanchey", "name_km": "បន្ទាយមានជ័យ", "slug": "banteay-meanchey"},
    {"name": "Oddar Meanchey", "name_km": "ឧត្ដរមានជ័យ", "slug": "oddar-meanchey"},
    {"name": "Pailin", "name_km": "ប៉ៃលិន", "slug": "pailin"},
    {"name": "Tboung Khmum", "name_km": "ត្បូងឃ្មុំ", "slug": "tboung-khmum"},
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
            logger.info("Created Cambodia country record.")
            
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

        # Ensure all 25 destinations exist
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
                    is_featured=prov["slug"] in ["phnom-penh", "siem-reap", "sihanoukville", "battambang", "kampot"],
                    status="ACTIVE"
                )
                db.add(dest)
                created_count += 1
        
        if created_count > 0:
            db.commit()
            logger.info(f"Created {created_count} new destination records.")

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
Please find 5-8 NEW places that are NOT already in the database.

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
                processed_places.append(p)

            # Fetch images from Wikipedia for all valid places concurrently
            async def populate_image(p_data):
                if p_data.get("is_duplicate"):
                    return p_data
                img_urls = await fetch_wiki_images(p_data.get("name", ""), destination.name)
                if img_urls:
                    # Backup to drive
                    await storage_service.upload_file_from_url(img_urls[0], f"Destinations/{destination.name}")
                    # Upload to R2/S3 for display
                    hero_r2_url = await s3_service.upload_file_from_url(img_urls[0], f"Destinations/{destination.name}")
                    p_data["hero_image_url"] = hero_r2_url if hero_r2_url else img_urls[0]
                    
                    gallery = []
                    for url in img_urls:
                        # Backup to drive
                        await storage_service.upload_file_from_url(url, f"Destinations/{destination.name}")
                        # Upload to R2/S3 for display
                        r2_url = await s3_service.upload_file_from_url(url, f"Destinations/{destination.name}")
                        gallery.append(r2_url if r2_url else url)
                    p_data["gallery_json"] = json.dumps(gallery)
                return p_data
            
            places_with_images = await asyncio.gather(*(populate_image(p) for p in processed_places))

            # Automatically save discovered places to the database (Background Task)
            inserted_count = 0
            for place_data in places_with_images:
                if not place_data.get("is_duplicate"):
                    try:
                        await self.save_approved_place(place_data)
                        inserted_count += 1
                    except Exception as e:
                        logger.error(f"Failed to auto-save discovered place {place_data.get('name')}: {e}")

            return {
                "province": destination.name,
                "province_slug": destination.slug,
                "discovered": len(places_with_images),
                "inserted": inserted_count,
                "places_data": places_with_images
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
                
            # Assign explicitly extracted Real You.com images instead of hallucinated ones
            hero_url = None
            gallery_raw = []
            if extracted_images:
                hero_url = extracted_images[0]
                gallery_raw = extracted_images[1:]
            else:
                # Fallback to AI generated if no You.com search data
                hero_url = ai_data.get("hero_image_url")
                gallery_raw = ai_data.get("gallery_urls") or []
                
            if hero_url:
                # Backup to drive
                await storage_service.upload_file_from_url(hero_url, f"Destinations/{destination.name}")
                # Upload to S3/R2 for display
                r2_url = await s3_service.upload_file_from_url(hero_url, f"Destinations/{destination.name}")
                place.hero_image_url = r2_url if r2_url else hero_url
                
            if gallery_raw and isinstance(gallery_raw, list):
                gallery = []
                for url in gallery_raw:
                    # Backup to drive
                    await storage_service.upload_file_from_url(url, f"Destinations/{destination.name}")
                    # Upload to S3/R2 for display
                    r2_url = await s3_service.upload_file_from_url(url, f"Destinations/{destination.name}")
                    gallery.append(r2_url if r2_url else url)
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
                hero_image_url=place_dict.get("hero_image_url"),
                gallery_json=place_dict.get("gallery_json", "[]"),
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
