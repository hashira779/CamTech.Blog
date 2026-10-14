"""
Audit Logging Utility.

Provides standard action constants and a centralized `log_action` helper
for creating structured audit entries with user, action, resource, IP address,
and user-agent context.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Union
from starlette.requests import Request
from sqlalchemy.orm import Session

from app.common.database import SessionLocal
from app.models.audit import AuditLog

logger = logging.getLogger("audit")


class AuditAction:
    """Standardized action verbs for audit logs."""
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PUBLISH = "PUBLISH"
    UNPUBLISH = "UNPUBLISH"
    ARCHIVE = "ARCHIVE"
    RESTORE = "RESTORE"
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"


def _extract_request_metadata(request: Optional[Request]):
    """Safely extract client IP, user agent, and request ID from a Request object."""
    if not request:
        return None, None, None

    # Client IP
    client_ip = (
        request.headers.get("CF-Connecting-IP")
        or request.headers.get("X-Forwarded-For")
    )
    if client_ip:
        client_ip = client_ip.split(",")[0].strip()
    elif request.client and request.client.host:
        client_ip = request.client.host
    else:
        client_ip = None

    # User Agent
    user_agent = request.headers.get("user-agent")

    # Request / Correlation ID
    request_id = (
        getattr(request.state, "request_id", None)
        or request.headers.get("X-Request-ID")
        or request.headers.get("X-Correlation-ID")
    )

    return client_ip, user_agent, request_id


def log_action(
    user_id: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Union[str, int],
    details: Optional[Union[dict, list, str]] = None,
    db: Optional[Session] = None,
    request: Optional[Request] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_id: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
) -> Optional[AuditLog]:
    """
    Log an administrative or user action to the audit_logs table.

    Args:
        user_id: ID of the user performing the action (None for system/anonymous actions)
        action: Audit action verb (e.g. AuditAction.CREATE, AuditAction.LOGIN, etc.)
        resource_type: Target entity/resource type (e.g. 'ARTICLE', 'USER', 'SOURCE')
        resource_id: Identifier of the target resource
        details: Optional dict or string containing contextual change details
        db: Optional existing SQLAlchemy session. If omitted, a scoped session is used.
        request: Optional Starlette/FastAPI Request object for auto-detecting IP and User-Agent
        ip_address: Optional explicit IP override
        user_agent: Optional explicit User-Agent override
        request_id: Optional explicit Request-ID override
        old_value: Optional previous state value (string or serializable object)
        new_value: Optional new state value (string or serializable object)

    Returns:
        The created AuditLog instance, or None if creation failed non-critically.
    """
    try:
        # Extract metadata from request if provided
        req_ip, req_ua, req_id = _extract_request_metadata(request)
        final_ip = ip_address or req_ip
        final_ua = user_agent or req_ua
        final_req_id = request_id or req_id

        # Format old and new values
        def _to_json_str(val: Any) -> Optional[str]:
            if val is None:
                return None
            if isinstance(val, (dict, list)):
                return json.dumps(val, default=str)
            return str(val)

        old_val_str = _to_json_str(old_value)

        # Merge details into new_value if new_value was not provided
        if new_value is not None:
            new_val_str = _to_json_str(new_value)
        elif details is not None:
            new_val_str = _to_json_str(details)
        else:
            new_val_str = None

        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action=action.upper(),
            entity=resource_type.upper(),
            entity_id=str(resource_id),
            old_value_json=old_val_str,
            new_value_json=new_val_str,
            ip_address=final_ip[:50] if final_ip else None,
            user_agent=final_ua[:300] if final_ua else None,
            request_id=final_req_id[:100] if final_req_id else None,
            created_at=datetime.now(timezone.utc),
        )

        should_close = False
        active_db = db
        if active_db is None:
            active_db = SessionLocal()
            should_close = True

        try:
            active_db.add(audit_entry)
            if should_close:
                active_db.commit()
                active_db.refresh(audit_entry)
            else:
                active_db.flush()
        finally:
            if should_close:
                active_db.close()

        return audit_entry

    except Exception as e:
        logger.error(f"Failed to record audit log for action '{action}' on {resource_type}:{resource_id}: {e}")
        return None
