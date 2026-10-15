# AdSense readiness

> **This file used to describe an activation procedure that does not exist** — an `AdProvider`
> abstraction, an `ADSENSE_ENABLED` flag in `apps/api/.env` (the API has no part in serving ads), and
> a claim of "zero layout shift" that the old component did not deliver. It is now a pointer plus the
> one list that is still accurate.
>
> **The real guide is [docs/monetization.md](monetization.md).**

## What AdSense looks at, and whether the site has it

These pages exist and are reachable; an application reviewer will look for them.

| Requirement | Where |
| --- | --- |
| About / who operates the site | `/about` |
| Editorial standards and AI rules | `/editorial-policy`, `/content-standards` |
| Corrections process | `/corrections-policy`, `/corrections` |
| Privacy policy | `/privacy` |
| Cookie disclosure, names advertising providers | `/cookie-policy` |
| Advertising disclosure | `/advertising` |
| Contact / newsroom | `/contact` |
| Navigation, search, category structure | header, footer, `/search`, per-section indexes |
| Source attribution on every story | byline and attribution block on each article |

Two of those are editorial facts rather than pages, and they are the ones that actually decide
approval: content must be yours or attributed, and the site must be reachable at the domain you
register. The second one is currently an open question — `blog.camtech.cam` does not resolve in
public DNS while `camtech.cam` serves the site. See "Pick the domain" in
[monetization.md](monetization.md).
