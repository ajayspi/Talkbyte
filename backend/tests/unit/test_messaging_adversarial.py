"""
Adversarial and stress test suite for TalkByte messaging and payments layer.

Tested areas:
  1. API Routing & Mount Points (POST /api/messages/send, /api/messages, unmounted routes, 404, 405).
  2. Schema Validation & Malformed Inputs (empty, missing fields, wrong types, nulls, 422).
  3. Extreme Payloads & ReDoS resistance (100k character strings, XSS/SQLi strings, unicode).
  4. Dual-Failure Modes (WhatsApp fails AND Telnyx fails across multiple exception types).
  5. Payment Link Integration (create_payment_link: 404, dual failure, missing call record, Stripe errors).
  6. Phone Number Normalization Edge Cases (mixed formatting, leading zeros with country codes).
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
import httpx
import stripe

from app.api.messages import router as messages_router
from app.api.payments import router as payments_router
from app.services.messaging import SendMessageResponse, send_payment_message
from app.services.whatsapp import normalize_phone_number, is_au_mobile


# ---------------------------------------------------------------------------
# Setup FastAPI test app mirroring production main.py mounts
# ---------------------------------------------------------------------------

@pytest.fixture
def full_api_client():
    """TestClient with identical routing to production main.py."""
    app = FastAPI()
    app.include_router(messages_router, prefix="/api/messages", tags=["messages"])
    app.include_router(messages_router, prefix="/api/messaging", tags=["messages"])
    app.include_router(payments_router, prefix="/api/payments", tags=["payments"])

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. API Routing & Mount Point Stress Tests
# ---------------------------------------------------------------------------

class TestApiRoutingStress:
    """Verify endpoint routing, method restrictions, and mount integrity."""

    def test_post_messages_send_route_exists(self, full_api_client):
        """POST /api/messages/send accepts requests and returns 200 on valid mock."""
        mock_res = SendMessageResponse(
            success=True,
            channel="whatsapp",
            to_number="+61412345678",
            message_id="wamid.999",
            fallback_used=False,
        )
        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = full_api_client.post(
                "/api/messages/send",
                json={"to_number": "0412345678", "payment_url": "https://stripe.com/pay/1"},
            )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_post_messages_root_alias_route_exists(self, full_api_client):
        """POST /api/messages (without /send) also routes to send_message_endpoint."""
        mock_res = SendMessageResponse(
            success=True,
            channel="whatsapp",
            to_number="+61412345678",
            fallback_used=False,
        )
        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = full_api_client.post(
                "/api/messages",
                json={"to_number": "0412345678", "payment_url": "https://stripe.com/pay/1"},
            )
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_post_messaging_alternate_prefix_mounted(self, full_api_client):
        """POST /api/messaging/send is mounted as alias."""
        mock_res = SendMessageResponse(
            success=True,
            channel="sms",
            to_number="+61412345678",
            fallback_used=True,
        )
        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = full_api_client.post(
                "/api/messaging/send",
                json={"to_number": "0412345678", "payment_url": "https://stripe.com/pay/1"},
            )
        assert resp.status_code == 200
        assert resp.json()["channel"] == "sms"

    def test_messages_health_endpoint(self, full_api_client):
        """GET /api/messages/health returns 200."""
        resp = full_api_client.get("/api/messages/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok", "service": "messages"}

    def test_method_not_allowed_on_messages_send(self, full_api_client):
        """GET, PUT, DELETE, PATCH on /api/messages/send must return HTTP 405."""
        methods = ["get", "put", "delete", "patch"]
        for m in methods:
            func = getattr(full_api_client, m)
            resp = func("/api/messages/send")
            assert resp.status_code == 405, f"Expected 405 for {m.upper()} /api/messages/send, got {resp.status_code}"

    def test_unmounted_routes_return_404(self, full_api_client):
        """Non-existent endpoints under /api/messages/ return HTTP 404."""
        bad_paths = [
            "/api/messages/unknown",
            "/api/messages/send/extra",
            "/api/v2/messages/send",
            "/api/messages_random",
        ]
        for path in bad_paths:
            resp = full_api_client.post(path, json={"to_number": "0412345678", "payment_url": "https://stripe.com"})
            assert resp.status_code == 404, f"Expected 404 for {path}, got {resp.status_code}"


# ---------------------------------------------------------------------------
# 2. Schema Validation & Malformed Payload Tests
# ---------------------------------------------------------------------------

class TestSchemaValidationAndMalformedPayloads:
    """Verify rigorous Pydantic validation on incoming requests."""

    def test_empty_json_body_returns_422(self, full_api_client):
        """Empty JSON body {} returns 422 with missing field details."""
        resp = full_api_client.post("/api/messages/send", json={})
        assert resp.status_code == 422
        errors = resp.json()["detail"]
        missing_fields = {e["loc"][-1] for e in errors}
        assert "to_number" in missing_fields
        assert "payment_url" in missing_fields

    def test_missing_to_number_returns_422(self, full_api_client):
        """Missing to_number returns 422."""
        resp = full_api_client.post(
            "/api/messages/send",
            json={"payment_url": "https://pay.stripe.com/1"},
        )
        assert resp.status_code == 422
        assert resp.json()["detail"][0]["loc"][-1] == "to_number"

    def test_missing_payment_url_returns_422(self, full_api_client):
        """Missing payment_url returns 422."""
        resp = full_api_client.post(
            "/api/messages/send",
            json={"to_number": "+61412345678"},
        )
        assert resp.status_code == 422
        assert resp.json()["detail"][0]["loc"][-1] == "payment_url"

    def test_empty_string_fields_return_422(self, full_api_client):
        """Empty string for to_number or payment_url violates min_length=1."""
        resp1 = full_api_client.post(
            "/api/messages/send",
            json={"to_number": "", "payment_url": "https://stripe.com"},
        )
        assert resp1.status_code == 422

        resp2 = full_api_client.post(
            "/api/messages/send",
            json={"to_number": "+61412345678", "payment_url": ""},
        )
        assert resp2.status_code == 422

    def test_non_string_types_return_422(self, full_api_client):
        """Complex/array/dict types in string fields return 422."""
        invalids = [
            {"to_number": ["+61412345678"], "payment_url": "https://stripe.com"},
            {"to_number": {"phone": "+61412345678"}, "payment_url": "https://stripe.com"},
            {"to_number": "+61412345678", "payment_url": ["https://stripe.com"]},
            {"to_number": "+61412345678", "payment_url": {"url": "https://stripe.com"}},
            {"to_number": "+61412345678", "payment_url": "https://stripe.com", "restaurant_name": [1, 2, 3]},
        ]
        for payload in invalids:
            resp = full_api_client.post("/api/messages/send", json=payload)
            assert resp.status_code == 422, f"Expected 422 for {payload}, got {resp.status_code}"

    def test_null_required_fields_return_422(self, full_api_client):
        """Explicit nulls in required fields return 422."""
        resp = full_api_client.post(
            "/api/messages/send",
            json={"to_number": None, "payment_url": None},
        )
        assert resp.status_code == 422

    def test_non_json_body_returns_422(self, full_api_client):
        """Non-JSON payload (e.g. plain text or malformed JSON) returns 422."""
        resp = full_api_client.post(
            "/api/messages/send",
            content="this is plain text not json",
            headers={"Content-Type": "application/json"},
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 3. Extreme Payloads & ReDoS / Injection Stress Tests
# ---------------------------------------------------------------------------

class TestExtremePayloadsAndInjection:
    """Verify system resilience under extreme input sizes and injection strings."""

    @pytest.mark.asyncio
    async def test_extreme_large_phone_string_no_catastrophic_backtracking(self):
        """A 100,000 character string must be evaluated in milliseconds without ReDoS."""
        import time
        huge_string = "04" + ("9" * 100000)
        t0 = time.perf_counter()
        norm = normalize_phone_number(huge_string)
        elapsed = time.perf_counter() - t0

        assert elapsed < 0.2, f"Regex took too long ({elapsed:.3f}s) — possible ReDoS"
        assert norm.is_valid is False
        assert norm.is_au_mobile is False

    @pytest.mark.asyncio
    async def test_special_characters_sql_injection_xss(self):
        """Payloads with SQL injection, script tags, and unicode do not break normalization or dispatch."""
        sqli_phone = "'; DROP TABLE messages; --"
        norm = normalize_phone_number(sqli_phone)
        assert norm.is_valid is False
        assert norm.is_au_mobile is False

        xss_url = "<script>alert('pwned')</script>"
        unicode_restaurant = "🍕 Café & Trattoria \u2603 'Special' \"Quotes\""

        with patch("app.services.messaging.is_au_mobile", return_value=False), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="test_key")), \
             patch("telnyx.Message.create") as mock_telnyx:

            res = await send_payment_message(
                to_number="+12025550179",
                payment_url=xss_url,
                restaurant_name=unicode_restaurant,
            )

        assert res.success is True
        assert res.channel == "sms"
        mock_telnyx.assert_called_once()
        text_sent = mock_telnyx.call_args.kwargs["text"]
        assert unicode_restaurant in text_sent
        assert xss_url in text_sent

    def test_api_handles_extreme_length_payload(self, full_api_client):
        """API handles very large restaurant names and payment URLs gracefully."""
        huge_url = "https://stripe.com/pay/" + ("a" * 10000)
        huge_restaurant = "Restaurant " + ("B" * 10000)

        mock_res = SendMessageResponse(
            success=True,
            channel="whatsapp",
            to_number="+61412345678",
            fallback_used=False,
        )
        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = full_api_client.post(
                "/api/messages/send",
                json={
                    "to_number": "0412345678",
                    "payment_url": huge_url,
                    "restaurant_name": huge_restaurant,
                },
            )
        assert resp.status_code == 200
        assert resp.json()["success"] is True


# ---------------------------------------------------------------------------
# 4. Dual-Failure Modes (WhatsApp Fails AND Telnyx Fails)
# ---------------------------------------------------------------------------

class TestDualFailureModes:
    """Verify clean error responses when BOTH WhatsApp and Telnyx fail."""

    @pytest.mark.asyncio
    async def test_dual_failure_whatsapp_131026_and_telnyx_network_exception(self):
        """WhatsApp reports #131026, then Telnyx raises 503 ConnectionError."""
        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(return_value=False)), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="telnyx_key")), \
             patch("telnyx.Message.create", side_effect=Exception("Connection to Telnyx timed out (503)")):

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/123",
                restaurant_name="Failover Bistro",
            )

        assert res.success is False
        assert res.channel == "sms"
        assert res.fallback_used is True
        assert "503" in res.error
        assert "SMS delivery failed" in res.details

    @pytest.mark.asyncio
    async def test_dual_failure_whatsapp_timeout_and_telnyx_auth_error(self):
        """WhatsApp raises TimeoutException, then Telnyx raises AuthenticationError."""
        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(side_effect=httpx.TimeoutException("WA Timeout"))), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="invalid_telnyx_key")), \
             patch("telnyx.Message.create", side_effect=Exception("Unauthorized: Invalid Telnyx API Key")):

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/123",
                restaurant_name="Failover Bistro",
            )

        assert res.success is False
        assert res.channel == "sms"
        assert res.fallback_used is True
        assert "Unauthorized" in res.error

    @pytest.mark.asyncio
    async def test_dual_failure_whatsapp_exception_and_telnyx_rate_limit(self):
        """WhatsApp throws RuntimeError, then Telnyx throws RateLimitError."""
        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(side_effect=RuntimeError("Graph API crashed"))), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="key")), \
             patch("telnyx.Message.create", side_effect=Exception("429 Too Many Requests")):

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/123",
                restaurant_name="Failover Bistro",
            )

        assert res.success is False
        assert res.channel == "sms"
        assert res.fallback_used is True
        assert "429" in res.error

    @pytest.mark.asyncio
    async def test_non_au_telnyx_direct_failure(self):
        """Non-AU number (WhatsApp skipped) encounters Telnyx failure."""
        with patch("app.services.messaging.is_au_mobile", return_value=False), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock()) as mock_wa, \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="key")), \
             patch("telnyx.Message.create", side_effect=Exception("Invalid destination phone number")):

            res = await send_payment_message(
                to_number="+12025550179",
                payment_url="https://pay.stripe.com/123",
                restaurant_name="Failover Bistro",
            )

        assert res.success is False
        assert res.channel == "sms"
        assert res.fallback_used is False
        assert "Invalid destination" in res.error
        mock_wa.assert_not_called()

    def test_api_send_endpoint_dual_failure_returns_200_with_success_false(self, full_api_client):
        """When both WhatsApp and Telnyx fail, the API returns HTTP 200 with success=False and error details."""
        mock_res = SendMessageResponse(
            success=False,
            channel="sms",
            to_number="+61412345678",
            fallback_used=True,
            error="Telnyx gateway unreachable",
            details="SMS delivery failed: Telnyx gateway unreachable",
        )
        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = full_api_client.post(
                "/api/messages/send",
                json={"to_number": "0412345678", "payment_url": "https://stripe.com"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is False
        assert data["channel"] == "sms"
        assert data["fallback_used"] is True
        assert data["error"] == "Telnyx gateway unreachable"


# ---------------------------------------------------------------------------
# 5. Payment Link Creation Integration Stress Tests
# ---------------------------------------------------------------------------

class TestPaymentLinkCreationStress:
    """Verify backend/app/api/payments.py:create_payment_link under adverse conditions."""

    def test_create_link_nonexistent_order_returns_404(self, full_api_client):
        """create_payment_link with an unknown order_id returns HTTP 404."""
        with patch("app.api.payments.get_platform_secret", new=AsyncMock(return_value="test_key")), \
             patch("app.api.payments.get_order", new=AsyncMock(return_value=None)):

            resp = full_api_client.post("/api/payments/create-link/order-does-not-exist")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Order not found"

    def test_create_link_when_call_record_missing_falls_back_to_default_phone(self, full_api_client):
        """When order exists but call_id is None, code defaults customer phone to +61400000000."""
        mock_order = MagicMock()
        mock_order.id = "order-no-call"
        mock_order.call_id = None
        mock_order.total_cents = 3000

        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.com/c/pay_test"

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(return_value="test_key")), \
             patch("app.api.payments.get_order", new=AsyncMock(return_value=mock_order)), \
             patch("stripe.checkout.Session.create", return_value=mock_session), \
             patch("app.api.payments.send_payment_message", new=AsyncMock()) as mock_dispatch:

            resp = full_api_client.post("/api/payments/create-link/order-no-call")

        assert resp.status_code == 200
        assert resp.json()["payment_url"] == "https://checkout.stripe.com/c/pay_test"
        mock_dispatch.assert_called_once()
        assert mock_dispatch.call_args.kwargs["to_number"] == "+61400000000"

    def test_create_link_when_messaging_fails_completely_still_returns_payment_url(self, full_api_client):
        """If messaging fails (WhatsApp and SMS both fail), the Stripe link was created and returned."""
        mock_order = MagicMock()
        mock_order.id = "order-fail-msg"
        mock_order.call_id = "call-1"
        mock_order.total_cents = 1500

        mock_call = MagicMock()
        mock_call.caller_number = "+61412345678"

        mock_session = MagicMock()
        mock_session.url = "https://checkout.stripe.com/c/pay_test"

        mock_failed_msg = SendMessageResponse(
            success=False,
            channel="sms",
            to_number="+61412345678",
            fallback_used=True,
            error="Dual failure: WA and SMS both down",
        )

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(return_value="test_key")), \
             patch("app.api.payments.get_order", new=AsyncMock(return_value=mock_order)), \
             patch("app.api.payments.get_call", new=AsyncMock(return_value=mock_call)), \
             patch("stripe.checkout.Session.create", return_value=mock_session), \
             patch("app.api.payments.send_payment_message", new=AsyncMock(return_value=mock_failed_msg)):

            resp = full_api_client.post("/api/payments/create-link/order-fail-msg")

        assert resp.status_code == 200
        assert resp.json()["payment_url"] == "https://checkout.stripe.com/c/pay_test"
        assert resp.json()["order_id"] == "order-fail-msg"

    def test_create_link_stripe_exception_returns_500(self, full_api_client):
        """When Stripe API throws an exception, endpoint returns HTTP 500."""
        mock_order = MagicMock()
        mock_order.id = "order-stripe-down"
        mock_order.call_id = "call-1"
        mock_order.total_cents = 1500

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(return_value="test_key")), \
             patch("app.api.payments.get_order", new=AsyncMock(return_value=mock_order)), \
             patch("stripe.checkout.Session.create", side_effect=Exception("Stripe API down")):

            resp = full_api_client.post("/api/payments/create-link/order-stripe-down")

        assert resp.status_code == 500
        assert resp.json()["detail"] == "Failed to create payment link"


