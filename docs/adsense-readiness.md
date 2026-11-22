# AdSense readiness

## Content quality remediation (November 2026)

The reported rejection is low-value content. More automated articles, a word count,
source attribution alone, or a passing software check does not establish original value
or guarantee approval. Review actual published pages before resubmitting.

Current protections:

- Daily drafting continues, but editor review is required by default. This new setting
  also holds installations with a previously saved auto-publish switch enabled.
- News publishing rejects short bodies, known generic monitoring filler, bodies that
  only repeat their summary, and publisher homepage links. The 1000 non-whitespace
  character minimum is an internal screening rule, not a Google requirement.
- Existing news that fails the website's screening gets `noindex,follow`, is left out
  of the article sitemap, and cannot mount manual ad placements. It remains accessible
  for editorial correction. `noindex` does not exempt a page from AdSense review.
- The root layout retains the account verification meta tag but does not load the ad
  script globally. Only explicitly eligible, configured placements load it. News,
  substantive guides/explainers, and a selected set of implemented tools can qualify;
  listing pages, legal pages, account screens and invitations do not opt in.

After deployment, from `apps/api` run `python scripts/audit_content_quality.py` using
the deployment environment. This read-only JSON report lists published news needing
review. Review each flagged story in the CMS: verify the facts, replace filler with
useful original explanation, correct desk/category placement, and link the exact
source. Unpublish material that cannot be repaired. Also review guides, discoveries,
images and tools manually; the news audit does not cover those sections.

In AdSense, turn off Auto ads while using these manual placements. A loaded third-party
script can persist during client navigation; application placement checks do not control
Google's automatic placements. Configure real numeric ad unit IDs only after approval.
Rebuild and deploy the web, API, worker and admin services to activate this code. Check
the live site and worker settings before confirming that the rejection is fixed.

References: [AdSense content guidance](https://support.google.com/adsense/answer/81904),
[Google's generative AI guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).

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
