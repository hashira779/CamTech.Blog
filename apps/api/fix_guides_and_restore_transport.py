import os
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.common.database import SessionLocal
from app.models.transport import TransportOperator, TransportHub, TransportRoute, TransportSchedule, TransportStop
from app.models.guide_event import TravelGuide

def run_fix():
    db = SessionLocal()
    try:
        # 1. FIX GUIDES IMAGES
        angkor_guide = db.query(TravelGuide).filter(TravelGuide.slug == 'angkor-wat-sunrise-guide').first()
        if angkor_guide:
            angkor_guide.hero_image_url = "/images/places/angkor-wat.jpg"
            
        pp_sr_guide = db.query(TravelGuide).filter(TravelGuide.slug == 'phnom-penh-to-siem-reap-travel-guide').first()
        if pp_sr_guide:
            pp_sr_guide.hero_image_url = "/images/destinations/phnom-penh.jpg"
            
        db.commit()
        print("Fixed travel guide images.")

        # 2. RESTORE TRANSPORT DATA
        pp_dest_id = "b0166d07-8aaf-4bb9-a6b3-3a6d088a1728"
        sr_dest_id = "df12cb4a-4fbe-4b40-83a3-bb1eabc9aa1c"

        # Giant Ibis
        op_giant = TransportOperator(
            id=str(uuid.uuid4()), name="Giant Ibis Transport", slug="giant-ibis", operator_type="BUS",
            logo_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80",
            description="Premium bus service.", phone="+855 23 999 999", verification_status="VERIFIED", rating=4.9, review_count=348
        )
        # Larryta
        op_larryta = TransportOperator(
            id=str(uuid.uuid4()), name="Larryta Express", slug="larryta-express", operator_type="MINIVAN",
            logo_url="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=200&q=80",
            description="Fast minivan.", phone="+855 23 888 888", verification_status="VERIFIED", rating=4.8, review_count=215
        )
        # Virak Buntham
        op_vet = TransportOperator(
            id=str(uuid.uuid4()), name="Virak Buntham", slug="virak-buntham", operator_type="BUS",
            logo_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80",
            description="Cambodia's largest bus fleet.", phone="+855 12 345 678", verification_status="VERIFIED", rating=4.2, review_count=1240
        )
        # Capitol Tours
        op_capitol = TransportOperator(
            id=str(uuid.uuid4()), name="Capitol Tours", slug="capitol-tours", operator_type="BUS",
            logo_url="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=200&q=80",
            description="Budget-friendly bus.", phone="+855 23 456 789", verification_status="VERIFIED", rating=4.0, review_count=890
        )

        for op in [op_giant, op_larryta, op_vet, op_capitol]:
            if not db.query(TransportOperator).filter_by(slug=op.slug).first():
                db.add(op)
        db.commit()
        
        op_giant = db.query(TransportOperator).filter_by(slug="giant-ibis").first()
        op_larryta = db.query(TransportOperator).filter_by(slug="larryta-express").first()
        op_vet = db.query(TransportOperator).filter_by(slug="virak-buntham").first()
        op_capitol = db.query(TransportOperator).filter_by(slug="capitol-tours").first()

        # Hubs
        hub_pp = TransportHub(id=str(uuid.uuid4()), destination_id=pp_dest_id, name="Phnom Penh Terminal", slug="pp-terminal", latitude=11.5564, longitude=104.9221)
        hub_sr = TransportHub(id=str(uuid.uuid4()), destination_id=sr_dest_id, name="Siem Reap Terminal", slug="sr-terminal", latitude=13.3671, longitude=103.8590)

        for hub in [hub_pp, hub_sr]:
            if not db.query(TransportHub).filter_by(slug=hub.slug).first():
                db.add(hub)
        db.commit()
        
        hub_pp = db.query(TransportHub).filter_by(slug="pp-terminal").first()
        hub_sr = db.query(TransportHub).filter_by(slug="sr-terminal").first()

        # Routes
        r1 = TransportRoute(
            id=str(uuid.uuid4()), operator_id=op_giant.id, origin_destination_id=pp_dest_id, destination_id=sr_dest_id,
            origin_hub_id=hub_pp.id, destination_hub_id=hub_sr.id, name="Phnom Penh → Siem Reap (Giant Ibis)", slug="pp-sr-giant",
            duration_minutes=360, distance_km=314, base_price_usd=15.00, verification_status="VERIFIED"
        )
        r2 = TransportRoute(
            id=str(uuid.uuid4()), operator_id=op_larryta.id, origin_destination_id=pp_dest_id, destination_id=sr_dest_id,
            origin_hub_id=hub_pp.id, destination_hub_id=hub_sr.id, name="Phnom Penh → Siem Reap (Larryta)", slug="pp-sr-larryta",
            duration_minutes=300, distance_km=314, base_price_usd=13.00, verification_status="VERIFIED"
        )
        r3 = TransportRoute(
            id=str(uuid.uuid4()), operator_id=op_vet.id, origin_destination_id=pp_dest_id, destination_id=sr_dest_id,
            origin_hub_id=hub_pp.id, destination_hub_id=hub_sr.id, name="Phnom Penh → Siem Reap (Virak Buntham)", slug="pp-sr-vet",
            duration_minutes=360, distance_km=314, base_price_usd=12.00, verification_status="VERIFIED"
        )
        r4 = TransportRoute(
            id=str(uuid.uuid4()), operator_id=op_capitol.id, origin_destination_id=pp_dest_id, destination_id=sr_dest_id,
            origin_hub_id=hub_pp.id, destination_hub_id=hub_sr.id, name="Phnom Penh → Siem Reap (Capitol)", slug="pp-sr-capitol",
            duration_minutes=420, distance_km=314, base_price_usd=8.50, verification_status="VERIFIED"
        )

        routes = [r1, r2, r3, r4]
        for r in routes:
            if not db.query(TransportRoute).filter_by(slug=r.slug).first():
                db.add(r)
        db.commit()
        
        r1 = db.query(TransportRoute).filter_by(slug="pp-sr-giant").first()
        r2 = db.query(TransportRoute).filter_by(slug="pp-sr-larryta").first()
        r3 = db.query(TransportRoute).filter_by(slug="pp-sr-vet").first()
        r4 = db.query(TransportRoute).filter_by(slug="pp-sr-capitol").first()

        # Schedules
        if db.query(TransportSchedule).count() == 0:
            for route_id, price in [(r1.id, 15.00), (r2.id, 13.00), (r3.id, 12.00), (r4.id, 8.50)]:
                db.add(TransportSchedule(id=str(uuid.uuid4()), route_id=route_id, departure_time="08:00 AM", arrival_time="02:00 PM", vehicle_class="Standard", price_usd=price, days_of_week="DAILY"))
                db.add(TransportSchedule(id=str(uuid.uuid4()), route_id=route_id, departure_time="11:30 PM", arrival_time="05:30 AM", vehicle_class="Night", price_usd=price, days_of_week="DAILY"))
            db.commit()

        print("Successfully restored transport routes and fixed guide images.")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_fix()