# ---------------------------------------------------------------------------
# 6. Phone Number Normalization Edge Cases
# ---------------------------------------------------------------------------

class TestPhoneNormalizationEdgeCases:
    """Verify normalization boundary conditions and complex inputs."""

    def test_whitespace_and_tabs_stripped(self):
        """Tabs and leading/trailing whitespace stripped cleanly."""
        assert normalize_phone_number("\t  0412 345 678 \n").e164 == "+61412345678"
        assert is_au_mobile("\t  0412 345 678 \n") is True

    def test_mixed_country_code_and_domestic_zero_rejected(self):
        """+6104xxxxxxxx (invalid combination of country code + domestic zero) is rejected."""
        norm = normalize_phone_number("+610412345678")
        assert norm.is_au_mobile is False
        assert norm.is_valid is False

    def test_letters_in_phone_number_rejected(self):
        """Alphanumeric vanity numbers like '0412-PIZZA' are rejected."""
        norm = normalize_phone_number("0412-PIZZA-NOW")
        assert norm.is_valid is False
        assert norm.is_au_mobile is False

    def test_none_input_handled_gracefully(self):
        """None input does not crash and returns invalid."""
        norm = normalize_phone_number(None)  # type: ignore
        assert norm.is_valid is False
        assert norm.is_au_mobile is False
