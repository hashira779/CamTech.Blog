#!/usr/bin/env python
"""One-off maintenance: strip the artifacts the old article pipeline already stored.

Background
----------
Three defects wrote themselves into the articles table before they were fixed:

1. Hero images. When Wikimedia keyword search found nothing, the pipeline fell back to a
   generic per-category Unsplash pool - 26 of 81 stored heroes, including 4 of the 5
   published ones. When it did find something, it checked nothing: a Bruegel painting of
   children playing illustrated a Google Play story, and a photo of humanitarian aid to
   Gaza illustrated a Starlink/Ukraine story. Credits were invented too - an Unsplash file
   captioned "NASA / ESA / CSA Scientific Archive".
2. Summaries. The local engine wrote "According to reporting from {source}, " + the
   publisher's first sentence force-lowercased + " The development highlights key ongoing
   shifts in the sector." - 77 of 81 stored summaries.
3. Editorial filler. "This event represents an important indicator for stakeholders..."
   as why_it_matters, and "Documented report:" pasted in front of every key point.

What this script does per article
---------------------------------
* Clears hero_image_url / hero_image_credit / hero_image_license when the photograph cannot
  be attributed to the story. A story with no photograph is honest; the card renders text-only.
* Repairs a templated summary back to the publisher's own sentence: prefix removed, original
  casing restored from the headline, filler sentence dropped. Nothing is re-worded.
* Drops the invented why_it_matters and the "Documented report:" prefixes.
* Reports category/desk inconsistencies (a Cambodia-scope category on the WORLD desk) without
  rewriting them, because only an editor can say which half is wrong.

Usage (from apps/api)
---------------------
    venv/Scripts/python scripts/cleanup_article_content.py                  # dry run
    venv/Scripts/python scripts/cleanup_article_content.py --apply          # write
    venv/Scripts/python scripts/cleanup_article_content.py --status AI_DRAFT --limit 50
    venv/Scripts/python scripts/cleanup_article_content.py --report article_cleanup_report.json
"""

import argparse
import json
import os
import re
import sys
from collections import Counter
from typing import Optional

API_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.common.database import SessionLocal                      # noqa: E402
from app.models.article import Article                             # noqa: E402
from app.models.category import Category                           # noqa: E402
from app.ai.provider import LocalAIProvider                        # noqa: E402
from app.services.image_search_service import ImageSearchService     # noqa: E402
from app.services.filing import (
    strip_brand_suffix,                                  # noqa: E402
    category_is_cambodia,
    filing_is_consistent,
    hero_provenance_ok,
)

TEMPLATE_PREFIX = re.compile(r"^according to (?:reporting )?from\s+[^,]+,\s*", re.I)
FILLER_SENTENCE = "The development highlights key ongoing shifts in the sector."
INVENTED_WHY_IT_MATTERS = "This event represents an important indicator for stakeholders"
DOCUMENTED_PREFIX = re.compile(r"^documented report:\s*", re.I)

# The old template force-lowercased the publisher's first sentence, so casing was destroyed
# for words the headline does not also contain. These are restored by orthography, not
# editorial choice: an initialism and these brand names are always capitalised.
_ALWAYS_CAPITALISED = {
    "ai": "AI", "gdp": "GDP", "eu": "EU", "un": "UN", "nft": "NFT", "qr": "QR",
    "asean": "ASEAN", "bbc": "BBC", "cnn": "CNN", "ngo": "NGO", "usa": "USA",
    "uk": "UK", "openai": "OpenAI", "nvidia": "Nvidia",
    "google": "Google", "microsoft": "Microsoft", "instagram": "Instagram",
    "facebook": "Facebook", "youtube": "YouTube", "apple": "Apple",
    "samsung": "Samsung", "tesla": "Tesla", "netflix": "Netflix",
}


def restore_orthography(text: str) -> str:
    for word, replacement in _ALWAYS_CAPITALISED.items():
        text = re.sub(rf"(?<![A-Za-z]){word}(?![A-Za-z])", replacement, text)
    return text


def repair_summary(article: Article) -> Optional[str]:
    """Undo the template without writing a new sentence."""
    summary = (article.summary or "").strip()
    if not TEMPLATE_PREFIX.search(summary):
        return None
    repaired = TEMPLATE_PREFIX.sub("", summary, count=1)
    repaired = repaired.replace(FILLER_SENTENCE, "").strip()
    repaired = restore_orthography(LocalAIProvider._restore_case(repaired, article.title))
    repaired = re.sub(r"\s+", " ", repaired).strip()
    if not repaired or repaired.lower() == summary.lower():
        return None
    return repaired


