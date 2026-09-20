# Server-Side Request Forgery (SSRF) Protection

## 1. Threat Definition
Because Daily Discovery ingests external RSS feeds, checks source URLs, and queries external APIs, the application server could be coerced into querying internal infrastructure, cloud metadata services, or private subnets if destination URLs are unvalidated.

## 2. Multi-Stage Defense in `app.common.ssrf`

```
Destination URL
       ↓
Scheme Validation (http/https only)
       ↓
Prohibited Hostname Filter (localhost, 127.0.0.1, 0.0.0.0, metadata.google.internal)
       ↓
Pre-Fetch DNS Resolution (socket.getaddrinfo)
       ↓
IP Address Space Validation (is_safe_ip)
  - Prohibit Loopback (127.0.0.0/8, ::1)
  - Prohibit Private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
  - Prohibit Link-Local / Cloud Metadata (169.254.0.0/16, fe80::/10)
  - Prohibit Multicast / Reserved
       ↓
Safe Outbound Fetch with Max Body Limit (5MB)
       ↓
Redirect Re-Validation (each hop re-checked)
```

Any violation immediately trips a `SecurityEvent` log with `SSRF_ATTEMPT` type and blocks the request.
