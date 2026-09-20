import time
import os
from enum import Enum
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.common.database import get_db, engine
from app.common.config import settings
from app.common.circuit_breaker import get_all_circuit_breakers_status
from app.services.auth_service import require_admin
from app.models.user import User

router = APIRouter(tags=["Observability & System Health"])

class NodeState(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"
    DRAINING = "DRAINING"
    MAINTENANCE = "MAINTENANCE"

# Global instance node state
CURRENT_NODE_STATE = NodeState.HEALTHY
PROCESS_START_TIME = time.time()

@router.get("/health")
def liveness_check():
    """
    Immediate liveness check (Section 5).
    Answers: 'Is the process alive?'
    Does NOT perform expensive database queries or I/O.
    """
    return {
        "status": "ok",
        "node_state": CURRENT_NODE_STATE.value,
        "app": settings.APP_NAME,
        "uptime_seconds": int(time.time() - PROCESS_START_TIME),
        "timestamp": time.time()
    }

@router.get("/live")
def live_check():
    """Standard Kubernetes / Load Balancer liveness alias."""
    return liveness_check()

@router.get("/ready")
def readiness_check():
    """
    Production readiness probe (Section 5 & 6).
    Answers: 'Can this instance safely receive production traffic?'
    Verifies database connectivity, circuit breaker health, and node state.
    """
    # 1. If instance is intentionally draining or under maintenance, return 503 so LB reroutes
    if CURRENT_NODE_STATE in (NodeState.DRAINING, NodeState.MAINTENANCE):
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "node_state": CURRENT_NODE_STATE.value,
                "message": f"Instance is in {CURRENT_NODE_STATE.value} mode. Do not route new traffic."
            }
        )

    # 2. Check Database Connection
    db_start = time.time()
    db_healthy = False
    db_latency_ms = 0
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_healthy = True
        db_latency_ms = int((time.time() - db_start) * 1000)
    except Exception as e:
        db_healthy = False
        db_error = str(e)

    # 3. Check Circuit Breakers
    cbs = get_all_circuit_breakers_status()
    any_open = any(cb["state"] == "OPEN" for cb in cbs.values())

    # 4. Synthesize Overall Status
    overall_status = NodeState.HEALTHY
    if not db_healthy:
        overall_status = NodeState.UNHEALTHY
    elif any_open:
        overall_status = NodeState.DEGRADED

    response_payload = {
        "status": "ready" if overall_status != NodeState.UNHEALTHY else "unhealthy",
        "node_state": overall_status.value,
        "dependencies": {
            "database": {
                "status": "connected" if db_healthy else "disconnected",
                "latency_ms": db_latency_ms
            },
            "circuit_breakers": cbs
        },
        "uptime_seconds": int(time.time() - PROCESS_START_TIME)
    }

    if overall_status == NodeState.UNHEALTHY:
        return JSONResponse(status_code=503, content=response_payload)

    return response_payload

@router.post("/system/node-state")
def set_node_state(
    new_state: NodeState,
    current_user: User = Depends(require_admin)
):
    """
    Sets node state (e.g. DRAINING for zero-downtime deployment or MAINTENANCE).
    """
    global CURRENT_NODE_STATE
    CURRENT_NODE_STATE = new_state
    return {"message": f"Node state updated to {new_state.value}", "node_state": new_state.value}
