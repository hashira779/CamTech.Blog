# Daily Discovery — Load Balancing & Traffic Distribution

## 1. Upstream Topology
Load balancing distributes incoming traffic across identical stateless application nodes:

```text
Internet → Cloudflare Edge → NGINX Load Balancer → [Next.js Pool] → [FastAPI Pool]
```

## 2. Health Probes
* `/live`: Confirms process is alive and accepting connections.
* `/ready`: Confirms application dependencies (PostgreSQL, Redis) are reachable.
* `/health`: Comprehensive operational diagnostics.

## 3. Graceful Draining
During rolling deployments:
```text
RUNNING → DRAINING (finish active requests) → SHUTDOWN
```
Unhealthy nodes are automatically excluded from the upstream pool within 5 seconds.

See [Infrastructure Load Balancing](/docs/performance/load-balancing.md) for NGINX and Cloudflare configuration files.
