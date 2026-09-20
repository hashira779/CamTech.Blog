from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.guide_event import TravelGuide, Event
from app.models.location import Destination

class GuideService:
    def __init__(self, db: Session):
        self.db = db

    def get_guides(self, destination_slug: Optional[str] = None) -> List[TravelGuide]:
        """Fetch published travel guides, optionally filtered by destination."""
        query = self.db.query(TravelGuide).options(
            joinedload(TravelGuide.destination),
            joinedload(TravelGuide.author)
        ).filter(TravelGuide.status == "PUBLISHED")

        if destination_slug:
            dest = self.db.query(Destination).filter(Destination.slug == destination_slug).first()
            if dest:
                query = query.filter(TravelGuide.destination_id == dest.id)

        return query.order_by(TravelGuide.published_at.desc()).all()

    def get_guide_by_slug(self, slug: str) -> Optional[TravelGuide]:
        """Fetch single travel guide by slug."""
        return self.db.query(TravelGuide).options(
            joinedload(TravelGuide.destination),
            joinedload(TravelGuide.author)
        ).filter(
            TravelGuide.slug == slug,
            TravelGuide.status == "PUBLISHED"
        ).first()

    def get_events(self, destination_slug: Optional[str] = None) -> List[Event]:
        """Fetch active cultural and travel events."""
        query = self.db.query(Event).options(
            joinedload(Event.destination)
        ).filter(Event.status == "ACTIVE")

        if destination_slug:
            dest = self.db.query(Destination).filter(Destination.slug == destination_slug).first()
            if dest:
                query = query.filter(Event.destination_id == dest.id)

        return query.order_by(Event.start_date.asc()).all()
