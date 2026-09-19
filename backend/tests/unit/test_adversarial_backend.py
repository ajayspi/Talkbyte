"""
Empirical Adversarial Verification & Stress Test Suite
Testing Voice Greeting Script, Staff Management, and Third-Party Integrations.
"""

import pytest
import sys
import os
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from main import app
from app.api.integrations import mask_api_key

client = TestClient(app)


# ============================================================================
# 1. VOICE GREETING ENDPOINT ADVERSARIAL TESTS
# ============================================================================

def test_generate_greeting_unknown_persona():
    """Verify unknown personas (e.g. Gandalf, C-3PO) default gracefully without error."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        for unknown_persona in ["Gandalf", "C-3PO", "Thor", "RandomBot_99"]:
            response = client.post(
                "/api/voice/generate-greeting",
                json={"restaurant_name": "Outback Grill", "persona": unknown_persona}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["provider"] == "fallback"
            assert unknown_persona in data["greeting"]
            assert "Outback Grill" in data["greeting"]


def test_generate_greeting_empty_and_whitespace_strings():
    """Verify empty or whitespace-only restaurant names and personas fall back cleanly."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        # Empty restaurant name & empty persona
        resp1 = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "", "persona": ""}
        )
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1["status"] == "success"
        assert "our restaurant" in data1["greeting"]
        assert "Aria" in data1["greeting"]

        # Whitespace-only
        resp2 = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "   ", "persona": "   "}
        )
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2["status"] == "success"
        assert "our restaurant" in data2["greeting"]
        assert "Aria" in data2["greeting"]


def test_generate_greeting_extremely_long_strings():
    """Verify extremely long persona and restaurant names do not crash or raise memory exceptions."""
    huge_name = "Super " * 1000 + "Pizzeria"
    huge_persona = "LongPersona" * 500

    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        response = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": huge_name, "persona": huge_persona}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["provider"] == "fallback"
        assert huge_name in data["greeting"]
        assert huge_persona in data["greeting"]


def test_generate_greeting_special_characters_and_emojis():
    """Verify unicode, HTML tags, and emojis are preserved safely without encoding errors."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        response = client.post(
            "/api/voice/generate-greeting",
            json={
                "restaurant_name": "🍕 Mario & Luigi's <b style='color:red'>Trattoria</b>",
                "persona": "Chloe 🤖"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "🍕 Mario & Luigi's <b style='color:red'>Trattoria</b>" in data["greeting"]
        assert "Chloe 🤖" in data["greeting"]


def test_generate_greeting_missing_api_key_scenario():
    """Verify missing OPENAI_API_KEY explicitly returns provider='fallback' with a valid greeting."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        response = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "Sydney Harbour Cafe", "persona": "Liam"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["provider"] == "fallback"
        assert len(data["greeting"]) > 10
        assert "Sydney Harbour Cafe" in data["greeting"]
        assert "Liam" in data["greeting"]


def test_generate_greeting_simulated_timeout_and_errors():
    """Verify OpenAI network timeout or error triggers fallback without crashing or returning 500."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="sk-valid-looking-key")):
        with patch("app.api.voice.AsyncOpenAI") as mock_openai_cls:
            # Case 1: Timeout error
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=asyncio.TimeoutError("Request timed out"))
            mock_openai_cls.return_value = mock_client

            resp_timeout = client.post(
                "/api/voice/generate-greeting",
                json={"restaurant_name": "Melbourne Souvlaki", "persona": "Olivia"}
            )
            assert resp_timeout.status_code == 200
            assert resp_timeout.json()["provider"] == "fallback"
            assert "Olivia" in resp_timeout.json()["greeting"]

            # Case 2: Rate limit error
            mock_client.chat.completions.create = AsyncMock(side_effect=Exception("Rate limit 429: Too Many Requests"))
            resp_ratelimit = client.post(
                "/api/voice/generate-greeting",
                json={"restaurant_name": "Perth Pizza", "persona": "Aria"}
            )
            assert resp_ratelimit.status_code == 200
            assert resp_ratelimit.json()["provider"] == "fallback"
            assert "Perth Pizza" in resp_ratelimit.json()["greeting"]


def test_generate_greeting_high_volume_stress():
    """Stress test: 50 sequential requests under rapid succession."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        for i in range(50):
            res = client.post(
                "/api/voice/generate-greeting",
                json={"restaurant_name": f"Test Cafe {i}", "persona": "Aria"}
            )
            assert res.status_code == 200
            assert res.json()["status"] == "success"


