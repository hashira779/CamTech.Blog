import os
from sqlalchemy.orm import Session
from app.common.database import SessionLocal
from app.models.transport import TransportOperator, TransportHub, TransportRoute, TransportSchedule, TransportStop

def delete_all_transport_data():
    db = SessionLocal()
    try:
        db.query(TransportSchedule).delete()
        db.query(TransportStop).delete()
        db.query(TransportRoute).delete()
        db.query(TransportHub).delete()
        db.query(TransportOperator).delete()
        db.commit()
        print("Successfully deleted all fake transport data.")
    except Exception as e:
        print(f"Error deleting data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_transport_data()
