# Operations & Maintenance Guide

Operational procedures for backing up, monitoring, and maintaining Daily Discovery.

---

## 1. Health & Readiness Monitoring

The backend exposes lightweight monitoring endpoints (Section 49):
- `GET /health`: Basic process liveness check.
- `GET /ready`: Evaluates database connection and query readiness.

---

## 2. Backup & Recovery

### PostgreSQL Database Dump
```bash
# Automated daily backup
pg_dump -U dd_user -d daily_discovery -F c -b -v -f /backups/daily_discovery_$(date +%Y%m%d).dump
```

### Media Assets Backup
When using local storage (`STORAGE_PROVIDER=local`), ensure the `./uploads` directory is mirrored to an offsite S3/R2 backup bucket.

---

## 3. Audit Log Inspection

Admins can review user actions, published stories, and editorial revisions via `/api/v1/admin/audit-logs` or the Admin CMS interface at `/admin`.
