# Database Backup & Disaster Recovery (DR)

## 1. Recovery Objectives
- **Recovery Point Objective (RPO)**: <= 1 Hour (Maximum acceptable data loss in disaster).
- **Recovery Time Objective (RTO)**: <= 30 Minutes (Maximum downtime to restore operations).

## 2. Backup Strategy
- **Continuous WAL Archiving**: Point-In-Time Recovery (PITR) enabled in PostgreSQL.
- **Daily Automated Full Snapshots**: Nightly encrypted dumps to an offsite S3-compatible cold storage bucket.
- **Verification Drills**: Bi-monthly restoration drills on isolated staging environments to ensure backup image integrity.

## 3. Disaster Recovery Runbook
1. Provision standby database instance from latest snapshot.
2. Replay Write-Ahead Logs up to target timestamp.
3. Update `DATABASE_URL` secret in load balancer / deployment manager.
4. Verify `/ready` probe returns `{"status":"ready"}` before opening traffic.
