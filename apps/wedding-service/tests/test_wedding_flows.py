"""The invitation lifecycle as the couple and their guests see it, plus the boundaries that keep
one couple's guests, drafts and account away from everyone else."""
import json

from jose import jwt

from auth import JWT_SECRET
from conftest import sign_in

API = "/api/v1/wedding"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def publish(client, headers, **extra):
    res = client.put(f"{API}/my-card", headers=headers, json={"is_published": True, **extra})
    assert res.status_code == 200, res.text
    return res.json()


# ---------------------------------------------------------------- accounts


def test_first_sign_in_creates_an_unpublished_draft(client):
    headers, body = sign_in(client)
    assert body["is_new"] is True
    card = body["card"]
    assert card["is_published"] is False
    # No placeholder bank details on a new card
    assert card["khqr_account_number"] is None
    assert client.get(f"{API}/card/{card['slug']}").status_code == 404


def test_second_sign_in_returns_the_same_card(client):
    _, first = sign_in(client)
    _, second = sign_in(client)
    assert second["is_new"] is False
    assert second["card"]["id"] == first["card"]["id"]


def test_wrong_password_is_refused(client):
    sign_in(client)
    res = client.post(f"{API}/auth", json={"phone": "012345678", "password": "not-it"})
    assert res.status_code == 401


def test_password_guessing_on_one_phone_is_rate_limited_even_across_addresses(client):
    sign_in(client)
    codes = [
        client.post(f"{API}/auth", json={"phone": "012345678", "password": f"guess-{i}"},
                    headers={"CF-Connecting-IP": f"203.0.113.{i}"}).status_code
        for i in range(12)
    ]
    assert 429 in codes


def test_rotating_x_forwarded_for_does_not_reset_the_ip_limit(client):
    # Behind Cloudflare the real address is CF-Connecting-IP; a forged XFF must not win
    codes = [
        client.post(f"{API}/auth", json={"phone": f"0987654{i:02d}", "password": "pw-12345"},
                    headers={"CF-Connecting-IP": "198.51.100.7", "X-Forwarded-For": f"10.0.0.{i}"}).status_code
        for i in range(22)
    ]
    assert 429 in codes


def test_my_card_requires_a_token(client):
    assert client.get(f"{API}/my-card").status_code == 401


def test_a_token_for_another_role_is_refused(client):
    _, body = sign_in(client)
    forged = jwt.encode({"sub": body["user"]["id"], "role": "ADMIN"}, JWT_SECRET, algorithm="HS256")
    res = client.get(f"{API}/my-card", headers={"Authorization": f"Bearer {forged}"})
    assert res.status_code == 401


# ---------------------------------------------------------------- editing and publishing


def test_edits_persist_and_publishing_makes_the_card_public(client):
    headers, body = sign_in(client)
    publish(client, headers, groom_name="Dara", bride_name="Sophea", slug="dara-sophea")
    assert client.get(f"{API}/my-card", headers=headers).json()["groom_name"] == "Dara"
    public = client.get(f"{API}/card/dara-sophea")
    assert public.status_code == 200
    assert public.json()["bride_name"] == "Sophea"
    # The slug a card is served under is the slug it was saved with
    assert public.json()["slug"] == "dara-sophea"


def test_unpublishing_hides_the_card_again(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="hidden-again")
    client.put(f"{API}/my-card", headers=headers, json={"is_published": False})
    assert client.get(f"{API}/card/hidden-again").status_code == 404


def test_script_links_are_refused_everywhere_they_could_render(client):
    headers, _ = sign_in(client)
    bad = "javascript:alert(1)"
    for payload in (
        {"cover_image_url": bad},
        {"music_url": bad},
        {"khqr_image_url": bad},
        {"gallery_images": json.dumps(["https://ok.example/a.jpg", bad])},
        {"evening_reception": json.dumps({"venue": "x", "map_url": bad})},
    ):
        res = client.put(f"{API}/my-card", headers=headers, json=payload)
        assert res.status_code == 422, payload


def test_reserved_and_taken_slugs_are_refused(client):
    a, _ = sign_in(client, phone="011111111")
    b, _ = sign_in(client, phone="022222222")
    assert client.put(f"{API}/my-card", headers=a, json={"slug": "preview-frame"}).status_code == 400
    assert client.put(f"{API}/my-card", headers=a, json={"slug": "sokha-vibol"}).status_code == 200
    assert client.put(f"{API}/my-card", headers=b, json={"slug": "sokha-vibol"}).status_code == 409