# ============================================================================
# 2. STAFF MANAGEMENT ENDPOINT ADVERSARIAL TESTS
# ============================================================================

@pytest.fixture
def mock_staff_db():
    with patch("app.api.staff.get_db") as mock_get_db:
        mock = MagicMock()
        mock_get_db.return_value = mock
        yield mock


def test_invite_staff_invalid_email_formats(mock_staff_db):
    """Verify invalid email formats without '@' or empty are rejected with HTTP 400 / 422."""
    invalid_emails = [
        "notanemail",
        "missing_at_symbol.com",
        "",
        "plainaddress",
        "   "
    ]
    for invalid_email in invalid_emails:
        res = client.post(
            "/api/staff/invite",
            json={
                "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
                "name": "Jane Doe",
                "email": invalid_email,
                "role": "staff"
            }
        )
        assert res.status_code in (400, 422), f"Expected 400 or 422 for email '{invalid_email}', got {res.status_code}"


def test_invite_staff_email_without_tld_boundary(mock_staff_db):
    """
    Adversarial finding:
    Controller validates email via `not email or '@' not in email`.
    Verify emails containing '@' pass controller-level validation into auth provisioning.
    """
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=None)
    )
    mock_auth_user = MagicMock()
    mock_auth_user.id = "user-boundary-id"
    mock_invite_resp = MagicMock()
    mock_invite_resp.user = mock_auth_user
    mock_staff_db.auth.admin.invite_user_by_email = AsyncMock(return_value=mock_invite_resp)
    mock_staff_db.table.return_value.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))

    res = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
            "name": "Jane Boundary",
            "email": "user@domain",
            "role": "staff"
        }
    )
    assert res.status_code == 200


def test_invite_staff_duplicate_user_invitations(mock_staff_db):
    """Verify inviting an existing user is idempotent and updates their membership role."""
    # Existing user found in public.users
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"id": "existing-uid-456", "email": "repeat@example.com", "name": "Repeat Staff"})
    )
    mock_users_upsert = MagicMock()
    mock_users_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_ru_upsert = MagicMock()
    mock_ru_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))

    def table_router(table_name):
        if table_name == "users":
            m = MagicMock()
            m.select = mock_users_select.select
            m.upsert = mock_users_upsert.upsert
            return m
        elif table_name == "restaurant_users":
            return mock_ru_upsert
        return MagicMock()

    mock_staff_db.table.side_effect = table_router

    # First invite
    res1 = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
            "name": "Repeat Staff",
            "email": "repeat@example.com",
            "role": "staff"
        }
    )
    assert res1.status_code == 200
    assert res1.json()["user_id"] == "existing-uid-456"

    # Second invite (e.g. promoting from staff to manager)
    res2 = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
            "name": "Repeat Staff",
            "email": "repeat@example.com",
            "role": "manager"
        }
    )
    assert res2.status_code == 200
    assert res2.json()["user_id"] == "existing-uid-456"
    assert res2.json()["staff"]["role"] == "manager"


def test_invite_staff_role_casing_variations(mock_staff_db):
    """Verify role casing variations (manager, Manager, OWNER, sTaFf) are all normalized to lowercase."""
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=None)
    )
    mock_auth_user = MagicMock()
    mock_auth_user.id = "user-id-norm"
    mock_invite_resp = MagicMock()
    mock_invite_resp.user = mock_auth_user
    mock_staff_db.auth.admin.invite_user_by_email = AsyncMock(return_value=mock_invite_resp)

    mock_users_upsert = MagicMock()
    mock_users_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_ru_upsert = MagicMock()
    mock_ru_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))

    def table_router(table_name):
        if table_name == "users":
            m = MagicMock()
            m.select = mock_users_select.select
            m.upsert = mock_users_upsert.upsert
            return m
        elif table_name == "restaurant_users":
            return mock_ru_upsert
        return MagicMock()

    mock_staff_db.table.side_effect = table_router

    casing_tests = [
        ("Manager", "manager"),
        ("OWNER", "owner"),
        ("sTaFf", "staff"),
        ("  MANAGER  ", "manager"),
    ]

    for input_role, expected_norm in casing_tests:
        res = client.post(
            "/api/staff/invite",
            json={
                "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
                "name": "Alex Smith",
                "email": f"alex_{expected_norm}@example.com",
                "role": input_role
            }
        )
        assert res.status_code == 200
        assert res.json()["staff"]["role"] == expected_norm


