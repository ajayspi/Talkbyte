"""
Unit and integration tests for TalkByte messaging layer (Requirement R1).

Covers:
  1. Australian mobile phone number normalization & validation.
  2. Meta WhatsApp Business Cloud API delivery (success, missing secrets, HTTP errors, error #131026).
  3. WhatsApp-to-Telnyx SMS fallback orchestration (on API failure and network/timeout exceptions).
  4. Non-AU mobile direct routing (skips WhatsApp, sends SMS directly).
  5. FastAPI internal messaging endpoint: POST /api/messages/send (routing, validation, fallback).
  6. Voice ordering payment link dispatch integration (create_payment_link).
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
import httpx


# ---------------------------------------------------------------------------
# Test Suite 1: Phone Normalization & Validation
# ---------------------------------------------------------------------------

class TestPhoneNormalization:
    """Verify phone normalization for Australian mobiles and international numbers."""

    def test_valid_domestic_au_mobile_standard(self):
        """04XXXXXXXX (10 digits) normalizes to E.164 and WhatsApp digit format."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        norm = normalize_phone_number("0412345678")
        assert norm.is_valid is True
        assert norm.is_au_mobile is True
        assert norm.e164 == "+61412345678"
        assert norm.whatsapp_id == "61412345678"
        assert is_au_mobile("0412345678") is True

    def test_valid_domestic_au_mobile_with_formatting(self):
        """Spaces, hyphens, and brackets are stripped during normalization."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        cases = [
            "0412 345 678",
            "0412-345-678",
            "0412.345.678",
            "(04) 1234 5678",
        ]
        for num in cases:
            norm = normalize_phone_number(num)
            assert norm.is_valid is True, f"Failed on {num}"
            assert norm.is_au_mobile is True, f"Failed on {num}"
            assert norm.e164 == "+61412345678"
            assert norm.whatsapp_id == "61412345678"
            assert is_au_mobile(num) is True

    def test_valid_international_au_mobile_e164(self):
        """+614XXXXXXXX is recognized as a valid AU mobile."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        norm = normalize_phone_number("+61412345678")
        assert norm.is_valid is True
        assert norm.is_au_mobile is True
        assert norm.e164 == "+61412345678"
        assert norm.whatsapp_id == "61412345678"
        assert is_au_mobile("+61412345678") is True

    def test_valid_au_mobile_digits_only(self):
        """614XXXXXXXX without leading '+' normalizes cleanly."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        norm = normalize_phone_number("61412345678")
        assert norm.is_valid is True
        assert norm.is_au_mobile is True
        assert norm.e164 == "+61412345678"
        assert norm.whatsapp_id == "61412345678"
        assert is_au_mobile("61412345678") is True

    def test_au_landline_not_mobile(self):
        """Australian landlines (e.g. Sydney 02, Melbourne 03) are not mobile."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        landlines = ["0291234567", "+61291234567", "0391234567", "+61391234567"]
        for num in landlines:
            norm = normalize_phone_number(num)
            assert norm.is_valid is True
            assert norm.is_au_mobile is False
            assert is_au_mobile(num) is False

    def test_international_non_au_number(self):
        """US/UK and other international numbers are valid E.164 but not AU mobile."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        us_num = "+12025550179"
        norm = normalize_phone_number(us_num)
        assert norm.is_valid is True
        assert norm.is_au_mobile is False
        assert norm.e164 == "+12025550179"
        assert is_au_mobile(us_num) is False

    def test_invalid_phone_inputs(self):
        """Malformed, empty, or too short/long inputs are flagged invalid."""
        from app.services.whatsapp import is_au_mobile, normalize_phone_number
        invalids = ["", "   ", "abc", "12345", "04123", "+6141234567890", "+0000"]
        for bad in invalids:
            norm = normalize_phone_number(bad)
            assert norm.is_valid is False, f"Expected invalid for {bad}"
            assert norm.is_au_mobile is False
            assert is_au_mobile(bad) is False


# ---------------------------------------------------------------------------
# Test Suite 2: WhatsApp Meta Graph API Delivery
# ---------------------------------------------------------------------------

class TestWhatsAppServiceDelivery:
    """Verify Meta WhatsApp Business Cloud API client behavior and error handling."""

    @pytest.mark.asyncio
    async def test_whatsapp_delivery_success(self):
        """Happy path: Meta API returns HTTP 200 with message ID."""
        from app.services.whatsapp import send_whatsapp_payment_link

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "messaging_product": "whatsapp",
            "contacts": [{"input": "61412345678", "wa_id": "61412345678"}],
            "messages": [{"id": "wamid.HBgLMTIzNDU2Nzg5MA=="}],
        }

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=[
            "123456789012345",  # WHATSAPP_PHONE_NUMBER_ID
            "meta_token_abc",    # WHATSAPP_ACCESS_TOKEN
        ])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(return_value=mock_resp)
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                ok = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test_123",
                    restaurant_name="Bella Italia",
                )

        assert ok is True
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args.kwargs
        assert "123456789012345/messages" in mock_client.post.call_args.args[0]
        assert call_kwargs["headers"]["Authorization"] == "Bearer meta_token_abc"
        assert call_kwargs["json"]["to"] == "61412345678"
        assert "Bella Italia" in call_kwargs["json"]["text"]["body"]
        assert "https://pay.stripe.com/test_123" in call_kwargs["json"]["text"]["body"]

    @pytest.mark.asyncio
    async def test_whatsapp_missing_credentials_returns_false(self):
        """Missing phone_number_id or access_token aborts cleanly without API call."""
        from app.services.whatsapp import send_whatsapp_payment_link

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(return_value="")):
            with patch("httpx.AsyncClient") as mock_client_cls:
                ok = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test_123",
                    restaurant_name="Bella Italia",
                )

        assert ok is False
        mock_client_cls.assert_not_called()

    @pytest.mark.asyncio
    async def test_whatsapp_error_131026_recipient_not_on_whatsapp(self):
        """Meta Cloud API error #131026 returns False so SMS fallback is triggered."""
        from app.services.whatsapp import send_whatsapp_payment_link

        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_resp.text = (
            '{"error":{"message":"(#131026) Message undeliverable","type":"OAuthException",'
            '"code":131026,"error_data":{"details":"Receiver is incapable of receiving this message"}}}'
        )

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=[
            "123456789012345",
            "meta_token_abc",
        ])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(return_value=mock_resp)
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                ok = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test_123",
                    restaurant_name="Bella Italia",
                )

        assert ok is False

    @pytest.mark.asyncio
    async def test_whatsapp_server_error_500_returns_false(self):
        """Meta 500 error returns False gracefully."""
        from app.services.whatsapp import send_whatsapp_payment_link

        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = '{"error":{"message":"Internal server error","code":2}}'

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=["id", "tok"])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(return_value=mock_resp)
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                ok = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test_123",
                    restaurant_name="Bella Italia",
                )

        assert ok is False

    @pytest.mark.asyncio
    async def test_whatsapp_network_timeout_returns_false(self):
        """TimeoutException returns False and does not crash."""
        from app.services.whatsapp import send_whatsapp_payment_link

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=["id", "tok"])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(side_effect=httpx.TimeoutException("Timeout"))
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                ok = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test_123",
                    restaurant_name="Bella Italia",
                )

        assert ok is False

    @pytest.mark.asyncio
    async def test_whatsapp_connect_error_returns_false(self):
        """ConnectError returns False and does not crash."""
        from app.services.whatsapp import send_whatsapp_payment_link

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=["id", "tok"])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                ok = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test_123",
                    restaurant_name="Bella Italia",
                )

        assert ok is False


