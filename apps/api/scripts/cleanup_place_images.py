#!/usr/bin/env python
"""One-off maintenance: clean place galleries down to real, verified, loadable images.

Background
----------
The tourism pipeline used to pad every place gallery to 10-12 photos from a generic
per-category stock pool (a butterfly or a beach would appear on a biodiversity-centre card)
and it kept dead external URLs when re-hosting failed (broken "Gallery 2/6/8/9" tiles).
That padding is gone; this script repairs the rows it already wrote.

What it does per place
----------------------
1. Removes hero/gallery entries that come from a static generic pool, are local
   destination placeholders, or are dead / not images (HTTP liveness check).
2. With --strict it additionally removes images whose filename does not reference the
   place name (note: legitimate Wikipedia images often have opaque filenames, so this
   can discard good photos - use it when you want name-echoing evidence only).
3. If nothing verifiable is left, it re-runs real multi-source discovery
   (Wikipedia / Wikimedia Commons / You.com) which now returns only place-matched,
   live images. A gallery may end up with fewer than 12 photos - or zero, which is
   honest rather than wrong.

Usage (from apps/api)
---------------------
    python scripts/cleanup_place_images.py --dry-run                 # report only
    python scripts/cleanup_place_images.py --dry-run --limit 20
    python scripts/cleanup_place_images.py                           # apply
    python scripts/cleanup_place_images.py --province siem-reap --strict
    python scripts/cleanup_place_images.py --report cleanup_report.json
"""

import argparse
import asyncio
import json
import logging
import os
import sys

# Make `app.*` importable when run as a plain script from anywhere.
API_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("cleanup_place_images")

from app.common.database import SessionLocal                      # noqa: E402
from app.models.location import Destination                       # noqa: E402
from app.models.place import Place                                # noqa: E402
from app.services.ai_tourism_engine import (                      # noqa: E402
    ai_tourism_engine,
    filter_live_images,
    image_relevance,
    is_generic_place_image,
)


def _parse_gallery(raw) -> list[str]:
    if isinstance(raw, list):
        return [u for u in raw if isinstance(u, str)]
    try:
        data = json.loads(raw or "[]")
    except (TypeError, ValueError):
        return []
    return data if isinstance(data, list) else []


def _is_placeholder(url: str) -> bool:
    return (not url) or url.startswith("/images/destinations/") or not url.startswith("http")


def clean_list(urls: list[str], place_name: str, local_name: str, strict: bool) -> tuple[list[str], dict]:
    """Drop generic pool, placeholders, duplicates and (in strict mode) name-mismatched images."""
    reasons = {"generic_pool": 0, "placeholder": 0, "name_mismatch": 0}
    kept: list[str] = []
    for url in urls:
        if _is_placeholder(url):
            reasons["placeholder"] += 1
            continue
        if is_generic_place_image(url):
            reasons["generic_pool"] += 1
            continue
        if strict and image_relevance(url, "", place_name, local_name) < 0.6:
            reasons["name_mismatch"] += 1
            continue
        kept.append(url)
    return list(dict.fromkeys(kept)), reasons


