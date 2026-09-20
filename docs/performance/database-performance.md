# Database Performance & Connection Protection

## 1. Connection Pooling Strategy
- **PgBouncer & SQLAlchemy Pool**: `pool_size = 20`, `max_overflow = 10`, `pool_recycle = 1800`.
- **Pre-Ping**: `pool_pre_ping = True` tests connections before assigning them to requests, avoiding stale connection errors.
- **Statement Timeouts**: Database sessions enforce a 5-second statement timeout to prevent runaway queries from blocking connection slots.

## 2. Index Optimization
- B-Tree indexes on all frequently filtered columns:
  - `idx_articles_slug` (Exact match lookup)
  - `idx_articles_status_pub` (Composite index on status + published_at for chronological feeds)
  - `idx_articles_country` (Fast country filtering for Cambodia & World hubs)
- Full-text search queries utilize trigram / gin index patterns to prevent sequential table scans.
