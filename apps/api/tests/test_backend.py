import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.deduplication.detector import normalize_title, calculate_jaccard_similarity, detect_duplicates
from app.services.tool_service import ToolService

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Daily Discovery" in data["app"]

def test_readiness_check():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"

def test_list_articles():
    response = client.get("/api/v1/articles")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] > 0
    first = data["items"][0]
    assert "title" in first
    assert "summary" in first
    assert "primary_source_url" in first

def test_get_cambodia_news():
    response = client.get("/api/v1/articles?country=KH")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["country"] == "KH"

def test_get_world_news():
    response = client.get("/api/v1/articles?country=WORLD")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["country"] == "WORLD"

def test_list_discoveries():
    response = client.get("/api/v1/discoveries")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert any("GPS" in d["title"] for d in data["items"])

def test_daily_quiz():
    response = client.get("/api/v1/quizzes/daily")
    assert response.status_code == 200
    quiz = response.json()
    assert quiz["is_daily"] is True
    assert len(quiz["questions"]) >= 5

def test_quiz_attempt_scoring():
    response = client.get("/api/v1/quizzes/daily")
    quiz = response.json()
    quiz_id = quiz["id"]
    q1 = quiz["questions"][0]

    # Submit an answer
    payload = {
        "session_id": "test_session_123",
        "answers": {q1["id"]: 0}  # Choosing 0
    }
    submit_res = client.post(f"/api/v1/quizzes/{quiz_id}/attempt", json=payload)
    assert submit_res.status_code == 200
    result = submit_res.json()
    assert "score" in result
    assert "percentage" in result
    assert len(result["results"]) > 0

def test_tool_percentage_calculator():
    res = ToolService.execute_tool(
        slug="percentage-calculator",
        action="calculate",
        params={"calc_type": "what_is_p_of_x", "percent": 25, "value": 200}
    )
    assert res["result"] == 50.0

def test_tool_loan_calculator():
    res = ToolService.execute_tool(
        slug="loan-calculator",
        action="calculate",
        params={"principal": 10000, "annual_rate": 6.0, "tenure_months": 12}
    )
    assert "monthly_emi" in res
    assert res["monthly_emi"] > 800

def test_tool_json_formatter():
    res = ToolService.execute_tool(
        slug="json-formatter",
        action="format",
        params={"input": '{"name":"Daily Discovery","ver":1}'}
    )
    assert res["valid"] is True
    assert "\n" in res["formatted"]

def test_duplicate_detection():
    title1 = "Cambodia Accelerates Bakong Digital Payment Interoperability"
    title2 = "Cambodia accelerates Bakong digital payments interoperability across ASEAN!"
    
    sim = calculate_jaccard_similarity(title1, title2)
    assert sim > 0.6  # High topic similarity

    candidates = [{"id": "1", "title": title1, "url": "https://example.com/art1"}]
    dups = detect_duplicates(title2, "https://example.com/art2", candidates)
    assert len(dups) > 0
    assert dups[0]["reason"] == "HIGH_TOPIC_SIMILARITY"

def test_trending_engine():
    response = client.get("/api/v1/trending")
    assert response.status_code == 200
    data = response.json()
    assert "cambodia" in data
    assert "world" in data
    assert "editor_picks" in data

def test_search():
    response = client.get("/api/v1/search?q=Bakong")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert any("Bakong" in r["title"] for r in data["results"])

def test_list_authors():
    response = client.get("/api/v1/authors")
    assert response.status_code == 200
    authors = response.json()
    assert len(authors) > 0
    assert "slug" in authors[0]
    assert "name" in authors[0]

def test_sources_registry():
    response = client.get("/api/v1/sources")
    assert response.status_code == 200
    sources = response.json()
    assert len(sources) > 0
    assert "trust_level" in sources[0]