def test_invite_staff_database_foreign_key_failure(mock_staff_db):
    """Verify that if database upsert fails (e.g. non-existent restaurant_id FK error), HTTP 500 is returned."""
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"id": "uid-fk-test", "email": "fk@test.com", "name": "FK Test"})
    )
    mock_ru_upsert = MagicMock()
    mock_ru_upsert.upsert.return_value.execute = AsyncMock(
        side_effect=Exception("insert or update on table violates foreign key constraint restaurant_users_restaurant_id_fkey")
    )

    def table_router(table_name):
        if table_name == "users":
            m = MagicMock()
            m.select = mock_users_select.select
            m.upsert = MagicMock(return_value=MagicMock(execute=AsyncMock()))
            return m
        elif table_name == "restaurant_users":
            return mock_ru_upsert
        return MagicMock()

    mock_staff_db.table.side_effect = table_router

    res = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "00000000-0000-0000-0000-000000000000",
            "name": "FK Tester",
            "email": "fk@test.com",
            "role": "staff"
        }
    )
    assert res.status_code == 500
    assert "Failed to assign staff role" in res.json()["detail"]


def test_get_staff_empty_and_non_existent(mock_staff_db):
    """Verify GET /api/staff returns 400 for empty ID, and [] for non-existent restaurant."""
    # Empty restaurant_id
    res_empty = client.get("/api/staff?restaurant_id=")
    assert res_empty.status_code == 400

    # Non-existent restaurant returns empty list cleanly
    mock_view_select = MagicMock()
    mock_view_select.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    mock_staff_db.table.return_value = mock_view_select

    res_non_existent = client.get("/api/staff?restaurant_id=00000000-0000-0000-0000-000000000000")
    assert res_non_existent.status_code == 200
    assert res_non_existent.json()["staff"] == []


# ============================================================================
# 3. INTEGRATIONS ENDPOINT ADVERSARIAL TESTS
# ============================================================================

@pytest.fixture
def mock_int_db():
    with patch("app.api.integrations.get_db") as mock_get_db:
        mock = MagicMock()
        mock_get_db.return_value = mock
        yield mock


def test_save_integration_unsupported_providers():
    """Verify unsupported providers are strictly rejected with HTTP 400."""
    unsupported = ["toast", "clover", "unknown_pos", "paypal", "uber_eats", ""]
    for provider in unsupported:
        res = client.post(
            "/api/integrations",
            json={
                "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
                "provider": provider,
                "api_key": "some_token"
            }
        )
        assert res.status_code == 400
        assert "Unsupported provider" in res.json()["detail"]


def test_save_integration_casing_resilience(mock_int_db):
    """Verify provider names with mixed casing or whitespace are accepted and normalized."""
    mock_upsert = MagicMock()
    mock_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_int_db.table.return_value = mock_upsert

    cases = [
        ("SQUARE", "square"),
        ("Stripe", "stripe"),
        ("  twilio  ", "twilio"),
        ("SHOPIFY", "shopify")
    ]
    for raw_provider, expected_norm in cases:
        res = client.post(
            "/api/integrations",
            json={
                "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
                "provider": raw_provider,
                "api_key": "valid_token"
            }
        )
        assert res.status_code == 200
        assert res.json()["provider"] == expected_norm


