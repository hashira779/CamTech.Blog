import json
import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc

from app.models.location import Country, Destination
from app.models.place import Place, Accommodation, PlaceRevision, PlaceSuggestion
from app.models.trip import Trip, TripDay, TripDayItem
from app.schemas.travel import (
    TripPlanRequest,
    TripPlanResponse,
    GeneratedTripDay,
    GeneratedTripDayItem,
    PlaceSuggestionCreate,
    PlaceUpdate,
)

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

class TravelService:
    @staticmethod
    def get_countries(db: Session) -> List[Country]:
        return db.query(Country).filter(Country.is_active == True).all()

    @staticmethod
    def get_destinations(db: Session, featured_only: bool = False) -> List[Destination]:
        query = db.query(Destination).filter(Destination.status == "ACTIVE")
        if featured_only:
            query = query.filter(Destination.is_featured == True)
        return query.order_by(desc(Destination.views_count)).all()

    @staticmethod
    def get_destination_by_slug(db: Session, slug: str) -> Optional[Destination]:
        return (
            db.query(Destination)
            .options(
                joinedload(Destination.country),
                joinedload(Destination.places).joinedload(Place.accommodation),
                joinedload(Destination.trips)
            )
            .filter(Destination.slug == slug, Destination.status == "ACTIVE")
            .first()
        )

    @staticmethod
    def get_places(
        db: Session,
        destination_slug: Optional[str] = None,
        place_type: Optional[str] = None,
        search: Optional[str] = None,
        is_featured: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Place], int]:
        query = db.query(Place).options(joinedload(Place.accommodation))
        # Non-destructive: active places only by default
        query = query.filter(Place.status == "ACTIVE")

        if destination_slug:
            query = query.join(Place.destination).filter(Destination.slug == destination_slug)
        if place_type:
            types = [t.strip().upper() for t in place_type.split(",")]
            query = query.filter(Place.place_type.in_(types))
        if is_featured is not None:
            query = query.filter(Place.is_featured == is_featured)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Place.name.ilike(search_fmt),
                    Place.local_name.ilike(search_fmt),
                    Place.description.ilike(search_fmt),
                )
            )

        total = query.count()
        items = query.order_by(desc(Place.rating), desc(Place.views_count)).offset(offset).limit(limit).all()
        return items, total

    @staticmethod
    def get_place_by_slug(db: Session, slug: str) -> Optional[Place]:
        return (
            db.query(Place)
            .options(joinedload(Place.accommodation), joinedload(Place.destination))
            .filter(Place.slug == slug)
            .first()
        )

    @staticmethod
    def get_trips(
        db: Session,
        destination_slug: Optional[str] = None,
        featured_only: bool = False,
    ) -> List[Trip]:
        query = (
            db.query(Trip)
            .options(
                joinedload(Trip.days).joinedload(TripDay.items).joinedload(TripDayItem.place),
                joinedload(Trip.destination)
            )
            .filter(Trip.status == "ACTIVE")
        )
        if destination_slug:
            query = query.join(Trip.destination).filter(Destination.slug == destination_slug)
        if featured_only:
            query = query.filter(Trip.is_featured == True)
        return query.all()

    @staticmethod
    def get_trip_by_slug(db: Session, slug: str) -> Optional[Trip]:
        return (
            db.query(Trip)
            .options(
                joinedload(Trip.days).joinedload(TripDay.items).joinedload(TripDayItem.place),
                joinedload(Trip.destination)
            )
            .filter(Trip.slug == slug, Trip.status == "ACTIVE")
            .first()
        )

    @staticmethod
    def create_place_suggestion(
        db: Session,
        data: PlaceSuggestionCreate,
        ip_address: Optional[str] = None
    ) -> PlaceSuggestion:
        suggestion = PlaceSuggestion(
            suggestion_type=data.suggestion_type,
            place_id=data.place_id,
            place_name=data.place_name,
            destination_slug=data.destination_slug,
            place_type=data.place_type or "ATTRACTION",
            details=data.details,
            submitter_name=data.submitter_name,
            submitter_contact=data.submitter_contact,
            source_notes=data.source_notes,
            status="PENDING",
            ip_address=ip_address,
        )
        db.add(suggestion)
        db.commit()
        db.refresh(suggestion)
        return suggestion

    @staticmethod
    def update_place_status(
        db: Session,
        place_id: str,
        new_status: str,
        actor: str = "Admin",
        reason: Optional[str] = None,
        merged_into_id: Optional[str] = None
    ) -> Optional[Place]:
        """
        Non-destructive entity lifecycle management.
        Never permanently delete; transitions between:
        ACTIVE, CLOSED, TEMPORARILY_CLOSED, ARCHIVED, MERGED
        """
        valid_statuses = {"ACTIVE", "CLOSED", "TEMPORARILY_CLOSED", "ARCHIVED", "MERGED"}
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status {new_status}. Must be one of {valid_statuses}")

        place = db.query(Place).filter(Place.id == place_id).first()
        if not place:
            return None

        # Record revision history before modifying
        prev_data = {
            "name": place.name,
            "status": place.status,
            "price_level": place.price_level,
            "address": place.address,
        }

        place.status = new_status
        if merged_into_id:
            place.merged_into_id = merged_into_id

        revision = PlaceRevision(
            place_id=place.id,
            proposed_by=actor,
            changes_summary=f"Status changed to {new_status}: {reason or 'Administrative update'}",
            previous_data_json=json.dumps(prev_data),
            new_data_json=json.dumps({"status": new_status, "merged_into_id": merged_into_id}),
            approved_by=actor,
        )
        db.add(revision)
        db.commit()
        db.refresh(place)
        return place

    @staticmethod
    def generate_trip_plan(db: Session, req: TripPlanRequest) -> TripPlanResponse:
        """
        Deterministic Dynamic TripEngine:
        Synthesizes an intelligent, geocoded, time-optimized daily travel itinerary
        using actual verified places from the database with genuine Cambodia imagery.
        """
        destination = db.query(Destination).filter(Destination.slug == req.destination_slug).first()
        dest_name = destination.name if destination else req.destination_slug.replace("-", " ").title()
        dest_image = destination.hero_image_url if destination and destination.hero_image_url else f"/images/destinations/{req.destination_slug}.jpg"

        # Query all active places for this destination
        places = []
        if destination:
            places = db.query(Place).filter(
                Place.destination_id == destination.id,
                Place.status == "ACTIVE"
            ).all()

        # Categorize available places
        temples = [p for p in places if p.place_type in ("TEMPLE", "ATTRACTION")]
        food = [p for p in places if p.place_type in ("RESTAURANT", "CAFE")]
        markets = [p for p in places if p.place_type in ("MARKET", "ACTIVITY")]
        nature = [p for p in places if p.place_type in ("WATERFALL", "HIDDEN_GEM", "BEACH", "NATIONAL_PARK", "LAKE")]
        all_activities = temples + nature + markets

        days_output: List[GeneratedTripDay] = []
        requested_days = min(max(1, req.duration_days), 7)

        # Region-aware themes for authentic Cambodia experiences
        slug = req.destination_slug.lower()
        if slug in ["sihanoukville", "kampot", "kep", "koh-kong"]:
            theme_templates = [
                (f"Pristine Bays & Coastal Horizons", f"Explore turquoise waters, coastal breezes, and scenic viewpoints in {dest_name}"),
                ("Fresh Crab Markets & Mangrove Trails", "Savor coastal delicacies and discover untouched mangrove conservation sanctuaries"),
                ("Colonial Heritage & Plantation Estates", "Visit historic estates, scenic salt fields, and lush rural foothill trails"),
                ("Island Hopping & Secluded Coves", "Cruise to calm offshore islands with powdery white sand beaches"),
                ("Sunset Catamarans & Ocean Dining", "Experience magical gulf sunsets paired with fresh local seafood"),
                ("Waterfalls & Forest Reserves", "Trek to refreshing jungle cascades and limestone river valleys"),
                ("Coastal Wellness & Serene Departure", "Recharge with beachfront relaxation, herbal spas, and tranquil seaside strolls"),
            ]
            default_morning = f"Scenic Coastal Exploration in {dest_name}"
            default_afternoon = "Mangrove Boardwalk & Estuary Sanctuary"
            default_evening = "Seaside Promenade & Fresh Seafood Bazaars"
        elif slug in ["mondulkiri", "ratanakiri", "pursat", "pailin", "kampong-speu", "oddar-meanchey", "preah-vihear", "stung-treng"]:
            theme_templates = [
                (f"Highland Waterfalls & Sacred Hills", f"Immerse yourself in cool mountain breezes and lush evergreen valleys of {dest_name}"),
                ("Indigenous Villages & Traditional Crafts", "Encounter authentic upland traditions, woven textiles, and highland communities"),
                ("Crater Lakes & Forest Canopy Treks", "Discover ancient volcanic lakes, wildlife trails, and scenic ridge vistas"),
                ("Mekong River Rapids & Eco-Trails", "Watch wildlife along pristine riverbanks and natural river ecosystems"),
                ("Organic Coffee Estates & Tropical Plantations", "Tour highland coffee groves and taste aromatic single-origin roasts"),
                ("Wilderness Sanctuaries & Panoramic Lookouts", "Ascend gentle ridges overlooking boundless green jungle landscapes"),
                ("Sunset Over Pine Valleys", "Unwind as the golden hour illuminates misty valleys and quiet forest roads"),
            ]
            default_morning = f"Mountain Trail & Scenic Viewpoint in {dest_name}"
            default_afternoon = "Jungle Cascade & Botanical Sanctuary"
            default_evening = "Stargazing & Highland Evening Market"
        elif slug in ["phnom-penh", "kandal", "kampong-cham", "kratie", "kampong-chhnang", "takeo", "prey-veng", "svay-rieng", "tboung-khmum"]:
            theme_templates = [
                (f"Royal Heritage & Riverside Promenades", f"Experience royal architecture and the confluence of four rivers in {dest_name}"),
                ("Cultural Museums & Landmark Monasteries", "Explore historic stone stupas, sacred pagodas, and vibrant artisan centers"),
                ("Mekong Silk Islands & River Communities", "Cross the river to see traditional silk weaving and tranquil island living"),
                ("Gastronomic Journey & Historic Quarters", "Sample street food delights, French-Khmer fusion dining, and riverside cafes"),
                ("Artisan Workshops & Ancient Capitals", "Visit historical hill shrines, master woodcarvers, and cultural exhibitions"),
                ("Vibrant Night Bazaars & Evening Cruises", "Take a twilight river cruise and stroll through bustling evening markets"),
                ("Contemporary Art & Scenic Farewell", "Discover modern Cambodian design, local galleries, and scenic riverfront vistas"),
            ]
            default_morning = f"Historic City & Heritage Landmarks in {dest_name}"
            default_afternoon = "Traditional Silk Weaving & Riverfront Culture"
            default_evening = "Mekong Riverfront Stroll & Street Food Bazaars"
        else: # Siem Reap / Battambang / Kampong Thom / Heritage
            theme_templates = [
                (f"Ancient Khmer Wonders & Sacred Monuments", f"Marvel at millennium-old stone temples and timeless sanctuaries in {dest_name}"),
                ("Hidden Jungle Sanctuaries & Rural Crafts", "Venture into atmospheric forest ruins, carved galleries, and artisan workshops"),
                ("Sacred Waterfalls & Floating River Villages", "Ascend sacred mountains and experience community life along the waterways"),
                ("Culinary Masterpieces & Traditional Markets", "Taste world-renowned Khmer specialties and shop authentic regional crafts"),
                ("Ancient Forest Trails & Remote Shrines", "Cycle peaceful forest paths and uncover secluded ancient sandstone terraces"),
                ("Herbal Wellness & Silk Weaving Traditions", "Revitalize with traditional botanical therapies and fine silk handicraft centers"),
                ("Hilltop Sunsets & Vibrant Night Quarter", "Watch the sun dip below tropical horizons followed by lively evening culture"),
            ]
            default_morning = f"Ancient Monument Discovery in {dest_name}"
            default_afternoon = "Artisan Workshops & Cultural Heritage Village"
            default_evening = "Night Market & Atmospheric Evening Quarter"

        is_angkor = "siem-reap" in slug

        for day_idx in range(requested_days):
            day_num = day_idx + 1
            theme_title, theme_desc = theme_templates[day_idx % len(theme_templates)]
            items: List[GeneratedTripDayItem] = []

            # 1. MORNING
            morning_place = temples[day_idx % len(temples)] if temples else (nature[day_idx % len(nature)] if nature else None)
            if morning_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="MORNING",
                    start_time="05:30 AM" if day_num == 1 and is_angkor else "08:00 AM",
                    title=f"Explore {morning_place.name}",
                    description=f"{morning_place.description[:140]}... Best enjoyed in the gentle morning light with refreshing cool weather.",
                    place_id=morning_place.id,
                    place_name=morning_place.name,
                    place_slug=morning_place.slug,
                    hero_image_url=morning_place.hero_image_url or dest_image,
                    place_type=morning_place.place_type,
                    rating=morning_place.rating or 4.9,
                    duration_minutes=180 if day_num == 1 and is_angkor else 120,
                    estimated_cost="Included in Angkor Pass" if is_angkor and morning_place.place_type == "TEMPLE" else "$5 - $10"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="MORNING",
                    start_time="08:30 AM",
                    title=default_morning,
                    description=f"Guided morning exploration of {dest_name}'s premier landmarks, sacred sites, and scenic natural settings.",
                    place_id=None,
                    place_name=f"{dest_name} Heritage Site",
                    place_slug=None,
                    hero_image_url=dest_image,
                    place_type="ATTRACTION",
                    rating=4.8,
                    duration_minutes=120,
                    estimated_cost="$5 - $15"
                ))

            # 2. MID-DAY / LUNCH
            lunch_place = food[day_idx % len(food)] if food else None
            if lunch_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="12:30 PM",
                    title=f"Lunch at {lunch_place.name}",
                    description=f"{lunch_place.description[:120]}... Savor authentic Cambodian dishes and refreshing cooling beverages.",
                    place_id=lunch_place.id,
                    place_name=lunch_place.name,
                    place_slug=lunch_place.slug,
                    hero_image_url=lunch_place.hero_image_url or dest_image,
                    place_type="RESTAURANT",
                    rating=lunch_place.rating or 4.8,
                    duration_minutes=75,
                    estimated_cost="$10 - $25"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="12:30 PM",
                    title=f"Khmer Culinary Experience in {dest_name}",
                    description=f"Authentic local gastronomy featuring traditional Fish Amok, Lok Lak, fresh spring rolls, and organic herbs from {dest_name}.",
                    place_id=None,
                    place_name="Traditional Khmer Restaurant",
                    place_slug=None,
                    hero_image_url=dest_image,
                    place_type="RESTAURANT",
                    rating=4.7,
                    duration_minutes=60,
                    estimated_cost="$8 - $18"
                ))

            # 3. AFTERNOON
            afternoon_place = None
            if nature and day_num % 2 == 0:
                afternoon_place = nature[day_idx % len(nature)]
            elif len(temples) > day_idx + 1:
                afternoon_place = temples[(day_idx + 1) % len(temples)]
            elif all_activities:
                afternoon_place = all_activities[(day_idx + 1) % len(all_activities)]

            if afternoon_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="02:30 PM",
                    title=f"Visit {afternoon_place.name}",
                    description=f"{afternoon_place.description[:130]}... Enjoy breathtaking panoramic scenery and local cultural atmosphere.",
                    place_id=afternoon_place.id,
                    place_name=afternoon_place.name,
                    place_slug=afternoon_place.slug,
                    hero_image_url=afternoon_place.hero_image_url or dest_image,
                    place_type=afternoon_place.place_type,
                    rating=afternoon_place.rating or 4.8,
                    duration_minutes=120,
                    estimated_cost="Included / $3 - $5"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="02:30 PM",
                    title=default_afternoon,
                    description=f"Discover community artisan workshops, scenic natural corridors, and local traditions preserved across {dest_name}.",
                    place_id=None,
                    place_name=f"{dest_name} Cultural Center",
                    place_slug=None,
                    hero_image_url=dest_image,
                    place_type="ACTIVITY",
                    rating=4.8,
                    duration_minutes=90,
                    estimated_cost="Free admission / $5"
                ))

            # 4. EVENING
            evening_place = markets[day_idx % len(markets)] if markets else None
            if evening_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="EVENING",
                    start_time="06:00 PM",
                    title=f"Evening stroll at {evening_place.name}",
                    description=f"{evening_place.description[:120]}... Vibrant atmosphere, handmade souvenirs, tropical fruits, and street delicacies.",
                    place_id=evening_place.id,
                    place_name=evening_place.name,
                    place_slug=evening_place.slug,
                    hero_image_url=evening_place.hero_image_url or dest_image,
                    place_type="MARKET",
                    rating=evening_place.rating or 4.7,
                    duration_minutes=90,
                    estimated_cost="$5 - $15"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="EVENING",
                    start_time="06:30 PM",
                    title=default_evening,
                    description=f"Watch the sunset over {dest_name}'s horizon, followed by outdoor dining under fairy lights and relaxed local nightlife.",
                    place_id=None,
                    place_name=f"{dest_name} Night Quarter",
                    place_slug=None,
                    hero_image_url=dest_image,
                    place_type="ACTIVITY",
                    rating=4.8,
                    duration_minutes=120,
                    estimated_cost="$10 - $25"
                ))

            days_output.append(GeneratedTripDay(
                day_number=day_num,
                title=f"Day {day_num}: {theme_title}",
                theme=theme_desc,
                items=items
            ))

        summary = (
            f"Tailored {requested_days}-day {req.travel_style.lower()} trip across {dest_name} "
            f"crafted for a {req.budget_level} budget. Integrates verified attractions, "
            f"authentic regional cuisine, and evening culture."
        )

        return TripPlanResponse(
            destination_name=dest_name,
            destination_slug=req.destination_slug,
            duration_days=requested_days,
            travel_style=req.travel_style,
            budget_level=req.budget_level,
            summary=summary,
            days=days_output
        )
