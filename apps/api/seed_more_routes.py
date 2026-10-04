import os
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.common.database import SessionLocal
from app.models.transport import TransportOperator, TransportHub, TransportRoute, TransportSchedule

def seed_more_routes():
    db = SessionLocal()
    try:
        pp_dest_id = "b0166d07-8aaf-4bb9-a6b3-3a6d088a1728"
        sr_dest_id = "df12cb4a-4fbe-4b40-83a3-bb1eabc9aa1c"

        # Create Operators
        op1_id = str(uuid.uuid4())
        op1 = TransportOperator(
            id=op1_id,
            name="Virak Buntham",
            slug="virak-buntham",
            operator_type="BUS",
            logo_url="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80",
            description="Cambodia's largest bus fleet offering extensive routes including night buses.",
            phone="+855 12 345 678",
            verification_status="VERIFIED",
            rating=4.2,
            review_count=1240
        )

        op2_id = str(uuid.uuid4())
        op2 = TransportOperator(
            id=op2_id,
            name="Capitol Tours",
            slug="capitol-tours",
            operator_type="BUS",
            logo_url="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=200&q=80",
            description="A long-standing budget-friendly bus service in Cambodia.",
            phone="+855 23 456 789",
            verification_status="VERIFIED",
            rating=4.0,
            review_count=890
        )
        
        # Only add if they don't exist
        if not db.query(TransportOperator).filter_by(slug="virak-buntham").first():
            db.add(op1)
        else:
            op1 = db.query(TransportOperator).filter_by(slug="virak-buntham").first()
            
        if not db.query(TransportOperator).filter_by(slug="capitol-tours").first():
            db.add(op2)
        else:
            op2 = db.query(TransportOperator).filter_by(slug="capitol-tours").first()
            
        db.commit()

        # Create Hubs
        hub1_id = str(uuid.uuid4())
        hub1 = TransportHub(
            id=hub1_id,
            destination_id=pp_dest_id,
            name="Phnom Penh VET Terminal",
            slug="phnom-penh-vet-terminal",
            hub_type="BUS_STATION",
            latitude=11.5564,
            longitude=104.9221
        )
        
        hub2_id = str(uuid.uuid4())
        hub2 = TransportHub(
            id=hub2_id,
            destination_id=sr_dest_id,
            name="Siem Reap VET Terminal",
            slug="siem-reap-vet-terminal",
            hub_type="BUS_STATION",
            latitude=13.3671,
            longitude=103.8590
        )
        
        if not db.query(TransportHub).filter_by(slug="phnom-penh-vet-terminal").first():
            db.add(hub1)
        else:
            hub1 = db.query(TransportHub).filter_by(slug="phnom-penh-vet-terminal").first()

        if not db.query(TransportHub).filter_by(slug="siem-reap-vet-terminal").first():
            db.add(hub2)
        else:
            hub2 = db.query(TransportHub).filter_by(slug="siem-reap-vet-terminal").first()
            
        db.commit()

        # Create Routes
        route1_id = str(uuid.uuid4())
        route1 = TransportRoute(
            id=route1_id,
            operator_id=op1.id,
            origin_destination_id=pp_dest_id,
            destination_id=sr_dest_id,
            origin_hub_id=hub1.id,
            destination_hub_id=hub2.id,
            name="Phnom Penh → Siem Reap (VET Night/Day)",
            slug="pp-sr-vet",
            transport_type="BUS",
            description="Frequent day and night VIP sleeper buses with AC and water.",
            duration_minutes=360,
            distance_km=314,
            base_price_usd=12.00,
            verification_status="VERIFIED"
        )
        
        route2_id = str(uuid.uuid4())
        route2 = TransportRoute(
            id=route2_id,
            operator_id=op2.id,
            origin_destination_id=pp_dest_id,
            destination_id=sr_dest_id,
            origin_hub_id=hub1.id,
            destination_hub_id=hub2.id,
            name="Phnom Penh → Siem Reap (Capitol Express)",
            slug="pp-sr-capitol",
            transport_type="BUS",
            description="Affordable standard AC bus with a quick stop in Kampong Thom.",
            duration_minutes=420,
            distance_km=314,
            base_price_usd=8.50,
            verification_status="VERIFIED"
        )
        
        # Ensure we don't duplicate routes
        if not db.query(TransportRoute).filter_by(slug="pp-sr-vet").first():
            db.add(route1)
            db.add(TransportSchedule(
                id=str(uuid.uuid4()), route_id=route1.id, departure_time="08:00 AM", arrival_time="02:00 PM",
                vehicle_class="VIP Minibus", price_usd=12.00, days_of_week="DAILY"
            ))
            db.add(TransportSchedule(
                id=str(uuid.uuid4()), route_id=route1.id, departure_time="11:30 PM", arrival_time="05:30 AM",
                vehicle_class="Luxury Night Sleeper", price_usd=14.00, days_of_week="DAILY"
            ))

        if not db.query(TransportRoute).filter_by(slug="pp-sr-capitol").first():
            db.add(route2)
            db.add(TransportSchedule(
                id=str(uuid.uuid4()), route_id=route2.id, departure_time="07:30 AM", arrival_time="02:30 PM",
                vehicle_class="Standard AC", price_usd=8.50, days_of_week="DAILY"
            ))
            db.add(TransportSchedule(
                id=str(uuid.uuid4()), route_id=route2.id, departure_time="01:30 PM", arrival_time="08:30 PM",
                vehicle_class="Standard AC", price_usd=8.50, days_of_week="DAILY"
            ))

        db.commit()
        print("Successfully added Virak Buntham and Capitol Tours routes from Phnom Penh to Siem Reap.")
        
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_more_routes()