def repair_key_points(raw: Optional[str]) -> Optional[list]:
    try:
        points = json.loads(raw or "[]")
    except (TypeError, ValueError):
        return None
    if not isinstance(points, list):
        return None
    kept = []
    for point in points:
        text = DOCUMENTED_PREFIX.sub("", str(point)).strip()
        if not text or INVENTED_WHY_IT_MATTERS.lower() in text.lower():
            continue
        if text.lower().startswith(("initial coverage provided by", "official statements and documentation",
                                    "further regional developments")):
            continue
        kept.append(text)
    return kept if kept != [str(p).strip() for p in points] else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean stored article content artifacts.")
    parser.add_argument("--apply", action="store_true", help="write changes (default is dry run)")
    parser.add_argument("--status", default=None, help="limit to one status, e.g. PUBLISHED or AI_DRAFT")
    parser.add_argument("--limit", type=int, default=1000, help="max articles to inspect")
    parser.add_argument("--report", default=None, help="write a JSON report to this path")
    args = parser.parse_args()

    db = SessionLocal()
    stats: Counter = Counter()
    rows = []
    try:
        query = db.query(Article).order_by(Article.created_at.desc())
        if args.status:
            query = query.filter(Article.status == args.status)
        articles = query.limit(args.limit).all()

        for article in articles:
            record = {"slug": article.slug, "status": article.status, "title": (article.title or "")[:80]}
            changed = {}

            hero_ok, hero_reason = hero_provenance_ok(article.hero_image_url, article.hero_image_credit)
            if hero_ok and article.hero_image_url:
                # Same standard the write path now applies: the file's own name has to carry
                # a distinctive word of the headline, or we cannot claim it shows this story.
                if not ImageSearchService.news_image_is_attributable(article.hero_image_url, article.title or ""):
                    hero_ok = False
                    hero_reason = "no headline term appears in the file name"

            if article.hero_image_url and not hero_ok:
                changed["hero"] = hero_reason
                stats[f"hero: {hero_reason}"] += 1
                if args.apply:
                    article.hero_image_url = None
                    article.hero_image_credit = None
                    article.hero_image_license = None

            repaired = repair_summary(article)
            if repaired:
                changed["summary"] = {"from": article.summary[:120], "to": repaired[:120]}
                stats["summary: template removed"] += 1
                if args.apply:
                    old = (article.summary or "").strip()
                    article.summary = repaired
                    if article.content and article.content.startswith(old):
                        article.content = repaired + article.content[len(old):]

            if (article.why_it_matters or "").startswith(INVENTED_WHY_IT_MATTERS):
                changed["why_it_matters"] = "removed (invented editorial analysis)"
                stats["why_it_matters: invented text removed"] += 1
                if args.apply:
                    article.why_it_matters = None

            points = repair_key_points(article.key_points)
            if points is not None:
                changed["key_points"] = len(points)
                stats["key_points: prefixes/invented items removed"] += 1
                if args.apply:
                    article.key_points = json.dumps(points)

            # Older drafts wrote the site brand into seo_title, so the browser tab read
            # "Story | Daily Discovery | CamTech.Blog". The template owns the brand now.
            for field in ("seo_title", "seo_description"):
                stored = getattr(article, field, None)
                if not stored:
                    continue
                stripped = strip_brand_suffix(stored)
                if stripped and stripped != stored.strip():
                    changed[field] = {"from": stored[-40:], "to": stripped[-40:]}
                    stats[f"{field}: trailing brand suffix removed"] += 1
                    if args.apply:
                        setattr(article, field, stripped)

            category = db.query(Category).filter(Category.id == article.category_id).first()
            if not filing_is_consistent(article.country, category.slug if category else None,
                                         category.scope if category else None):
                desk = "Cambodia" if category_is_cambodia(category.slug if category else None,
                                                          category.scope if category else None) else "World"
                stats[f"filing: category says {desk}, desk is {article.country or 'unset'}"] += 1
                record["filing_needs_editor"] = (
                    f"category '{category.name if category else article.category_id}' "
                    f"vs country '{article.country}'"
                )

            if changed:
                record["changed"] = changed
                stats["articles touched"] += 1
            if record.get("filing_needs_editor") or changed:
                rows.append(record)

        if args.apply:
            db.commit()
        else:
            db.rollback()

        print(f"{'APPLIED' if args.apply else 'DRY RUN'}: {len(articles)} articles inspected")
        for key, count in sorted(stats.items()):
            print(f"  {count:>4}  {key}")
        print("Stories keep their headline and source URL; only unverifiable photographs and "
              "invented sentences are removed.")

        if args.report:
            with open(args.report, "w", encoding="utf-8") as handle:
                json.dump({"mode": "apply" if args.apply else "dry-run",
                           "inspected": len(articles), "stats": dict(stats), "articles": rows},
                          handle, indent=2, ensure_ascii=False)
            print(f"report written: {args.report}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
