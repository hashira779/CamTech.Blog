import os
import sys
import tempfile

import pytest

# The service imports its modules flat (database, models, routes), and database.py reads
# DATABASE_URL at import time, so both must be set before anything is collected.
SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, SERVICE_DIR)
_DB_DIR = tempfile.mkdtemp(prefix="wedding_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_DB_DIR, 'wedding.db')}"
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("JWT_SECRET", "pytest_only_wedding_signing_key_not_used_anywhere_000000")

from fastapi.testclient import TestClient  # noqa: E402

import routes  # noqa: E402
from database import Base, engine  # noqa: E402
from main import app  # noqa: E402
from security import rate_limiter  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_state(tmp_path, monkeypatch):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    rate_limiter._hits.clear()
    # Never write test images into the real uploads folder
    monkeypatch.setattr(routes, "UPLOAD_DIR", str(tmp_path))
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def sign_in(client, phone="012345678", password="secret-pass", username="Couple"):
    res = client.post("/api/v1/wedding/auth", json={"phone": phone, "password": password, "username": username})
    assert res.status_code == 200, res.text
    body = res.json()
    return {"Authorization": f"Bearer {body['access_token']}"}, body
