# Security Incident Response Plan

## 1. Incident Lifecycle

```
[Phase 1: Detect] → [Phase 2: Classify] → [Phase 3: Contain] → [Phase 4: Eradicate] → [Phase 5: Recover] → [Phase 6: Post-Mortem]
```

## 2. Classification & Severity Matrix

| Level | Criteria | Immediate Action |
| :--- | :--- | :--- |
| **P1 - CRITICAL** | Active database breach, admin credential compromise, massive DDoS knocking out service. | Engage incident lead, activate Cloudflare Under-Attack mode, rotate JWT/DB secrets, isolate affected nodes. |
| **P2 - HIGH** | High rate of SSRF deflections, repeated failed admin logins, circuit breakers permanently tripped. | Block offending ASN/IP ranges at WAF, inspect feed sources, check node health. |
| **P3 - MEDIUM** | Normal rate limiter triggers, isolated single IP probes. | Monitored via `/admin/security` dashboard; no manual intervention required. |

## 3. Communication Protocol
- Operational contact: `security-ops@dailydiscovery.com`
- All containment steps, IP blocks, and token revocations must be logged into `AuditLog` for auditability.
