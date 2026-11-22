# News Ingestion System & Source Registry

Section 8 & 46 Guidelines: Daily Discovery uses polite, controlled RSS/Atom ingestion rather than aggressive, unauthorized web scraping.

---

## 1. Adding an Ingestion Source

Admins can register new sources via `/api/v1/sources`:

```json
POST /api/v1/sources
{
  "name": "Khmer Times",
  "country": "KH",
  "language": "en",
  "website_url": "https://www.khmertimeskh.com",
  "feed_url": "https://www.khmertimeskh.com/feed",
  "category": "Cambodia News",
  "trust_level": "VERIFIED_PUBLISHER",
  "fetch_interval_mins": 60,
  "priority": 5
}
```

---

## 2. Ingestion Flow & Deduplication

1. **Polite Request**: Standard User-Agent header and timeout controls.
2. **Canonical Matching**: Deduplication engine normalizes titles and tests Jaccard token overlap against recent items.
3. **Draft Synthesis**: Local or LLM provider creates initial draft summaries, bullet highlights, and SEO tags.
4. **Queue Placement**: Ingested stories land in `AI_DRAFT` status and await human editor review.

## Daily content automation

The existing `worker` service in `docker-compose.yml` checks for work every five
minutes. Keep one worker instance running against the same database as the API.
The schedule is configured in Admin Settings:

| Content | Default cadence |
| --- | --- |
| News: blockchain, technology, Cambodia, world, business, science, travel | Daily, from 07:00 Asia/Phnom_Penh |
| Discoveries | Every 24 hours |
| Travel guides and events | Every 24 hours |
| RSS feeds | Per-source fetch interval |
| Trending and publishing checks | Every worker cycle |

Enable the master autopilot switch and each section in Admin Settings, and configure
and test an AI provider there. Existing saved settings take precedence over defaults;
installations with a saved travel interval of 168 hours must change it to 24 hours.
The blockchain news category is created automatically on its first generation run.
The quiz feature is retired: its public pages return HTTP 410 and the worker no longer
generates quizzes. Daily news is checked before RSS ingestion so slow feed requests do
not delay the scheduled news attempt. Research prompts include the current Cambodia date.
When no provider has web grounding enabled, the daily job refreshes the registered
RSS sources and drafts from publisher-supplied material. It does not ask an ungrounded
model to invent current events. Enable Google Search grounding only after verifying
that the project has the required quota. Ordinary RSS drafting can run without it.

After deploying the code, start or update the worker with `docker compose up -d
--build worker`. Inspect `docker compose logs --tail=100 worker` and the authenticated
`GET /api/v1/admin/autopilot` response to verify the effective settings, last attempt
dates, and publishing holds. A schedule in source code alone does not confirm that
production is running it.

Generated articles start as drafts. `AUTOPILOT_REQUIRE_EDITOR_REVIEW` now defaults to
`true`, which holds generated news, discoveries, guides and events even when a saved
auto-publish switch is enabled. Editors review and publish news in the existing editorial
workspace. Automatic publishing defaults to off. If the review requirement is explicitly
disabled and automatic publishing enabled, eligible drafts pass the editorial gate and
two-hour review window. A successful daily run does
not guarantee a fixed number of published articles: duplicates, provider failures,
and quality holds can reduce output. Generation attempts are recorded before AI calls
to avoid repeated quota spending; a failed daily attempt waits until the next day.

This pipeline creates new editorial content. It does not verify or overwrite hotel
prices, transit timetables, utility rules, or existing factual records every day.
Those require authoritative data integrations and their own validation.
