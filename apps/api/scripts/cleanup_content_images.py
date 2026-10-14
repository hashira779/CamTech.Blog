#!/usr/bin/env python
"""One-off maintenance: strip unverified hero photos from travel guides and events.

Background
----------
`ai_content_service` used to take guide/event heroes from `image_search_service`, whose last
resort is a static Unsplash pool. Those pool entries carry descriptive comments, not verified
locations: `photo-1539037116277-4db20889f2d4` is labelled "Cambodia Angkor Sunrise" and
"Angkor Wat Ancient Temple" but is a photo of Madrid's Gran Via, and it illustrated the
"Angkor Wat Sunrise Photography & Sacred Etiquette" guide on the public site.

Generation is now gated by `content_image_matches` + an HTTP liveness check, so new rows cannot
pick up pool photos. This script repairs the rows written before that gate.

What it does per guide/event
----------------------------
1. Clears heroes that come from a generic stock pool or do not survive an HTTP liveness check.
   Bundled `/images/...` assets are kept when their file name names the subject (an Angkor Wat
   photo on an Angkor event) and cleared when it does not (a royal-palace photo on a water
   festival).
2. Additionally clears heroes whose source context says nothing about the article's subject or
   its destination.
3. With rediscovery enabled (default) it asks the gated travel image search for a replacement,
   and only writes one when it verifies. Otherwise the row keeps `hero_image_url = NULL` and the
   card renders without a photo - honest rather than wrong.

Usage (from apps/api)
---------------------
    python scripts/cleanup_content_images.py --dry-run
    python scripts/cleanup_content_images.py
    python scripts/cleanup_content_images.py --no-rediscover --report content_images_report.json
"""

import argparse
import asyncio
import json
import logging
import os
import sys

API_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("cleanup_content_images")

from app.common.database import SessionLocal                      # noqa: E402
from app.models.guide_event import Event, TravelGuide             # noqa: E402
from app.models.location import Destination                       # noqa: E402
from app.services.ai_content_service import ai_content_service    # noqa: E402
from app.services.ai_tourism_engine import (                      # noqa: E402
    content_image_matches,
    filter_live_images,
    is_generic_place_image,
    subject_context_matches,
)


STOCK_IMAGE_HOSTS = (
    "images.unsplash.com",
    "plus.unsplash.com",
    "images.pexels.com",
    "cdn.pixabay.com",
    "picsum.photos",
)


def _bad_reason(url: str, subject: str, destination: str) -> str:
    """Empty string means the hero is fine; otherwise why it must go."""
    if not url:
        return ""  # nothing to clean
    if not url.startswith("http"):
        # Bundled /images/... files are curated editorial assets, so the file name is the only
        # evidence available. Keep "angkor-wat.jpg" on an Angkor event; drop a generic placeholder.
        stem = os.path.basename(str(url))
        return "" if subject_context_matches(stem, subject=subject, destination=destination) \
            else "bundled-asset-unrelated"
    if is_generic_place_image(url):
        return "generic-stock-pool"
    # Stock CDNs serve opaque photo IDs, so a filename can never prove the location. Such a
    # URL is only trustworthy when the article/destination appears in its own path; a re-hosted
    # Wikipedia/Commons file does, and is left alone.
    lowered = url.lower()
    if any(host in lowered for host in STOCK_IMAGE_HOSTS):
        if not content_image_matches(url, subject=subject, destination=destination):
            return "stock-host-no-location-match"
    return ""


async def run(dry_run: bool, rediscover: bool, live_check: bool, report_path: str) -> dict:
    db = SessionLocal()
    rows = []
    try:
        dest_names = {d.id: d.name for d in db.query(Destination).all()}
        targets = [
            ("GUIDE", g.id, g.title, g.hero_image_url or "", dest_names.get(g.destination_id, ""))
            for g in db.query(TravelGuide).all()
        ] + [
            ("EVENT", e.id, e.name, e.hero_image_url or "", dest_names.get(e.destination_id, ""))
            for e in db.query(Event).all()
        ]

        need_live = [url for _kind, _id, _s, url, _d in targets if url and url.startswith("http")]
        live_urls = set(await filter_live_images(need_live)) if (live_check and need_live) else set(
            url for url in need_live
        )

        cleared = kept = replaced = missing = 0
        for kind, row_id, subject, url, destination in targets:
            reason = _bad_reason(url, subject, destination)
            # Only remote URLs can be liveness-checked; bundled assets are shipped files.
            if not reason and url.startswith("http") and live_check and url not in live_urls:
                reason = "dead-url"

            new_url = url
            if reason:
                new_url = None
                if rediscover:
                    candidate = await ai_content_service._find_verified_travel_image(
                        subject, destination, query=f"{subject} {destination}".strip()
                    )
                    if candidate:
                        new_url = candidate
                        replaced += 1
                if not new_url:
                    cleared += 1

            if new_url != url:
                table = TravelGuide if kind == "GUIDE" else Event
                row = db.get(table, row_id)
                if row is not None:
                    row.hero_image_url = new_url
                    if not dry_run:
                        db.commit()
                kept_note = "cleared" if not new_url else "replaced"
                print(f"  [{kind}] {subject[:58]}: {reason} -> {kept_note}")

            if not reason and not url:
                missing += 1
            elif not reason:
                kept += 1
                print(f"  [{kind}] {subject[:58]}: hero kept (real source, live)")

            rows.append(
                {
                    "type": kind,
                    "id": row_id,
                    "subject": subject,
                    "hero_before": url,
                    "hero_after": new_url,
                    "reason": reason,
                }
            )
    finally:
        db.close()

    summary = {
        "scanned": len(rows),
        "kept": kept,
        "cleared": cleared,
        "replaced": replaced,
        "without_image": missing,
        "dry_run": dry_run,
    }
    if report_path:
        with open(report_path, "w", encoding="utf-8") as fh:
            json.dump({"summary": summary, "rows": rows}, fh, ensure_ascii=False, indent=2)
        logger.info("Report written to %s", report_path)
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="report only, change nothing")
    parser.add_argument("--no-rediscover", action="store_true", help="never search for a replacement")
    parser.add_argument("--no-live-check", action="store_true", help="skip the HTTP liveness check")
    parser.add_argument("--report", default="", help="write a JSON report to this path")
    args = parser.parse_args()

    summary = asyncio.run(
        run(
            dry_run=args.dry_run,
            rediscover=not args.no_rediscover,
            live_check=not args.no_live_check,
            report_path=args.report,
        )
    )
    logger.info("Summary: %s", summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
