# Daily Discovery Security Architecture

## 1. Zero-Trust & Defense-in-Depth Model

Security in Daily Discovery is not an afterthought or single boundary. It is implemented across multiple concentric layers:

```
Internet → Cloudflare Edge (WAF & DDoS) → Load Balancer (NGINX Rate Limiting) → Application Middleware (Security Headers & Correlation) → Auth & RBAC Layer → Database Connection Pool & Parameterized Queries → Encrypted Storage
```

### Core Principles
1. **Never Trust, Always Verify**: Even requests originating from internal microservices or authenticated sessions must have their inputs and authorization parameters verified on every call.
2. **Fail Closed**: If authorization or signature verification cannot be completed, the system denies access by default.
3. **Least Privilege**: Application instances, database users, and admin roles operate with the absolute minimum set of capabilities needed for their responsibilities.

---

## 2. OWASP Top 10:2025 Compliance Matrix

| OWASP Risk Category | Architectural Defense Implemented |
| :--- | :--- |
| **A01: Broken Access Control** | Server-side RBAC dependencies (`require_admin`, `require_editor`), rejection of client-provided IDs, isolated `/admin` routes. |
| **A02: Cryptographic Failures** | TLSv1.3 enforced, salt-hashed `bcrypt` password hashing, short-lived JWTs, HSTS preloading (`max-age=63072000`). |
| **A03: Injection** | SQLAlchemy parameterized query binding, Pydantic schema validation, no raw SQL concatenation. |
| **A04: Insecure Design** | 13-point Quality Gate checklist enforcing human verification of AI drafts; dormant AdSlot architecture preventing CLS. |
| **A05: Security Misconfiguration** | Automated security headers (`X-Content-Type-Options: nosniff`, `SAMEORIGIN`, restrictive Permissions-Policy), debug disabled in production. |
| **A06: Vulnerable Dependencies** | Pinned dependencies in lockfiles, regular `npm audit` and `pip-audit` checks. |
| **A07: Identification & Auth Failures** | Sliding window rate limiting on `/api/v1/auth/login` (5 attempts/min), secure session expiration, password complexity enforcement. |
| **A08: Software & Data Integrity Failures** | Ingestion pipeline with Jaccard deduplication, SSRF blocking on all outbound feeds, quarantined `AI_DRAFT` state. |
| **A09: Security Logging & Monitoring** | `SecurityEvent` model tracking blocked threats, rate limits, and audit logs with correlation IDs (`X-Request-ID`). |
| **A10: SSRF** | `validate_url_safe` verifying hostname, DNS resolution, and prohibiting private/loopback/link-local/cloud-metadata IP spaces. |
