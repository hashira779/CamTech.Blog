# Role-Based Access Control (RBAC) & Authorization

## 1. Role Hierarchy & Capabilities

```
SUPER_ADMIN
    ├── Full access to settings, security telemetry, user management, and databases
    └── ADMIN
          ├── Editorial oversight, source management, and analytics review
          └── EDITOR
                ├── Quality Gate review, article publication, and revision rollbacks
                └── AUTHOR
                      ├── Create and edit own drafts only (cannot publish directly)
```

## 2. Server-Side Enforcement
- Authorization is verified at the FastAPI dependency layer (`require_admin`, `require_editor`, `get_current_user`).
- Client-provided roles, permissions, or user IDs are ignored; identity is strictly extracted from verified JWT tokens.
- Every state change writes an immutable entry to `AuditLog`.