# ---------------------------------------------------------------------------
# Test Suite 3: Messaging Dispatcher & Telnyx SMS Fallback
# ---------------------------------------------------------------------------

class TestMessagingDispatcher:
    """Verify dispatch logic between WhatsApp and Telnyx SMS fallback."""

    @pytest.mark.asyncio
    async def test_dispatch_au_mobile_whatsapp_success(self):
        """AU mobile route succeeds via WhatsApp; Telnyx is NOT called."""
        from app.services.messaging import send_payment_message

        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(return_value=True)) as mock_wa, \
             patch("telnyx.Message.create") as mock_telnyx:

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Bella Italia",
            )

        assert res.success is True
        assert res.channel == "whatsapp"
        assert res.fallback_used is False
        mock_wa.assert_called_once()
        mock_telnyx.assert_not_called()

    @pytest.mark.asyncio
    async def test_dispatch_au_mobile_whatsapp_error_falls_back_to_sms(self):
        """When WhatsApp returns False (e.g. error 131026), Telnyx SMS is sent."""
        from app.services.messaging import send_payment_message

        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(return_value=False)), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="telnyx_key_abc")), \
             patch("telnyx.Message.create") as mock_telnyx:

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Bella Italia",
                from_number="+61411111111",
            )

        assert res.success is True
        assert res.channel == "sms"
        assert res.fallback_used is True
        mock_telnyx.assert_called_once()
        args, kwargs = mock_telnyx.call_args
        assert kwargs["to"] == "+61412345678"
        assert kwargs["_from"] == "+61411111111"
        assert "https://pay.stripe.com/test" in kwargs["text"]

    @pytest.mark.asyncio
    async def test_dispatch_au_mobile_whatsapp_exception_falls_back_to_sms(self):
        """When WhatsApp raises an unhandled exception, code catches it and falls back."""
        from app.services.messaging import send_payment_message

        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(side_effect=RuntimeError("Network boom"))), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="telnyx_key_abc")), \
             patch("telnyx.Message.create") as mock_telnyx:

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Bella Italia",
            )

        assert res.success is True
        assert res.channel == "sms"
        assert res.fallback_used is True
        mock_telnyx.assert_called_once()

    @pytest.mark.asyncio
    async def test_dispatch_non_au_number_skips_whatsapp_directly_to_sms(self):
        """Non-AU numbers never hit WhatsApp; sent via Telnyx SMS directly."""
        from app.services.messaging import send_payment_message

        with patch("app.services.messaging.is_au_mobile", return_value=False), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock()) as mock_wa, \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="telnyx_key_abc")), \
             patch("telnyx.Message.create") as mock_telnyx:

            res = await send_payment_message(
                to_number="+12025550179",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Bella Italia",
            )

        assert res.success is True
        assert res.channel == "sms"
        assert res.fallback_used is False
        mock_wa.assert_not_called()
        mock_telnyx.assert_called_once()

    @pytest.mark.asyncio
    async def test_dispatch_telnyx_failure_handled_gracefully(self):
        """When both WhatsApp and Telnyx fail, result indicates failure without uncaught crash."""
        from app.services.messaging import send_payment_message

        with patch("app.services.messaging.is_au_mobile", return_value=True), \
             patch("app.services.messaging.send_whatsapp_payment_link", new=AsyncMock(return_value=False)), \
             patch("app.services.messaging.get_platform_secret", new=AsyncMock(return_value="telnyx_key_abc")), \
             patch("telnyx.Message.create", side_effect=Exception("Telnyx gateway down")):

            res = await send_payment_message(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Bella Italia",
            )

        assert res.success is False
        assert res.channel == "sms"
        assert res.fallback_used is True


