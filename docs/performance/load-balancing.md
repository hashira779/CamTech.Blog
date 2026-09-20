# Load Balancing & High Availability Architecture

## 1. Pool Topologies
The production platform distributes traffic across two separate upstream clusters:
- **Web Cluster**: 3x Next.js instances (`web-01:3000`, `web-02:3000`, `web-03:3000`)
- **API Cluster**: 3x FastAPI instances (`api-01:8000`, `api-02:8000`, `api-03:8000`)

## 2. Load-Balancing Algorithms & Routing
- **Algorithm**: `least_conn` (routes incoming requests to the instance with the lowest number of active connections).
- **Health-Check Failover**: Configured with `max_fails=3 fail_timeout=10s`. If a node fails consecutive readiness probes, it is immediately removed from the active pool.
- **Graceful Draining**: During deployments, an instance can be placed into `DRAINING` mode via `/system/node-state`. In this state, existing connections finish cleanly while the load balancer routes all new requests to remaining healthy instances.
