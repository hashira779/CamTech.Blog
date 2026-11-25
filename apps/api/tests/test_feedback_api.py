from itertools import count
from fastapi.testclient import TestClient
from app.main import app
from app.models.feedback import FeedbackReport
from app.common.database import SessionLocal

_IPS = count(10)


def _client() -> TestClient:
    return TestClient(app, headers={"X-Real-IP": f"198.51.100.{next(_IPS) % 240}"})


def test_feedback_report_submission_spam_blocks_and_admin_auth():
    client = _client()

    # Link spam rejected cleanly
    spam = client.post(
        "/api/v1/feedback",
        json={
            "topic": "bug",
            "page_path": "/cambodia",
            "message": "Buy now https://evil1.example and https://evil2.example",
        },
    )
    assert spam.status_code == 400

    # Valid whole-site report saves cleanly
    ok = client.post(
        "/api/v1/feedback",
        json={
            "topic": "travel",
            "name": "Sokha",
            "reply_email": "sokha@example.com",
            "page_path": "/travel/place/koh-kong-krao-island-7762",
            "message": "The boat departure time in Kampot section looks outdated.",
        },
    )
    assert ok.status_code == 201
    created_id = ok.json()["id"]
    assert ok.json()["status"] == "NEW"
    assert ok.json()["page_path"] == "/travel/place/koh-kong-krao-island-7762"

    # Unauthenticated admin inbox read must fail 401
    unauth = client.get("/api/v1/admin/feedback")
    assert unauth.status_code == 401

    # Cleanup test record
    db = SessionLocal()
    try:
        item = db.query(FeedbackReport).filter(FeedbackReport.id == created_id).first()
        if item:
            db.delete(item)
            db.commit()
    finally:
        db.close()
