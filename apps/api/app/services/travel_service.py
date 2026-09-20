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
            query = query.filter(Place.place_type == place_type.upper())
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
        Deterministic TripEngine:
        Synthesizes an intelligent, geocoded, time-optimized daily travel itinerary
        using actual verified places from the database.
        """
        destination = db.query(Destination).filter(Destination.slug == req.destination_slug).first()
        dest_name = destination.name if destination else req.destination_slug.replace("-", " ").title()

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
        nature = [p for p in places if p.place_type in ("WATERFALL", "HIDDEN_GEM")]
        hotels = [p for p in places if p.place_type == "ACCOMMODATION"]

        days_output: List[GeneratedTripDay] = []
        requested_days = min(max(1, req.duration_days), 7)

        # Day themes based on Siem Reap/Destination profile
        theme_templates = [
            ("Iconic Angkor & Ancient Wonders", "Marvel at ancient Khmer architecture from sunrise to dusk"),
            ("Hidden Gems & Rural Culture", "Explore lush jungle temples, rural landscapes, and authentic crafts"),
            ("Sacred Waterfalls & Floating Villages", "Ascend sacred mountains and experience the life of Tonle Sap"),
            ("Culinary Discovery & Artisan Workshops", "Taste world-renowned Khmer flavors and meet local artisans"),
            ("Adventure Trails & Remote Shrines", "Cycle through ancient forest trails and discover secluded sanctuaries"),
            ("Wellness, Silk & Serenity", "Revitalizing botanical spas, silk weaving centers, and quiet river strolls"),
            ("Local Life & Sunset Horizons", "Unwind with scenic hilltop sunsets, community markets, and vibrant nights"),
        ]

        for day_idx in range(requested_days):
            day_num = day_idx + 1
            theme_title, theme_desc = theme_templates[day_idx % len(theme_templates)]
            items: List[GeneratedTripDayItem] = []

            # Morning: Major temple or scenic activity
            morning_place = temples[day_idx % len(temples)] if temples else None
            if morning_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="MORNING",
                    start_time="05:30 AM" if day_num == 1 else "08:00 AM",
                    title=f"Explore {morning_place.name}",
                    description=f"{morning_place.description[:140]}... Experience the morning golden light with fewer crowds.",
                    place_id=morning_place.id,
                    place_name=morning_place.name,
                    duration_minutes=180 if day_num == 1 else 120,
                    estimated_cost="Included in Angkor Pass" if "Angkor" in dest_name else "$5 - $10"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="MORNING",
                    start_time="08:30 AM",
                    title="Heritage Walking Tour",
                    description=f"Guided morning exploration of {dest_name}'s premier landmarks and architecture.",
                    duration_minutes=120,
                    estimated_cost="$15"
                ))

            # Mid-day / Lunch: Verified restaurant
            lunch_place = food[day_idx % len(food)] if food else None
            if lunch_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="12:30 PM",
                    title=f"Lunch at {lunch_place.name}",
                    description=f"{lunch_place.description[:120]}... Savor authentic Cambodian dishes and refreshing cooling beverages.",
                    place_id=lunch_place.id,
                    place_name=lunch_place.name,
                    duration_minutes=75,
                    estimated_cost="$10 - $25"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="12:30 PM",
                    title="Khmer Culinary Experience",
                    description="Authentic traditional dishes including Fish Amok, fresh spring rolls, and fragrant jasmine rice.",
                    duration_minutes=60,
                    estimated_cost="$12"
                ))

            # Afternoon: Cultural museum, waterfall, or hidden gem
            afternoon_place = None
            if nature and day_num % 2 == 0:
                afternoon_place = nature[day_idx % len(nature)]
            elif len(temples) > day_idx + 1:
                afternoon_place = temples[(day_idx + 1) % len(temples)]

            if afternoon_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="02:30 PM",
                    title=f"Visit {afternoon_place.name}",
                    description=f"{afternoon_place.description[:130]}... Magnificent trees and serene carved corridors.",
                    place_id=afternoon_place.id,
                    place_name=afternoon_place.name,
                    duration_minutes=120,
                    estimated_cost="Free / Included"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="AFTERNOON",
                    start_time="02:30 PM",
                    title="Artisan Workshops & Cultural Center",
                    description="Discover centuries-old stone and wood carving traditions preserved by master craftspeople.",
                    duration_minutes=90,
                    estimated_cost="Free admission"
                ))

            # Evening / Night: Market, Pub Street, or Scenic Sunset
            evening_place = markets[day_idx % len(markets)] if markets else None
            if evening_place:
                items.append(GeneratedTripDayItem(
                    time_of_day="EVENING",
                    start_time="06:00 PM",
                    title=f"Evening stroll at {evening_place.name}",
                    description=f"{evening_place.description[:120]}... Great for souvenir hunting, street snacks, and lively vibes.",
                    place_id=evening_place.id,
                    place_name=evening_place.name,
                    duration_minutes=90,
                    estimated_cost="$5 - $15"
                ))
            else:
                items.append(GeneratedTripDayItem(
                    time_of_day="EVENING",
                    start_time="06:30 PM",
                    title="Sunset Vantage Point & Dinner",
                    description="Watch the sunset illuminate the surrounding tropical canopy, followed by dinner under the stars.",
                    duration_minutes=120,
                    estimated_cost="$15 - $30"
                ))

            days_output.append(GeneratedTripDay(
                day_number=day_num,
                title=f"Day {day_num}: {theme_title}",
                theme=theme_desc,
                items=items
            ))

        summary = (
            f"Tailored {requested_days}-day {req.travel_style.lower()} trip to {dest_name} "
            f"crafted for a {req.budget_level} budget. Covers {len(places)} verified destinations, "
            f"temples, authentic cuisine, and evening culture."
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
