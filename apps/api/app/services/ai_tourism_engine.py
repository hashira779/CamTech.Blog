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

logger = logging.getLogger(__name__)

async def fetch_wiki_image(place_name: str, province_name: str) -> str | None:
    """Uses Wikipedia REST API to find a thumbnail image for a place"""
    try:
        # Try specific search first
        query = urllib.parse.quote(f"{place_name} {province_name}")
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://en.wikipedia.org/w/rest.php/v1/search/page?q={query}&limit=1")
            if res.status_code == 200:
                pages = res.json().get('pages', [])
                if pages and pages[0].get('thumbnail'):
                    # Wikipedia thumbnails are usually small (320px). We can replace to get original or larger.
                    thumb_url = pages[0]['thumbnail']['url']
                    return thumb_url.replace('/thumb/', '/').split('.jpg/')[0] + '.jpg'
    except Exception as e:
        logger.warning(f"Wiki image fetch failed for {place_name}: {e}")
    return None


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

            # Fallback model chain — if one is overloaded (503), try the next
            fallback_models = [
                settings.AI_MODEL_NAME or 'gemini-3.8-flash',
                'gemini-3.5-flash',
                'gemini-2.5-flash',
                'gemini-2.5-pro',
            ]

            response = None
            last_error = None
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
                    logger.info(f"Success with model: {model_to_try}")
                    break  # Success! Stop trying
                except Exception as model_err:
                    last_error = model_err
                    error_msg = str(model_err)
                    if "503" in error_msg or "UNAVAILABLE" in error_msg or "overloaded" in error_msg.lower():
                        logger.warning(f"Model {model_to_try} is overloaded, trying next...")
                        continue
                    elif "404" in error_msg or "NOT_FOUND" in error_msg:
                        logger.warning(f"Model {model_to_try} not found, trying next...")
                        continue
                    else:
                        raise model_err  # Non-recoverable error

            if response is None:
                raise last_error or Exception("All AI models are currently unavailable. Please try again later.")

            # Parse response
            try:
                places_data = json.loads(response.text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response.text, re.DOTALL)
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
                img_url = await fetch_wiki_image(p_data.get("name", ""), destination.name)
                if img_url:
                    p_data["hero_image_url"] = img_url
                return p_data
            
            places_with_images = await asyncio.gather(*(populate_image(p) for p in processed_places))

            # Return raw data for approval instead of saving
            return {
                "province": destination.name,
                "province_slug": destination.slug,
                "discovered": len(places_with_images),
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

            client = self._get_gemini_client(db)
            
            prompt = f"""You are an expert Cambodia travel researcher.
I have a place in my database named "{place.name}" located in {destination.name} Province, Cambodia.
The current data might be fake, placeholder, or incomplete. 
Please research the REAL "{place.name}" and provide accurate information.

Return a JSON object with these keys ONLY:
- name: English name
- local_name: Khmer name (or null)  
- place_type: One of ATTRACTION, TEMPLE, RESTAURANT, CAFE, MARKET, MUSEUM, WATERFALL, HOTEL, RESORT, ACTIVITY, HIDDEN_GEM
- description: 2-3 sentence accurate description in English
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
            fallback_models = [
                settings.AI_MODEL_NAME or 'gemini-3.8-flash',
                'gemini-3.5-flash',
                'gemini-2.5-flash',
                'gemini-2.5-pro',
            ]

            response = None
            last_error = None
            for model_to_try in fallback_models:
                try:
                    response = client.models.generate_content(
                        model=model_to_try,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.2,
                            response_mime_type="application/json"
                        )
                    )
                    break
                except Exception as model_err:
                    last_error = model_err
                    error_msg = str(model_err)
                    if "503" in error_msg or "UNAVAILABLE" in error_msg or "overloaded" in error_msg.lower() or "404" in error_msg:
                        continue
                    else:
                        raise model_err
            
            if response is None:
                raise last_error or Exception("All AI models are currently unavailable.")

            try:
                ai_data = json.loads(response.text)
            except json.JSONDecodeError:
                match = re.search(r'```(?:json)?\n(.*?)\n```', response.text, re.DOTALL)
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

            place.verification_status = "AI_UPDATED"
            
            db.commit()

            # Now fetch image asynchronously
            img_url = await fetch_wiki_image(place.name, destination.name)
            if img_url:
                place.hero_image_url = img_url
                db.commit()

            return {"status": "success", "message": f"Updated {place.name} successfully."}

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update place via AI: {e}")
            return {"status": "failed", "message": str(e)}
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