async def cleanup_place(place: Place, dest_name: str, strict: bool, live_check: bool,
                        rediscover: bool, dry_run: bool) -> dict:
    name = place.name
    local_name = place.local_name
    gallery = _parse_gallery(place.gallery_json)
    hero = place.hero_image_url or ""

    before_hero, before_gallery = hero, list(gallery)
    cleaned_gallery, reasons = clean_list(gallery, name, local_name, strict)
    cleaned_hero, _ = clean_list([hero], name, local_name, strict)
    cleaned_hero = cleaned_hero[0] if cleaned_hero else ""

    # Liveness: only URLs we can still fetch as an image are worth storing.
    if live_check:
        candidates = list(dict.fromkeys(([cleaned_hero] if cleaned_hero else []) + cleaned_gallery))
        if candidates:
            live = await filter_live_images(candidates)
            live_keys = {u.split("?")[0] for u in live}
            reasons["dead"] = len(candidates) - len(live)
            cleaned_hero = cleaned_hero if cleaned_hero.split("?")[0] in live_keys else ""
            cleaned_gallery = [u for u in cleaned_gallery if u.split("?")[0] in live_keys]

    # Nothing trustworthy survived -> go and find real images for this place.
    rediscovered = False
    if rediscover and (not cleaned_hero or not cleaned_gallery):
        discovered_hero, discovered_gallery = await ai_tourism_engine._resolve_place_images(
            name=name,
            dest_name=dest_name,
            place_type=place.place_type or "ATTRACTION",
            local_name=local_name,
            target_count=12,
            verify_live=False,          # already handled above / avoids double network cost
        )
        rediscovered = True
        if not cleaned_gallery and discovered_gallery:
            cleaned_gallery = discovered_gallery
        if not cleaned_hero:
            cleaned_hero = discovered_hero or (cleaned_gallery[0] if cleaned_gallery else "")

    changed = before_hero != cleaned_hero or before_gallery != cleaned_gallery
    if changed and not dry_run:
        place.hero_image_url = cleaned_hero or None
        place.gallery_json = json.dumps(cleaned_gallery)

    return {
        "id": place.id,
        "name": name,
        "province": dest_name,
        "changed": changed,
        "dropped": {k: v for k, v in reasons.items() if v},
        "rediscovered": rediscovered,
        "hero_before": before_hero,
        "hero_after": cleaned_hero,
        "gallery_before": len(before_gallery),
        "gallery_after": len(cleaned_gallery),
    }


async def main() -> int:
    parser = argparse.ArgumentParser(description="Remove generic/broken place images, keep only verified ones.")
    parser.add_argument("--dry-run", action="store_true", help="report what would change without writing")
    parser.add_argument("--limit", type=int, default=0, help="max places to process (0 = all)")
    parser.add_argument("--province", help="only this destination slug, e.g. siem-reap")
    parser.add_argument("--strict", action="store_true", help="also drop images whose filename does not mention the place")
    parser.add_argument("--no-live-check", action="store_true", help="skip the HTTP liveness check")
    parser.add_argument("--report", help="write a JSON report to this path")
    parser.add_argument("--no-rediscover", action="store_true", help="only prune bad images; do not search for replacements")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        query = db.query(Place)
        if args.province:
            query = (
                query.join(Destination, Place.destination_id == Destination.id)
                .filter(Destination.slug == args.province)
            )
        places = query.order_by(Place.created_at.desc()).all()
        if args.limit:
            places = places[: args.limit]

        logger.info(
            f"Scanning {len(places)} place(s){' [DRY RUN]' if args.dry_run else ''}"
            f"{' strict' if args.strict else ''}{' no-live-check' if args.no_live_check else ''}"
        )

        results = []
        for idx, place in enumerate(places, 1):
            dest_name = place.destination.name if place.destination else "Cambodia"
            try:
                res = await cleanup_place(
                    place,
                    dest_name,
                    strict=args.strict,
                    live_check=not args.no_live_check,
                    rediscover=not args.no_rediscover,
                    dry_run=args.dry_run,
                )
            except Exception as e:
                logger.warning(f"  [{idx}/{len(places)}] {place.name}: error {e}")
                continue
            results.append(res)
            if res["changed"]:
                logger.info(
                    f"  [{idx}/{len(places)}] {place.name} ({dest_name}): "
                    f"gallery {res['gallery_before']} -> {res['gallery_after']}, "
                    f"hero {'kept' if res['hero_before'] == res['hero_after'] else 'changed'}"
                    + (f", dropped {res['dropped']}" if res["dropped"] else "")
                )

        if not args.dry_run:
            db.commit()
        else:
            db.rollback()

        changed = [r for r in results if r["changed"]]
        empty = [r for r in results if not r["hero_after"]]
        summary = {
            "scanned": len(results),
            "changed": len(changed),
            "without_verified_hero": len(empty),
            "dry_run": bool(args.dry_run),
        }
        logger.info(f"Summary: {summary}")
        if empty:
            logger.info(
                "Places left without an image (no real photo of them could be verified): "
                + ", ".join(r["name"] for r in empty[:15])
            )
        if args.report:
            with open(args.report, "w", encoding="utf-8") as f:
                json.dump({"summary": summary, "places": results}, f, ensure_ascii=False, indent=2)
            logger.info(f"Report written to {args.report}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
