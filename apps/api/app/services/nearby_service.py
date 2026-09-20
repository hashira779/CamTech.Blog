import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.place import Place

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great circle distance between two points on earth in kilometers."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)

class NearbyService:
    def __init__(self, db: Session):
        self.db = db

    def search_nearby_coordinates(
        self,
        lat: float,
        lng: float,
        radius_km: float = 10.0,
        place_type: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Find places within radius_km of coordinates (lat, lng), sorted by distance.
        Calculates estimated walking time (~4.5 km/h) and driving time (~30 km/h).
        """
        query = self.db.query(Place).options(
            joinedload(Place.destination),
            joinedload(Place.accommodation)
        ).filter(Place.status == "ACTIVE")

        if place_type:
            query = query.filter(Place.place_type == place_type.upper())

        places = query.all()
        results = []

        for p in places:
            dist = haversine_km(lat, lng, p.latitude, p.longitude)
            if dist <= radius_km:
                walk_mins = max(1, round((dist / 4.5) * 60))
                drive_mins = max(1, round((dist / 30.0) * 60))
                results.append({
                    "place": p,
                    "distance_km": dist,
                    "estimated_walk_minutes": walk_mins,
                    "estimated_drive_minutes": drive_mins
                })

        # Sort nearest first
        results.sort(key=lambda item: item["distance_km"])
        return results[:limit]

    def search_nearby_place(
        self,
        place_slug: str,
        radius_km: float = 10.0,
        place_type: Optional[str] = None,
        limit: int = 20
    ) -> Optional[Dict[str, Any]]:
        """
        Find all places near a specific landmark/attraction (e.g. Angkor Wat).
        """
        ref_place = self.db.query(Place).filter(Place.slug == place_slug).first()
        if not ref_place:
            return None

        nearby_items = self.search_nearby_coordinates(
            lat=ref_place.latitude,
            lng=ref_place.longitude,
            radius_km=radius_km,
            place_type=place_type,
            limit=limit + 1  # Fetch one extra to filter out the reference place itself
        )

        # Exclude self
        filtered = [item for item in nearby_items if item["place"].id != ref_place.id][:limit]

        return {
            "reference_name": ref_place.name,
            "reference_lat": ref_place.latitude,
            "reference_lng": ref_place.longitude,
            "radius_km": radius_km,
            "total": len(filtered),
            "results": filtered
        }
