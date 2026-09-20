# API Security Architecture

## 1. Input Validation & Strict Typing
- All incoming HTTP request payloads are validated using Pydantic schemas before reaching route handlers.
- Unknown fields are stripped; type conversions are strictly validated.
- Query parameters (e.g. `limit`, `page`) have hard upper bounds (`limit <= 100`).

## 2. CORS Policy
- Allowed origins are restricted to configured frontends (`http://localhost:3000`, production domain).
- `Access-Control-Allow-Origin: *` is prohibited for state-changing or authenticated routes.
- Exposed headers include `X-Request-ID`, `X-Correlation-ID`, `X-Response-Time`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

## 3. Safe Error Masking
- Uncaught 500 exceptions in production return generic error responses with a correlation `request_id`.
- Stack traces, database connection strings, and local file paths are never exposed to public clients.
