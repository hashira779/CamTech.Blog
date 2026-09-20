# Threat Model & Risk Analysis

## 1. System Assets & Criticality

| Asset | Criticality | Threats | Safeguard |
| :--- | :--- | :--- | :--- |
| **Editorial Publishing Pipeline** | Critical | Unauthorized publishing, AI auto-posting, defacement | 13-point Quality Gate, RBAC, mandatory editor review |
| **Source Ingestion Engine** | High | SSRF, internal port scanning, malformed XML zip-bombs | `validate_url_safe`, DNS pre-resolution, 5MB body cap |
| **User & Admin Credentials** | Critical | Credential stuffing, brute force, token leakage | Bcrypt password hashing, 5 req/min rate limit, HttpOnly cookies |
| **Database (PostgreSQL)** | Critical | SQL injection, connection exhaustion, slow query DoS | ORM parameterized queries, connection pooling, statement timeouts |
| **Public Availability (Uptime)** | High | Layer 7 DDoS, breaking news traffic spikes | Cloudflare WAF, NGINX microcaching, ISR stale-while-revalidate |

---

## 2. Threat Actors & Scenarios

### Actor 1: Malicious External Scraper / Botnet
- **Vector**: Rapid repeated queries to `/api/v1/search` or `/api/v1/articles` to exhaust server resources.
- **Defense**: Edge rate limiting (30 searches/min), sliding window token bucket, blocking known bad user agents (`sqlmap`, `nikto`, `masscan`).

### Actor 2: Rogue Feed Provider or Compromised Source
- **Vector**: Poisoned RSS feed redirecting to `http://169.254.169.254/latest/meta-data` or internal network subnet `192.168.1.1`.
- **Defense**: SSRF validation on every redirect hop; immediate abort on loopback, private, or link-local IP resolution; payload size cap.

### Actor 3: Compromised Contributor Account
- **Vector**: Attempting to publish unreviewed content or modify global site settings.
- **Defense**: Granular RBAC (`AUTHOR` can only draft, only `EDITOR` and `ADMIN` can approve and publish); immutable revision history in `article_revisions`.