def test_null_never_blanks_a_required_field(client):
    headers, body = sign_in(client)
    res = client.put(f"{API}/my-card", headers=headers, json={"groom_name": None, "slug": None})
    assert res.status_code == 200
    assert res.json()["groom_name"] == body["card"]["groom_name"]
    assert res.json()["slug"] == body["card"]["slug"]


# ---------------------------------------------------------------- guests


def test_rsvp_is_stored_but_guest_details_stay_with_the_owner(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="rsvp-card")
    res = client.post(f"{API}/card/rsvp-card/wish", json={
        "guest_name": "Bopha", "phone": "099888777", "attendance": "attending",
        "guest_count": 3, "blessing_message": "Congratulations!",
    })
    assert res.status_code == 201
    assert "phone" not in res.json()

    public = client.get(f"{API}/card/rsvp-card").json()
    assert public["wishes"][0]["guest_name"] == "Bopha"
    assert set(public["wishes"][0]) == {"id", "guest_name", "blessing_message", "created_at"}

    owner = client.get(f"{API}/my-card/responses", headers=headers).json()
    assert owner["summary"] == {"total_responses": 1, "attending": 1, "not_attending": 0,
                                "unsure": 0, "expected_guests": 3}
    assert owner["responses"][0]["phone"] == "099888777"


def test_a_double_submitted_wish_is_stored_once(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="double-tap")
    wish = {"guest_name": "Vanna", "blessing_message": "Happy wedding"}
    first = client.post(f"{API}/card/double-tap/wish", json=wish).json()
    second = client.post(f"{API}/card/double-tap/wish", json=wish).json()
    assert first["id"] == second["id"]
    assert client.get(f"{API}/my-card/responses", headers=headers).json()["summary"]["total_responses"] == 1


def test_honeypot_submissions_are_not_stored(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="honeypot")
    res = client.post(f"{API}/card/honeypot/wish",
                      json={"guest_name": "bot", "blessing_message": "spam", "website": "http://spam"})
    assert res.status_code == 201
    assert client.get(f"{API}/my-card/responses", headers=headers).json()["summary"]["total_responses"] == 0


def test_guests_cannot_respond_to_a_draft(client):
    _, body = sign_in(client)
    res = client.post(f"{API}/card/{body['card']['slug']}/wish",
                      json={"guest_name": "x", "blessing_message": "y"})
    assert res.status_code == 404


def test_one_couple_cannot_delete_another_couples_guest_response(client):
    a, _ = sign_in(client, phone="011111111")
    b, _ = sign_in(client, phone="022222222")
    publish(client, a, slug="couple-a")
    wish_id = client.post(f"{API}/card/couple-a/wish",
                          json={"guest_name": "Guest", "blessing_message": "Hi"}).json()["id"]
    assert client.delete(f"{API}/my-card/responses/{wish_id}", headers=b).status_code == 404
    assert client.get(f"{API}/my-card/responses", headers=b).json()["summary"]["total_responses"] == 0
    assert client.delete(f"{API}/my-card/responses/{wish_id}", headers=a).status_code == 204


# ---------------------------------------------------------------- uploads


def test_uploads_need_an_account_and_a_real_image(client):
    files = {"file": ("x.png", PNG, "image/png")}
    assert client.post(f"{API}/upload", files=files).status_code == 401
    headers, _ = sign_in(client)
    ok = client.post(f"{API}/upload", headers=headers, files=files)
    assert ok.status_code == 200
    assert ok.json()["url"].startswith("/uploads/wedding_") and ok.json()["url"].endswith(".png")
    html = {"file": ("x.png", b"<script>alert(1)</script>", "image/png")}
    assert client.post(f"{API}/upload", headers=headers, files=html).status_code == 415


# ---------------------------------------------------------------- operations


def test_readiness_checks_the_database(client):
    assert client.get(f"{API}/ready").json() == {"status": "ready"}


def test_slug_check_reports_each_link(client):
    a, body = sign_in(client, phone="011111111")
    b, _ = sign_in(client, phone="022222222")
    assert client.put(f"{API}/my-card", headers=b, json={"slug": "dara-bopha"}).status_code == 200
    mine = body["card"]["slug"]
    res = client.get(f"{API}/my-card/slug-check", headers=a,
                     params=[("slug", s) for s in ("dara-bopha", "dara-bopha-2026", mine, "preview", "x")])
    assert res.status_code == 200
    assert [(r["available"], r["reason"]) for r in res.json()] == [
        (False, "taken"), (True, "free"), (True, "yours"), (False, "reserved"), (False, "invalid"),
    ]


def test_slug_check_needs_sign_in(client):
    assert client.get(f"{API}/my-card/slug-check", params={"slug": "abc"}).status_code == 401


