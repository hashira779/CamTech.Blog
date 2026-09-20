# Daily Discovery REST API Specification (`/api/v1`)

The FastAPI backend exposes versioned, RESTful endpoints formatted with JSON payloads and standard HTTP status codes.

---

## 1. Public Content Endpoints

### Articles
- `GET /api/v1/articles`
  - Query parameters: `country` (e.g. `KH`, `WORLD`), `category` (slug), `status` (default: `PUBLISHED`), `search`, `page`, `limit`.
  - Returns paginated list of articles.
- `GET /api/v1/articles/{slug_or_id}`
  - Returns full article details and automatically increments view telemetry.

### Discoveries
- `GET /api/v1/discoveries`
  - List published visual discoveries.
- `GET /api/v1/discoveries/{slug}`
  - Returns visual diagram data, step breakdowns, and scientific source references.

### Quizzes
- `GET /api/v1/quizzes/daily`
  - Returns today's active daily knowledge challenge.
- `POST /api/v1/quizzes/{id}/attempt`
  - Payload: `{"session_id": "...", "answers": {"q_id": 0}}`
  - Returns calculated score, percentage, and detailed answer explanations.

### Tools
- `GET /api/v1/tools`
  - Returns active tool registry.
- `POST /api/v1/tools/execute`
  - Payload: `{"tool_slug": "percentage-calculator", "action": "calculate", "parameters": {...}}`

### Search & Trending
- `GET /api/v1/search?q={query}&category={slug}&country={country}`
  - Multi-field faceted search across articles, discoveries, quizzes, and tools.
- `GET /api/v1/trending`
  - Returns Cambodia, Worldwide, and Editor's picks sorted by time-decay algorithm.

---

## 2. Admin & CMS Endpoints (Protected)

- `POST /api/v1/auth/login`: Authenticate and receive bearer JWT.
- `GET /api/v1/admin/dashboard-stats`: Metrics KPIs, pageviews, and source health.
- `GET /api/v1/admin/review-queue`: Unreviewed items for the 3-column review workspace.
- `POST /api/v1/admin/review-action`: Approve, reject, or request revision.
- `POST /api/v1/articles/{id}/publish`: Runs mandatory 13-point Quality Gate checklist before publishing.
