"""The wedding tables have exactly one public API: apps/wedding-service.

The main API used to mount its own /api/v1/wedding router over the same tables. The admin nginx
proxies every /api/ path here, so that copy was reachable at cms.camtech.cam with no rate limit on
/auth (unbounded password guessing against any couple's phone), no URL validation on /my-card
(javascript: links stored for the public page to render) and published-by-default cards carrying a
placeholder bank account. These tests keep it from coming back.
"""
from app.main import app


def test_main_api_serves_no_wedding_routes():
    # The OpenAPI paths, not app.routes: FastAPI >= 0.141 nests included routers, so a walk of
    # app.routes alone sees no /api/v1 path at all and this would pass vacuously.
    paths = list(app.openapi()["paths"])
    assert any(p.startswith("/api/v1/admin") for p in paths), "route listing came back empty"
    assert not [p for p in paths if p.startswith("/api/v1/wedding")]


def test_wedding_models_stay_registered_for_alembic():
    # Removing them would make `alembic revision --autogenerate` propose dropping live tables
    from app.common.database import Base

    assert {"wedding_users", "wedding_cards", "wedding_wishes"} <= set(Base.metadata.tables)