def test_save_integration_idempotency_multiple_updates(mock_int_db):
    """Verify updating the same integration multiple times is idempotent with on_conflict handling."""
    mock_upsert = MagicMock()
    mock_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_int_db.table.return_value = mock_upsert

    for iteration in range(5):
        res = client.post(
            "/api/integrations",
            json={
                "restaurant_id": "5b99fb66-e992-489d-86b6-125577af8f55",
                "provider": "square",
                "api_key": f"sq0atp-token-v{iteration}",
                "metadata": {"version": iteration}
            }
        )
        assert res.status_code == 200
        assert res.json()["status"] == "success"

    # Verify on_conflict was specified in upsert call
    args, kwargs = mock_upsert.upsert.call_args
    assert kwargs.get("on_conflict") == "restaurant_id,provider"


def test_get_integrations_never_exposes_plaintext_secrets(mock_int_db):
    """
    CRITICAL SECURITY CHECK:
    Verify GET /api/integrations strictly masks keys and never leaks plaintext secrets
    in the JSON response or raw HTTP body.
    """
    sensitive_square_key = "sq0atp-HIGHLY_CONFIDENTIAL_SQUARE_SECRET_9876"
    sensitive_stripe_key = "sk_live_51M0SUPER_SECRET_STRIPE_LIVE_KEY_5432"
    sensitive_twilio_token = "CONFIDENTIAL_TWILIO_AUTH_TOKEN_123456789"
    sensitive_shopify_token = "shpat_SUPER_SECRET_SHOPIFY_API_TOKEN_9999"

    mock_select = MagicMock()
    mock_select.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {
                "id": "1",
                "restaurant_id": "rest-uuid",
                "provider": "square",
                "api_key": sensitive_square_key,
                "status": "connected",
                "is_active": True,
                "metadata": {"location_id": "L123"}
            },
            {
                "id": "2",
                "restaurant_id": "rest-uuid",
                "provider": "stripe",
                "api_key": sensitive_stripe_key,
                "status": "connected",
                "is_active": True,
                "metadata": {}
            },
            {
                "id": "3",
                "restaurant_id": "rest-uuid",
                "provider": "twilio",
                "credentials": {"api_key": sensitive_twilio_token},
                "status": "connected",
                "is_active": True,
                "metadata": {}
            },
            {
                "id": "4",
                "restaurant_id": "rest-uuid",
                "provider": "shopify",
                "api_key": sensitive_shopify_token,
                "status": "connected",
                "is_active": True,
                "metadata": {}
            },
        ])
    )
    mock_int_db.table.return_value = mock_select

    res = client.get("/api/integrations?restaurant_id=rest-uuid")
    assert res.status_code == 200

    raw_text = res.text
    # Plaintext secrets must NEVER be present anywhere in raw response body
    assert "HIGHLY_CONFIDENTIAL" not in raw_text
    assert "SUPER_SECRET_STRIPE" not in raw_text
    assert "CONFIDENTIAL_TWILIO" not in raw_text
    assert "SUPER_SECRET_SHOPIFY" not in raw_text

    data = res.json()
    integrations = data["integrations"]

    # Verify masked format for each
    sq = integrations["square"]
    assert sq["connected"] is True
    assert sq["masked_key"].startswith("sq0atp-")
    assert sq["masked_key"].endswith("9876")
    assert "****...****" in sq["masked_key"]

    st = integrations["stripe"]
    assert st["connected"] is True
    assert st["masked_key"].startswith("sk_l")
    assert st["masked_key"].endswith("5432")

    tw = integrations["twilio"]
    assert tw["connected"] is True
    assert tw["masked_key"].startswith("CONF")
    assert tw["masked_key"].endswith("6789")

    sh = integrations["shopify"]
    assert sh["connected"] is True
    assert sh["masked_key"].startswith("shpa")
    assert sh["masked_key"].endswith("9999")


def test_mask_api_key_edge_cases():
    """Verify mask_api_key function with empty, short, boundary, and long tokens."""
    assert mask_api_key(None) == ""
    assert mask_api_key("") == ""
    assert mask_api_key("   ") == ""
    assert mask_api_key("a") == "********"
    assert mask_api_key("12345678") == "********"  # len 8
    assert mask_api_key("123456789") == "1234****...****6789"  # len 9
    assert mask_api_key("prefix-secretkey1234") == "prefix-****...****1234"
