import sys
import os
import json
import logging
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.middleware.rate_limiter import RateLimitMiddleware, InMemoryRateLimiter
from app.middleware.security_headers import SecurityHeadersMiddleware, get_cors_origins
from app.middleware.request_logger import RequestLoggerMiddleware
from app.common.audit import log_action, AuditAction
from app.models.audit import AuditLog
from app.common.database import SessionLocal


def test_rate_limiter_in_memory():
    limiter = InMemoryRateLimiter()
    key = "test_client:127.0.0.1"
    limit = 3
    window = 10

    # First 3 requests allowed
    for i in range(limit):
        allowed, rem, retry = limiter.is_allowed(key, max_requests=limit, window_seconds=window)
        assert allowed is True
        assert rem == limit - 1 - i
        assert retry == 0

    # 4th request rejected
    allowed, rem, retry = limiter.is_allowed(key, max_requests=limit, window_seconds=window)
    assert allowed is False
    assert rem == 0
    assert retry > 0

    # Reset
    limiter.reset(key)
    allowed, rem, retry = limiter.is_allowed(key, max_requests=limit, window_seconds=window)
    assert allowed is True


def test_rate_limiting_middleware_429():
    app = FastAPI()
    test_limiter = InMemoryRateLimiter()
    # Configure custom low limit for test: 2 req / min on test path
    app.add_middleware(
        RateLimitMiddleware,
        limits=[
            ("/limited", 2, 60),
            ("/api/v1/auth/login", 10, 60),
            ("/api/v1/search", 30, 60),
            ("*", 60, 60),
        ],
        limiter=test_limiter
    )

    @app.get("/limited")
    def limited_endpoint():
        return {"status": "ok"}

    @app.get("/health")
    def health_endpoint():
        return {"status": "ok"}

    client = TestClient(app)

    # First 2 should succeed
    res1 = client.get("/limited")
    assert res1.status_code == 200
    assert res1.headers["X-RateLimit-Limit"] == "2"
    assert res1.headers["X-RateLimit-Remaining"] == "1"

    res2 = client.get("/limited")
    assert res2.status_code == 200
    assert res2.headers["X-RateLimit-Remaining"] == "0"

    # 3rd should be 429 Too Many Requests
    res3 = client.get("/limited")
    assert res3.status_code == 429
    assert "Retry-After" in res3.headers
    assert int(res3.headers["Retry-After"]) >= 1
    data = res3.json()
    assert data["error"] == "Too Many Requests"

    # Health check is exempt even when limits are exhausted
    res_health = client.get("/health")
    assert res_health.status_code == 200


def test_security_headers_middleware():
    app = FastAPI()
    app.add_middleware(SecurityHeadersMiddleware)

    @app.get("/secure-check")
    def secure_check():
        return {"msg": "secure"}

    client = TestClient(app)
    res = client.get("/secure-check", headers={"X-Request-ID": "custom-uuid-12345"})

    assert res.status_code == 200
    assert res.headers["X-Request-ID"] == "custom-uuid-12345"
    assert res.headers["X-Correlation-ID"] == "custom-uuid-12345"
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "SAMEORIGIN"
    assert res.headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in res.headers
    assert "X-Response-Time" in res.headers


def test_request_logger_middleware(caplog):
    app = FastAPI()
    app.add_middleware(RequestLoggerMiddleware)

    @app.get("/logged-path")
    def logged_path():
        return {"data": "test"}

    @app.get("/health")
    def health():
        return {"ok": True}

    client = TestClient(app)
    with caplog.at_level(logging.INFO, logger="api.access"):
        client.get("/logged-path")
        client.get("/health")

    # /logged-path must be logged as JSON
    found_log = False
    for record in caplog.records:
        if record.name == "api.access":
            data = json.loads(record.message)
            if data.get("path") == "/logged-path":
                found_log = True
                assert data["method"] == "GET"
                assert data["status_code"] == 200
                assert "duration_ms" in data
                assert "client_ip" in data
            # /health must NOT be in api.access logs
            assert data.get("path") != "/health"

    assert found_log is True


def test_cors_origins_helper():
    origins = get_cors_origins()
    assert "http://localhost:3000" in origins
    assert "https://blog.camtech.cam" in origins


def test_audit_log_utility():
    from app.models.user import User
    db = SessionLocal()
    try:
        user = db.query(User).first()
        user_id = user.id if user else None

        # 1. Test log_action with dict details and valid user_id
        audit = log_action(
            user_id=user_id,
            action=AuditAction.PUBLISH,
            resource_type="ARTICLE",
            resource_id="article-abc-123",
            details={"title": "New Article", "editor_notes": "Passed review"},
            ip_address="192.168.1.50",
            user_agent="PyTestClient/1.0",
            request_id="req-audit-999",
            db=db,
        )
        assert audit is not None
        db.commit()
        assert audit.action == "PUBLISH"
        assert audit.entity == "ARTICLE"
        assert audit.entity_id == "article-abc-123"
        assert audit.ip_address == "192.168.1.50"
        assert audit.user_agent == "PyTestClient/1.0"
        assert audit.request_id == "req-audit-999"
        assert "New Article" in audit.new_value_json

        # 2. Test common actions
        assert AuditAction.CREATE == "CREATE"
        assert AuditAction.UPDATE == "UPDATE"
        assert AuditAction.DELETE == "DELETE"
        assert AuditAction.LOGIN == "LOGIN"
        assert AuditAction.LOGOUT == "LOGOUT"
        assert AuditAction.PUBLISH == "PUBLISH"
        assert AuditAction.UNPUBLISH == "UNPUBLISH"

        # 3. Test log_action without explicit db session and user_id=None (anonymous/system action)
        standalone_audit = log_action(
            user_id=None,
            action=AuditAction.LOGIN,
            resource_type="USER",
            resource_id="user-123",
            details={"auth_method": "password"},
            ip_address="10.0.0.1",
            user_agent="Mozilla/5.0 Test",
        )
        assert standalone_audit is not None
        assert standalone_audit.action == "LOGIN"

        # Verify entry exists in DB
        fetched = db.query(AuditLog).filter(AuditLog.id == standalone_audit.id).first()
        assert fetched is not None
        assert fetched.entity == "USER"
        assert fetched.entity_id == "user-123"
        assert fetched.ip_address == "10.0.0.1"

    finally:
        db.close()
