# Travel content audit — 24 October 2026

Done during the Travel 2.0 redesign against the local database (`daily_discovery.db`, 25
destinations, 120 places, 1 featured trip). **No rows were changed**: a design task does not
rewrite the directory. Each item says what the interface now does about it and what needs a
content decision.

| # | Finding | Rows | Interface now | Needs |
|---|---------|------|---------------|-------|
| 1 | A place's `hero_image_url` is its **province's cover photo** (`/images/destinations/*.jpg`), e.g. Koh Ker shows the Preah Vihear cover and Long Set Beach the Sihanoukville cover. | 93 of 120 places | Card and map show a "Province photo — not of this place" label; such images never get a feature slot; the place page does not count them as photographs of the place and does not use them for `og:image` or JSON-LD. | Source real photographs, or set `hero_image_url` to null for these rows. |
| 2 | Places with no coordinates. | 2 (`kep-national-park-trail-3a30`, `angkaul-white-beach-77bd`) | Left off the map and out of distance calculations; still listed. | Add coordinates from a verifiable source. |
| 3 | Places with no photograph. | 5 | Honest "Photo not verified yet" tile. | Photographs. |
| 4 | `verification_status = AI_GENERATED`. | 2 | Shown as "AI-generated · not verified" with a warning mark (it previously had the same green check as verified rows). | Editorial review. |
| 5 | Missing Khmer descriptions (`description_km`). | 109 of 120 places | Falls back to the English description in Khmer mode. | Translation. |
| 6 | The featured trip `ultimate-3-day-siem-reap-angkor-odyssey` uses an Unsplash photo of **Madrid** as its hero. | 1 trip | Not changed (it is the record's own image). | Replace the image. |
| 7 | The API's trip generator (`TravelService.generate_trip_plan`) invents values: `rating or 4.9`, a flat `"$5 - $10"` cost, and template theme copy. | — | The planner no longer calls it; it builds plans client-side from directory rows with `lib/travel/itinerary.ts`, which uses no prices or ratings. The endpoint is still deployed. | Remove or fix the endpoint. |
| 8 | `planner_options.json` budget tiers quote unsourced dollar-per-day ranges ("$15 - $35/day" …). | — | No longer shown; the planner budget filter uses the directory's recorded price *levels* and says so. | Delete or source the ranges. |
| 9 | `PRODUCTION_ORIGINS` in the API CORS policy lists `blog.camtech.cam` and `cms.camtech.cam` but not `camtech.cam`. | — | Client-side requests (attraction search and paging, planner place loading) need the browser to reach the API. If production serves the API on another origin, add `camtech.cam` there; if it is same-origin behind the proxy, nothing to do. | Confirm on the server. |
| 10 | The places API caps `limit` at 100. | — | Map and planner page through results. | — |

No duplicate place names and no coordinates outside Cambodia's bounding box were found.