def test_ssrf_validator():
    from app.common.ssrf import validate_url_safe
    # Block loopback and local IPs
    safe, err = validate_url_safe("http://127.0.0.1/admin")
    assert safe is False
    assert "prohibited" in err.lower()

    # Block AWS/cloud metadata IP
    safe, err = validate_url_safe("http://169.254.169.254/latest/meta-data")
    assert safe is False

    # Block non-HTTP schemes
    safe, err = validate_url_safe("file:///etc/passwd")
    assert safe is False

    # Allow valid public domains
    safe, _ = validate_url_safe("https://www.reuters.com/rss")
    assert safe is True

def test_circuit_breaker_states():
    from app.common.circuit_breaker import CircuitBreaker, CircuitState
    cb = CircuitBreaker(name="test_service", failure_threshold=2, recovery_timeout_seconds=0.1)
    assert cb.state == CircuitState.CLOSED
    assert cb.can_execute() is True

    # Record 2 failures -> should transition to OPEN
    cb.record_failure()
    cb.record_failure()
    assert cb.state == CircuitState.OPEN
    assert cb.can_execute() is False

    # Wait for recovery timeout -> should allow half-open execution
    import time
    time.sleep(0.15)
    assert cb.can_execute() is True
    assert cb.state == CircuitState.HALF_OPEN

    # Record 2 successes in HALF_OPEN -> should close
    cb.record_success()
    cb.record_success()
    assert cb.state == CircuitState.CLOSED

def test_security_headers_and_correlation():
    response = client.get("/api/v1/articles")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Content-Type-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert "Strict-Transport-Security" in response.headers
    assert "X-Frame-Options" in response.headers
    assert "X-RateLimit-Limit" in response.headers

def test_health_triad():
    # /health: immediate liveness
    h_res = client.get("/health")
    assert h_res.status_code == 200
    assert h_res.json()["status"] == "ok"

    # /live: liveness alias
    l_res = client.get("/live")
    assert l_res.status_code == 200

    # /ready: readiness probe
    r_res = client.get("/ready")
    assert r_res.status_code == 200
    assert r_res.json()["node_state"] in ("HEALTHY", "DEGRADED")

