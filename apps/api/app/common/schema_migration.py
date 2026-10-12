import os
import json
import logging
from sqlalchemy import text, inspect
from app.common.database import engine, SessionLocal
from app.models.location import Destination

logger = logging.getLogger("migration")

def ensure_database_schema():
    """Ensure database schema is up-to-date with dynamic destination symbol columns."""
    try:
        inspector = inspect(engine)
        if not inspector.has_table("destinations"):
            logger.info("Table 'destinations' does not exist yet; create_all will create it.")
            return

        existing_columns = {col["name"] for col in inspector.get_columns("destinations")}

        symbol_columns = [
            ("symbol_name", "VARCHAR(200)"),
            ("symbol_name_km", "VARCHAR(200)"),
            ("symbol_nickname", "VARCHAR(255)"),
            ("symbol_nickname_km", "VARCHAR(255)"),
            ("symbol_monument_type", "VARCHAR(100)"),
            ("symbol_story", "TEXT"),
            ("symbol_photo_spot_tip", "TEXT"),
            ("symbol_must_try_specialty", "TEXT"),
            ("symbol_accent_color", "VARCHAR(50)"),
            ("symbol_emoji", "VARCHAR(20)"),
            ("symbol_image_url", "VARCHAR(500)"),
        ]

        is_postgres = not engine.url.drivername.startswith("sqlite")
        for col_name, col_type in symbol_columns:
            if col_name not in existing_columns:
                try:
                    with engine.begin() as conn:
                        logger.info(f"Adding missing column '{col_name}' to 'destinations' table...")
                        if is_postgres:
                            conn.execute(text(f"ALTER TABLE destinations ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                        else:
                            conn.execute(text(f"ALTER TABLE destinations ADD COLUMN {col_name} {col_type}"))
                except Exception as col_err:
                    logger.warning(f"Column '{col_name}' migration notice: {col_err}")

        # Check if symbols need seeding
        json_path = os.path.join(os.path.dirname(__file__), "..", "data_province_symbols.json")
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                symbols_data = json.load(f)

            db = SessionLocal()
            try:
                unseeded = db.query(Destination).filter(Destination.symbol_name.is_(None)).all()
                if unseeded:
                    logger.info(f"Found {len(unseeded)} destinations without symbols. Seeding from dynamic data...")
                    for dest in unseeded:
                        if dest.slug in symbols_data:
                            s = symbols_data[dest.slug]
                            dest.symbol_name = s.get("symbolName")
                            dest.symbol_name_km = s.get("symbolNameKm")
                            dest.symbol_nickname = s.get("nickname")
                            dest.symbol_nickname_km = s.get("nicknameKm")
                            dest.symbol_monument_type = s.get("monumentType")
                            dest.symbol_story = s.get("story")
                            dest.symbol_photo_spot_tip = s.get("photoSpotTip")
                            dest.symbol_must_try_specialty = s.get("mustTrySpecialty")
                            dest.symbol_accent_color = s.get("accentColor")
                            dest.symbol_emoji = s.get("emoji")
                            dest.symbol_image_url = s.get("image")
                    db.commit()
                    logger.info("Successfully seeded dynamic province symbols into database.")
            finally:
                db.close()

    except Exception as e:
        logger.error(f"Error during schema migration: {e}")
