# Observability, Telemetry & Request Correlation

## 1. Request Tracing & Correlation IDs
- Every request is tagged with an `X-Request-ID` and `X-Correlation-ID` at the edge/load balancer or security middleware.
- Passed through Next.js, FastAPI, workers, and database query comments.
- Allows tracing a single user transaction across all distributed tiers in logs.

## 2. Telemetry Endpoints & Health Probes
- `/health`: Fast, non-blocking process liveness probe.
- `/ready`: Deep dependency readiness probe verifying database connectivity, circuit breaker states, and node status.
- `/live`: Kubernetes / load-balancer alias.
- `/api/v1/admin/infrastructure/stats`: Live cluster telemetry queried by the Admin CMS dashboard (`/admin/infrastructure`).
- `/api/v1/admin/security/stats`: Security event stream and threat classification queried by `/admin/security`.