def test_a_renamed_link_keeps_working_for_guests(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="heng-bopha-first")
    client.put(f"{API}/my-card", headers=headers, json={"slug": "heng-bopha-wedding"})
    old = client.get(f"{API}/card/heng-bopha-first")
    assert old.status_code == 200
    # The old link answers with the card's current link, so the page can redirect
    assert old.json()["slug"] == "heng-bopha-wedding"
    wish = {"guest_name": "Dara", "attendance": "attending", "guest_count": 2, "blessing_message": "Congratulations"}
    assert client.post(f"{API}/card/heng-bopha-first/wish", json=wish).status_code == 201


def test_another_couple_cannot_take_a_link_guests_still_hold(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="sok-dara-wedding")
    client.put(f"{API}/my-card", headers=headers, json={"slug": "sok-dara-2027"})
    other, _ = sign_in(client, phone="098765432")
    res = client.put(f"{API}/my-card", headers=other, json={"slug": "sok-dara-wedding"})
    assert res.status_code == 409
    check = client.get(f"{API}/my-card/slug-check", headers=other, params={"slug": ["sok-dara-wedding"]})
    assert check.json()[0]["available"] is False


def test_a_couple_can_move_back_to_their_old_link(client):
    headers, _ = sign_in(client)
    publish(client, headers, slug="chan-vanna-wedding")
    client.put(f"{API}/my-card", headers=headers, json={"slug": "chan-vanna-2027"})
    res = client.put(f"{API}/my-card", headers=headers, json={"slug": "chan-vanna-wedding"})
    assert res.status_code == 200 and res.json()["slug"] == "chan-vanna-wedding"
    # The link they left is now the alias, and still reaches them
    assert client.get(f"{API}/card/chan-vanna-2027").json()["slug"] == "chan-vanna-wedding"


def test_names_are_tidied_of_zero_width_characters_and_extra_spaces(client):
    headers, _ = sign_in(client)
    card = publish(client, headers, groom_name="ង៉ាម​     សាន់ដេ", bride_name="  យាន  សុផាន់ណា ")
    assert card["groom_name"] == "ង៉ាម សាន់ដេ"
    assert card["bride_name"] == "យាន សុផាន់ណា"


# ---------------------------------------------------------------- kbach ornaments

def test_couple_sets_replaces_and_removes_ornament_images(client):
    headers, _ = sign_in(client)
    card = publish(client, headers, ornaments={"stage_arch": "/uploads/arch.png", "border": "https://cdn.example.com/b.png"})
    assert card["ornaments"] == {"stage_arch": "/uploads/arch.png", "border": "https://cdn.example.com/b.png"}

    # What is sent is the whole set: a changed link replaces, a missing slot goes back to the drawing
    card = publish(client, headers, ornaments={"stage_arch": "/uploads/arch-2.png", "pendant": "/uploads/p.png"})
    assert card["ornaments"] == {"stage_arch": "/uploads/arch-2.png", "pendant": "/uploads/p.png"}

    # An empty link removes that slot; leaving `ornaments` out of an update keeps them all
    card = publish(client, headers, ornaments={"stage_arch": "/uploads/arch-2.png", "pendant": ""})
    assert card["ornaments"] == {"stage_arch": "/uploads/arch-2.png"}
    card = publish(client, headers, title="Still here")
    assert card["ornaments"] == {"stage_arch": "/uploads/arch-2.png"}

    # Guests get them with the public card
    public = client.get(f"{API}/card/{card['slug']}").json()
    assert public["ornaments"] == {"stage_arch": "/uploads/arch-2.png"}


def test_ornaments_refuse_unknown_places_and_unsafe_links(client):
    headers, _ = sign_in(client)
    for bad in ({"roof_dragon": "/uploads/x.png"}, {"border": "javascript:alert(1)"}, {"border": "data:image/png;base64,AAAA"}):
        res = client.put(f"{API}/my-card", headers=headers, json={"ornaments": bad})
        assert res.status_code == 422, (bad, res.text)
    assert client.get(f"{API}/my-card", headers=headers).json()["ornaments"] == {}


def test_each_couple_only_changes_their_own_ornaments(client):
    alice, _ = sign_in(client, phone="011111111")
    bob, _ = sign_in(client, phone="022222222")
    publish(client, alice, ornaments={"flower": "/uploads/alice.png"})
    publish(client, bob, ornaments={"flower": "/uploads/bob.png"})
    assert client.get(f"{API}/my-card", headers=alice).json()["ornaments"] == {"flower": "/uploads/alice.png"}
    assert client.get(f"{API}/my-card", headers=bob).json()["ornaments"] == {"flower": "/uploads/bob.png"}
