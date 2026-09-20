# Load & Stress Testing Protocols

## 1. Concurrency Benchmarking Tiers
Simulated using k6 and autocannon:
- **Baseline**: 100 concurrent virtual users (steady state)
- **Breaking News Surge**: 1,000 concurrent virtual users
- **Stress & Viral Spike**: 5,000 concurrent virtual users

## 2. Success Criteria
- **Error Rate**: < 0.1% HTTP 5xx responses under peak load.
- **p95 Response Time**: < 150ms for cached public pages; < 400ms for dynamic API endpoints.
- **Connection Saturation**: Database connection pool must never exceed configured maximums.
- **Recovery Time**: System automatically stabilizes within 10 seconds of traffic returning to normal levels.
