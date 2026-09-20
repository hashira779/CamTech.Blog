# Database Architecture & Entity Specifications

The Daily Discovery database schema is designed for Unicode-safety (supporting mixed English and Khmer text), referential integrity, and rigorous audit trails.

---

## 1. Core Tables & Schemas

### `articles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(36) PK | UUID primary key |
| `slug` | VARCHAR(255) UNIQUE | URL slug indexed for fast lookup |
| `title` | VARCHAR(255) | Canonical headline |
| `title_km` | VARCHAR(255) | Khmer translated headline |
| `summary` | TEXT | Original editorial summary ("What happened?") |
| `key_points` | TEXT | JSON array of 3–5 bullet facts |
| `why_it_matters` | TEXT | Editorial context & broader significance |
| `timeline` | TEXT | JSON array of `{time, event}` milestones |
| `content` | TEXT | Full article body |
| `category_id` | VARCHAR(36) FK | References `categories.id` |
| `author_id` | VARCHAR(36) FK | References `authors.id` |
| `primary_source_id` | VARCHAR(36) FK | References `sources.id` |
| `primary_source_url`| VARCHAR(500) | URL of original reporting |
| `source_attribution_text` | VARCHAR(255) | Display byline attribution |
| `hero_image_url` | VARCHAR(500) | Hero image path |
| `hero_image_credit` | VARCHAR(255) | Required credit attribution |
| `hero_image_license` | VARCHAR(100) | `OWNED`, `LICENSED`, `PUBLIC_DOMAIN`, etc. |
| `status` | VARCHAR(50) | `DRAFT`, `AI_DRAFT`, `IN_REVIEW`, `PUBLISHED`, etc. |
| `quality_checklist_passed` | BOOLEAN | Quality gate flag required for publication |
| `views_count` | INTEGER | Total pageviews |
| `shares_count` | INTEGER | Social shares count |
| `trend_score` | FLOAT | Computed time-decay popularity score |
| `published_at` | DATETIME | Public release timestamp |

### `discoveries`
- Visual explainer content with `visual_sections` (JSON), `important_facts` (JSON), and `diagram_data` (JSON).

### `quizzes` & `quiz_questions`
- Educational trivia with `choices_json`, `correct_answer_idx`, `explanation`, and `source_reference`.

### `sources` & `source_fetch_logs`
- External source registry with trust levels (`OFFICIAL`, `VERIFIED_PUBLISHER`, `WIRE_SERVICE`), fetch intervals, and duration logs.

### `audit_logs`
- Tamper-evident admin log recording user, action, entity, previous value, new value, and timestamp.
