# Sliding-Window Rate Limiting Architecture

## 1. Rate Limiting Tiers

| Tier | Endpoints | Limit | Window | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **LOGIN** | `/api/v1/auth/login` | 5 req | 60 sec | Prevents brute force and credential stuffing |
| **SEARCH** | `/api/v1/search` | 30 req | 60 sec | Protects database full-text search resources |
| **TOOL_EXECUTE**| `/api/v1/tools/execute` | 30 req | 60 sec | Prevents CPU abuse on server fallbacks |
| **ADMIN** | `/api/v1/admin/*` | 60 req | 60 sec | Restricts high-privilege operations |
| **DEFAULT** | Public GET endpoints | 120 req | 60 sec | Absorbs normal browsing and legitimate bots |

## 2. Sliding-Window Implementation
- Implemented in `app.common.rate_limiter.SlidingWindowRateLimiter`.
- Uses a rolling queue of timestamps per IP key. Timestamps outside the sliding window are pruned on each request.
- Returns HTTP `429 Too Many Requests` with `Retry-After: {seconds}` header when limits are reached.
