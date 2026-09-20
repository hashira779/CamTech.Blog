# Daily Discovery — Incident Response Playbook

## 1. Response Workflow
```text
Detect → Classify → Contain → Protect → Investigate → Recover → Monitor → Document
```

## 2. Emergency Scenarios
* **DDoS Attack:** Enable Cloudflare "Under Attack" mode, lower rate limits, block malicious ASNs.
* **Malicious Ingestion / Feed Outage:** The circuit breaker trips open automatically; editors can manually pause affected source registry records from `/admin`.
* **Database Connection Storm:** PgBouncer / SQLAlchemy pool limits cap concurrent connections; fallback to Redis cached HTML.
* **Admin Credential Compromise:** Invalidate all active JWT tokens by rotating signing secrets; force session logout.

See [Security Incident Response](/docs/security/incident-response.md) for full contact trees and severity classifications.
