"""Dry-run the full tourism discovery scan without writing a single row.

run_full_scan() auto-saves (it is what the weekly cron and the admin button call), so this
script walks the same province loop with auto_save=False to report exactly what a scan WOULD
insert and what the quality gates would block. Place rows are counted before and after to
prove the database was untouched.
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.common.database import SessionLocal
from app.models.place import Place
from app.services.ai_tourism_engine import CAMBODIA_PROVINCES, ai_tourism_engine


def _place_count() -> int:
    db = SessionLocal()
    try:
        return db.query(Place).count()
    finally:
        db.close()


async def main() -> None:
    before = _place_count()
    totals = {"discovered": 0, "would_save": 0, "duplicates_skipped": 0, "generic_withheld": 0}
    would_insert: list[str] = []
    blocked: list[str] = []
    withheld: list[str] = []
    errors: list[str] = []

    for prov in CAMBODIA_PROVINCES:
        try:
            res = await ai_tourism_engine.discover_places_for_province(prov["slug"], auto_save=False)
        except Exception as exc:
            errors.append(f"{prov['name']}: {exc}")
            continue
        totals["discovered"] += res.get("discovered", 0)
        totals["duplicates_skipped"] += res.get("duplicates_skipped", 0)
        totals["generic_withheld"] += res.get("generic_withheld", 0)
        for place in res.get("places_data", []):
            label = f"{prov['name']} :: {place.get('name')}"
            if place.get("is_duplicate"):
                blocked.append(f"{label}  ->  {place.get('duplicate_of')}")
            elif place.get("generic_placeholder"):
                withheld.append(label)
            else:
                would_insert.append(label)

    after = _place_count()

    print(json.dumps({
        "source": ai_tourism_engine.discovery_source(),
        "provinces": len(CAMBODIA_PROVINCES),
        "totals": totals,
        "would_save_now": len(would_insert),
        "places_rows_before": before,
        "places_rows_after": after,
        "database_untouched": before == after,
        "errors": errors,
    }, indent=2))
    print("\n--- would be inserted ---")
    for n in would_insert:
        print(" ", n)
    print("\n--- blocked as a duplicate spelling ---")
    for n in blocked:
        print(" ", n)
    print("\n--- withheld as a templated placeholder ---")
    for n in withheld:
        print(" ", n)


if __name__ == "__main__":
    asyncio.run(main())
