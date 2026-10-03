"""
AI Tourism Engine — Automatic discovery of tourist places across all 25 provinces of Cambodia.
Uses Google Gemini AI to research, generate, and insert real tourist places into the database.
Designed to run once per week via APScheduler.
"""
import json
import uuid
import re
import logging
from datetime import datetime, timezone
from google import genai
from google.genai import types
from app.common.config import settings
from app.common.database import SessionLocal
from app.models.location import Country, Destination
from app.models.place import Place
from app.models.audit import SiteSetting

logger = logging.getLogger(__name__)

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

            model_name = settings.AI_MODEL_NAME or 'gemini-2.0-flash'

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

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    response_mime_type="application/json"
                )
            )

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

            # Insert places into database
            inserted = []
            skipped = []
            for p in places_data:
                name = p.get("name", "").strip()
                if not name:
                    continue

                # Check for duplicates
                existing = db.query(Place).filter(
                    Place.destination_id == destination.id,
                    Place.name == name
                ).first()
                if existing:
                    skipped.append(name)
                    continue

                base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
                slug = f"{base_slug}-{uuid.uuid4().hex[:4]}"

                # Check slug uniqueness
                while db.query(Place).filter(Place.slug == slug).first():
                    slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

                new_place = Place(
                    destination_id=destination.id,
                    name=name,
                    local_name=p.get("local_name"),
                    slug=slug,
                    place_type=p.get("place_type", "ATTRACTION"),
                    description=p.get("description", f"A tourist place in {destination.name}."),
                    description_km=p.get("description_km"),
                    address=p.get("address"),
                    latitude=p.get("latitude"),
                    longitude=p.get("longitude"),
                    opening_hours=p.get("opening_hours"),
                    price_level=p.get("price_level", "$$"),
                    phone=p.get("phone"),
                    website=p.get("website"),
                    tags_json=json.dumps(p.get("tags", [])),
                    rating=p.get("rating", 4.5),
                    verification_status="AI_GENERATED",
                    status="ACTIVE",
                    is_featured=False
                )
                db.add(new_place)
                inserted.append(name)

            db.commit()

            return {
                "province": destination.name,
                "inserted": len(inserted),
                "skipped": len(skipped),
                "places": inserted,
                "skipped_names": skipped
            }

        except Exception as e:
            db.rollback()
            logger.error(f"AI Tourism Engine error for {province_slug}: {e}")
            raise e
        finally:
            db.close()

    async def run_full_scan(self) -> dict:
        """
        Run a full scan across ALL 25 provinces.
        This is the main entry point for the weekly cron job.
        """
        db = SessionLocal()
        try:
            self._ensure_cambodia_destinations(db)
        finally:
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


ai_tourism_engine = AITourismEngine()