def test_list_destinations():
    response = client.get("/api/v1/travel/destinations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    slugs = [d["slug"] for d in data]
    assert "siem-reap" in slugs
    assert "phnom-penh" in slugs

def test_get_siem_reap_destination_with_places():
    response = client.get("/api/v1/travel/destinations/siem-reap")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Siem Reap"
    assert len(data["places"]) >= 10
    place_names = [p["name"] for p in data["places"]]
    assert "Angkor Wat" in place_names
    assert "Bayon Temple" in place_names
    assert "Raffles Grand Hotel d'Angkor" in place_names

def test_filter_places_by_type():
    response = client.get("/api/v1/travel/places?destination=siem-reap&type=TEMPLE")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 4
    for p in data["items"]:
        assert p["place_type"] == "TEMPLE"

def test_place_accommodation_specialized_model():
    response = client.get("/api/v1/travel/places/raffles-grand-hotel-dangkor")
    assert response.status_code == 200
    place = response.json()
    assert place["name"] == "Raffles Grand Hotel d'Angkor"
    assert place["accommodation"] is not None
    assert place["accommodation"]["star_rating"] == 5
    assert place["accommodation"]["has_swimming_pool"] is True
    assert place["accommodation"]["booking_url"] is not None

def test_trip_planner_engine_generation():
    payload = {
        "destination_slug": "siem-reap",
        "duration_days": 3,
        "travel_style": "CULTURAL",
        "budget_level": "$$"
    }
    response = client.post("/api/v1/travel/planner/generate", json=payload)
    assert response.status_code == 200
    plan = response.json()
    assert plan["destination_name"] == "Siem Reap"
    assert plan["duration_days"] == 3
    assert len(plan["days"]) == 3
    # Check each day has organized items (morning, lunch, afternoon, evening)
    for day in plan["days"]:
        assert len(day["items"]) >= 3
        times = [item["time_of_day"] for item in day["items"]]
        assert "MORNING" in times

def test_public_place_suggestion_submission():
    payload = {
        "suggestion_type": "NEW_PLACE",
        "place_name": "Banteay Kdei Sacred Cloister",
        "destination_slug": "siem-reap",
        "place_type": "TEMPLE",
        "details": "A serene monastic Buddhist temple compound with beautiful garuda reliefs.",
        "submitter_name": "Traveler John",
        "submitter_contact": "john@example.com"
    }
    response = client.post("/api/v1/travel/suggestions", json=payload)
    assert response.status_code == 200
    suggestion = response.json()
    assert suggestion["id"] is not None
    assert suggestion["status"] == "PENDING"
    assert suggestion["place_name"] == "Banteay Kdei Sacred Cloister"

def test_non_destructive_place_status_management():
    # 1. Fetch place
    p_res = client.get("/api/v1/travel/places/phnom-bakheng")
    assert p_res.status_code == 200
    place_id = p_res.json()["id"]

    # 2. Transition status non-destructively
    patch_res = client.patch(f"/api/v1/travel/places/{place_id}/status?status=TEMPORARILY_CLOSED&reason=Monsoon+Restoration")
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "TEMPORARILY_CLOSED"

    # 3. Restore to ACTIVE
    restore_res = client.patch(f"/api/v1/travel/places/{place_id}/status?status=ACTIVE&reason=Reopened")
    assert restore_res.status_code == 200
    assert restore_res.json()["status"] == "ACTIVE"

def test_dynamic_navigation_config():
    response = client.get("/api/v1/config/navigation")
    assert response.status_code == 200
    items = response.json()
    labels = [item["label"] for item in items]
    assert "Home" in labels
    assert "Cambodia" in labels
    assert "World" in labels
    assert "Discover" in labels
    assert "Travel" in labels
    assert "Quiz" in labels
    assert "Tools" in labels

def test_list_transport_operators():
    response = client.get("/api/v1/transport/operators")
    assert response.status_code == 200
    ops = response.json()
    assert len(ops) >= 4
    slugs = [o["slug"] for o in ops]
    assert "giant-ibis-transport" in slugs
    assert "larryta-express" in slugs

def test_get_operator_detail():
    response = client.get("/api/v1/transport/operators/giant-ibis-transport")
    assert response.status_code == 200
    op = response.json()
    assert op["name"] == "Giant Ibis Transport"
    assert op["operator_type"] == "BUS"
    assert op["rating"] >= 4.8
    assert "Wi-Fi" in op["amenities_json"]

def test_search_transport_routes():
    response = client.get("/api/v1/transport/search?origin=phnom-penh&destination=siem-reap")
    assert response.status_code == 200
    data = response.json()
    assert data["total_options"] >= 2
    first_route = data["routes"][0]
    assert first_route["duration_minutes"] in [300, 360]
    assert first_route["base_price_usd"] in [13.0, 15.0]
    assert len(first_route["schedules"]) > 0

def test_search_transport_hubs():
    response = client.get("/api/v1/transport/hubs")
    assert response.status_code == 200
    hubs = response.json()
    assert len(hubs) >= 5
    assert any("Night Market" in h["name"] for h in hubs)

def test_nearby_search_by_place():
    response = client.get("/api/v1/nearby?place=angkor-wat&radius=10")
    assert response.status_code == 200
    data = response.json()
    assert data["reference_name"] == "Angkor Wat"
    assert data["total"] > 0
    first = data["results"][0]
    assert "distance_km" in first
    assert "estimated_walk_minutes" in first
    assert "estimated_drive_minutes" in first
    assert first["distance_km"] <= 10.0

def test_travel_guides():
    response = client.get("/api/v1/travel-guides")
    assert response.status_code == 200
    guides = response.json()
    assert len(guides) >= 2
    assert any("phnom-penh-to-siem-reap" in g["slug"] for g in guides)

def test_travel_events():
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 2
    assert any("angkor-wat" in e["slug"] for e in events)



