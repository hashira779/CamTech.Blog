# Daily Discovery — Security Architecture

## 1. Zero-Trust Defense in Depth
* **Edge & WAF:** Cloudflare DDoS mitigation, rate limiting, and IP reputation scoring.
* **Middleware Controls:** Rate limiting (token bucket per IP/endpoint class), Correlation ID (`X-Request-ID`), Security Headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).
* **SSRF Protection:** Strict outbound IP blocking of `127.0.0.1`, loopback, RFC 1918 private subnets, cloud metadata (`169.254.169.254`), and unsafe URL schemes.
* **Server-Side Authorization:** Role-based access control (RBAC) enforced on FastAPI endpoints, never trusting client-side state.
* **Audit Logging:** Every sensitive mutation (publish, status change, merge, moderation) is persisted with actor, old/new values, IP, and timestamp.

For detailed security guidelines:
* [Architecture](/docs/security/architecture.md)
* [Authentication](/docs/security/authentication.md)
* [Authorization](/docs/security/authorization.md)
* [SSRF Protection](/docs/security/ssrf-protection.md)
* [Rate Limiting](/docs/security/rate-limiting.md)
* [Incident Response](/docs/security/incident-response.md)