# ---------------------------------------------------------------------------
# Test Suite 4: Internal Messaging API Endpoint (POST /api/messages/send)
# ---------------------------------------------------------------------------

class TestMessagesApiEndpoint:
    """Verify the internal FastAPI messaging endpoint with TestClient."""

    @pytest.fixture
    def client(self):
        """Isolated test client for messages router."""
        from app.api.messages import router as messages_router
        app = FastAPI()
        app.include_router(messages_router, prefix="/api/messages")
        return TestClient(app)

    def test_api_send_au_mobile_routes_to_whatsapp(self, client):
        """AU mobile phone number triggers WhatsApp delivery on the internal endpoint."""
        from app.services.messaging import SendMessageResponse

        mock_res = SendMessageResponse(
            success=True,
            channel="whatsapp",
            to_number="+61412345678",
            message_id="wamid.123",
            fallback_used=False,
        )

        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)) as mock_send:
            resp = client.post(
                "/api/messages/send",
                json={
                    "to_number": "0412345678",
                    "payment_url": "https://pay.stripe.com/test",
                    "restaurant_name": "Nonna's Pizza",
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["channel"] == "whatsapp"
        assert data["fallback_used"] is False
        mock_send.assert_called_once()

    def test_api_send_whatsapp_error_returns_fallback_sms(self, client):
        """When WhatsApp delivery fails, endpoint returns 200 with channel='sms' and fallback_used=True."""
        from app.services.messaging import SendMessageResponse

        mock_res = SendMessageResponse(
            success=True,
            channel="sms",
            to_number="+61412345678",
            fallback_used=True,
        )

        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = client.post(
                "/api/messages/send",
                json={
                    "to_number": "0412345678",
                    "payment_url": "https://pay.stripe.com/test",
                    "restaurant_name": "Nonna's Pizza",
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["channel"] == "sms"
        assert data["fallback_used"] is True

    def test_api_send_non_au_number_direct_sms(self, client):
        """Non-AU numbers return channel='sms' with fallback_used=False."""
        from app.services.messaging import SendMessageResponse

        mock_res = SendMessageResponse(
            success=True,
            channel="sms",
            to_number="+12025550179",
            fallback_used=False,
        )

        with patch("app.api.messages.send_payment_message", new=AsyncMock(return_value=mock_res)):
            resp = client.post(
                "/api/messages/send",
                json={
                    "to_number": "+12025550179",
                    "payment_url": "https://pay.stripe.com/test",
                    "restaurant_name": "Nonna's Pizza",
                },
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["channel"] == "sms"
        assert data["fallback_used"] is False

    def test_api_send_missing_fields_returns_422(self, client):
        """Missing required fields (to_number or payment_url) returns HTTP 422 Unprocessable Entity."""
        resp = client.post("/api/messages/send", json={"restaurant_name": "Nonna's"})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Test Suite 5: Payment Link Dispatch Integration (create_payment_link)
# ---------------------------------------------------------------------------

class TestPaymentLinkIntegration:
    """Verify that backend/app/api/payments.py invokes the messaging dispatcher."""

    @pytest.fixture
    def payments_client(self):
        from app.api.payments import router as payments_router
        app = FastAPI()
        app.include_router(payments_router, prefix="/api/payments")
        return TestClient(app)

    def test_create_payment_link_uses_messaging_dispatcher(self, payments_client):
        """create_payment_link routes through send_payment_message."""
        mock_order = MagicMock()
        mock_order.id = "order-123"
        mock_order.call_id = "call-456"
        mock_order.total_cents = 2500

        mock_call = MagicMock()
        mock_call.caller_number = "+61412345678"

        mock_session = MagicMock()
        mock_session.url = "https://pay.stripe.com/session_test"

        with patch("app.api.payments.get_platform_secret", new=AsyncMock(return_value="test-key")), \
             patch("app.api.payments.get_order", new=AsyncMock(return_value=mock_order)), \
             patch("app.api.payments.get_call", new=AsyncMock(return_value=mock_call)), \
             patch("stripe.checkout.Session.create", return_value=mock_session), \
             patch("app.api.payments.send_payment_message", new=AsyncMock()) as mock_dispatch:

            resp = payments_client.post("/api/payments/create-link/order-123")

        assert resp.status_code == 200
        assert resp.json()["payment_url"] == "https://pay.stripe.com/session_test"
        mock_dispatch.assert_called_once()
        call_kwargs = mock_dispatch.call_args.kwargs
        assert call_kwargs["to_number"] == "+61412345678"
        assert call_kwargs["payment_url"] == "https://pay.stripe.com/session_test"
