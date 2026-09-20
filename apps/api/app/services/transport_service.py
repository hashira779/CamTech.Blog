from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.transport import TransportOperator, TransportHub, TransportRoute, TransportStop, TransportSchedule
from app.models.location import Destination

class TransportService:
    def __init__(self, db: Session):
        self.db = db

    def search_routes(
        self,
        origin_slug_or_name: str,
        dest_slug_or_name: str,
        transport_type: Optional[str] = None
    ) -> List[TransportRoute]:
        """
        Search verified transport routes between two destinations (by slug or name match).
        Loads operator, hubs, and active schedules.
        """
        origin_q = self.db.query(Destination).filter(
            (Destination.slug == origin_slug_or_name.lower()) |
            (Destination.name.ilike(f"%{origin_slug_or_name}%"))
        ).first()

        dest_q = self.db.query(Destination).filter(
            (Destination.slug == dest_slug_or_name.lower()) |
            (Destination.name.ilike(f"%{dest_slug_or_name}%"))
        ).first()

        query = self.db.query(TransportRoute).options(
            joinedload(TransportRoute.operator),
            joinedload(TransportRoute.origin_hub),
            joinedload(TransportRoute.destination_hub),
            joinedload(TransportRoute.schedules),
            joinedload(TransportRoute.stops)
        ).filter(TransportRoute.status == "ACTIVE")

        if origin_q and dest_q:
            query = query.filter(
                TransportRoute.origin_destination_id == origin_q.id,
                TransportRoute.destination_id == dest_q.id
            )
        else:
            # Fallback search by route name matching both keywords
            query = query.filter(
                TransportRoute.name.ilike(f"%{origin_slug_or_name}%"),
                TransportRoute.name.ilike(f"%{dest_slug_or_name}%")
            )

        if transport_type:
            query = query.filter(TransportRoute.transport_type == transport_type.upper())

        return query.all()

    def get_operators(self, operator_type: Optional[str] = None) -> List[TransportOperator]:
        """Fetch all verified transport operators, optionally filtered by type (BUS, MINIVAN, etc.)."""
        query = self.db.query(TransportOperator).filter(TransportOperator.status == "ACTIVE")
        if operator_type:
            query = query.filter(TransportOperator.operator_type == operator_type.upper())
        return query.order_by(TransportOperator.rating.desc(), TransportOperator.name.asc()).all()

    def get_operator_by_slug(self, slug: str) -> Optional[TransportOperator]:
        """Fetch a single transport operator by slug with all active routes and schedules."""
        return self.db.query(TransportOperator).options(
            joinedload(TransportOperator.routes).joinedload(TransportRoute.schedules),
            joinedload(TransportOperator.routes).joinedload(TransportRoute.origin_hub),
            joinedload(TransportOperator.routes).joinedload(TransportRoute.destination_hub)
        ).filter(
            TransportOperator.slug == slug,
            TransportOperator.status == "ACTIVE"
        ).first()

    def get_hubs(self, destination_id: Optional[str] = None, hub_type: Optional[str] = None) -> List[TransportHub]:
        """Fetch transport hubs (bus terminals, airports, train stations, ferry ports)."""
        query = self.db.query(TransportHub).filter(TransportHub.status == "ACTIVE")
        if destination_id:
            query = query.filter(TransportHub.destination_id == destination_id)
        if hub_type:
            query = query.filter(TransportHub.hub_type == hub_type.upper())
        return query.order_by(TransportHub.name.asc()).all()

    def get_routes_for_destination(self, destination_id: str) -> List[TransportRoute]:
        """Fetch all routes arriving at or departing from a specific destination."""
        return self.db.query(TransportRoute).options(
            joinedload(TransportRoute.operator),
            joinedload(TransportRoute.schedules),
            joinedload(TransportRoute.origin_hub),
            joinedload(TransportRoute.destination_hub)
        ).filter(
            (TransportRoute.destination_id == destination_id) |
            (TransportRoute.origin_destination_id == destination_id),
            TransportRoute.status == "ACTIVE"
        ).all()
