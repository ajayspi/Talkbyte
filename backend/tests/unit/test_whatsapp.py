"""
Unit tests for app.services.whatsapp and the WhatsApp-first SMS fallback
logic in app.services.sms.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# is_au_mobile
# ---------------------------------------------------------------------------

class TestIsAuMobile:
    """Verify AU mobile number detection logic."""

    def test_valid_au_mobile_e164(self):
        from app.services.whatsapp import is_au_mobile
        assert is_au_mobile("+61412345678") is True

    def test_valid_au_mobile_starting_4(self):
        from app.services.whatsapp import is_au_mobile
        assert is_au_mobile("+61499999999") is True

    def test_non_au_number(self):
        from app.services.whatsapp import is_au_mobile
        assert is_au_mobile("+12025550179") is False

    def test_au_landline_not_mobile(self):
        from app.services.whatsapp import is_au_mobile
        # Landline: +6129xxxxxxx — does NOT start with +614
        assert is_au_mobile("+61291234567") is False

    def test_au_mobile_with_spaces_normalised(self):
        from app.services.whatsapp import is_au_mobile
        # Spaces are stripped before matching
        assert is_au_mobile("+614 12 345 678") is True

    def test_au_mobile_with_dashes_normalised(self):
        from app.services.whatsapp import is_au_mobile
        assert is_au_mobile("+614-12-345-678") is True

    def test_too_short_au_number(self):
        from app.services.whatsapp import is_au_mobile
        assert is_au_mobile("+614123456") is False  # Only 7 digits after +614

    def test_too_long_au_number(self):
        from app.services.whatsapp import is_au_mobile
        assert is_au_mobile("+614123456789") is False  # 9 digits after +614


# ---------------------------------------------------------------------------
# send_whatsapp_payment_link
# ---------------------------------------------------------------------------

class TestSendWhatsappPaymentLink:
    """Verify WhatsApp message sending and failure paths."""

    @pytest.mark.asyncio
    async def test_sends_message_successfully(self):
        from app.services.whatsapp import send_whatsapp_payment_link

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "messaging_product": "whatsapp",
            "messages": [{"id": "wamid.test123"}],
        }

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=[
            "12345678901",   # WHATSAPP_PHONE_NUMBER_ID
            "test_token",    # WHATSAPP_ACCESS_TOKEN
        ])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(return_value=mock_response)
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                result = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test",
                    restaurant_name="Burger Palace",
                )

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_on_api_error(self):
        from app.services.whatsapp import send_whatsapp_payment_link

        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = '{"error": {"message": "Invalid phone number"}}'

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=[
            "12345678901",
            "test_token",
        ])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(return_value=mock_response)
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                result = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test",
                    restaurant_name="Burger Palace",
                )

        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_when_credentials_missing(self):
        from app.services.whatsapp import send_whatsapp_payment_link

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(return_value="")):
            result = await send_whatsapp_payment_link(
                to_number="+61412345678",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Burger Palace",
            )

        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_on_network_error(self):
        import httpx
        from app.services.whatsapp import send_whatsapp_payment_link

        with patch("app.services.whatsapp.get_platform_secret", new=AsyncMock(side_effect=[
            "12345678901",
            "test_token",
        ])):
            with patch("httpx.AsyncClient") as mock_client_cls:
                mock_client = AsyncMock()
                mock_client.post = AsyncMock(
                    side_effect=httpx.TimeoutException("timed out")
                )
                mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
                mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

                result = await send_whatsapp_payment_link(
                    to_number="+61412345678",
                    payment_url="https://pay.stripe.com/test",
                    restaurant_name="Burger Palace",
                )

        assert result is False


# ---------------------------------------------------------------------------
# send_payment_sms (fallback integration)
# ---------------------------------------------------------------------------

class TestSendPaymentSmsWithWhatsAppFallback:
    """Verify the WhatsApp-first -> SMS-fallback orchestration in sms.py."""

    @pytest.mark.asyncio
    async def test_au_mobile_uses_whatsapp_first(self):
        """WhatsApp is called for AU mobiles; Telnyx is NOT called if WA succeeds."""
        from app.services import sms

        with patch("app.services.sms.is_au_mobile", return_value=True), \
             patch("app.services.sms.send_whatsapp_payment_link", new=AsyncMock(return_value=True)), \
             patch("app.services.sms.get_platform_secret", new=AsyncMock(return_value="key")), \
             patch("telnyx.Message.create") as mock_telnyx:

            await sms.send_payment_sms(
                to_number="+61412345678",
                from_number="+61411111111",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Test Restaurant",
            )

            mock_telnyx.assert_not_called()

    @pytest.mark.asyncio
    async def test_au_mobile_falls_back_to_sms_when_whatsapp_fails(self):
        """When WhatsApp fails for an AU number, Telnyx SMS is sent."""
        from app.services import sms

        with patch("app.services.sms.is_au_mobile", return_value=True), \
             patch("app.services.sms.send_whatsapp_payment_link", new=AsyncMock(return_value=False)), \
             patch("app.services.sms.get_platform_secret", new=AsyncMock(return_value="key")), \
             patch("telnyx.Message.create") as mock_telnyx:

            await sms.send_payment_sms(
                to_number="+61412345678",
                from_number="+61411111111",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Test Restaurant",
            )

            mock_telnyx.assert_called_once()

    @pytest.mark.asyncio
    async def test_non_au_number_skips_whatsapp(self):
        """Non-AU numbers never attempt WhatsApp; Telnyx is called directly."""
        from app.services import sms

        with patch("app.services.sms.is_au_mobile", return_value=False), \
             patch("app.services.sms.send_whatsapp_payment_link", new=AsyncMock()) as mock_wa, \
             patch("app.services.sms.get_platform_secret", new=AsyncMock(return_value="key")), \
             patch("telnyx.Message.create") as mock_telnyx:

            await sms.send_payment_sms(
                to_number="+12025550179",
                from_number="+61411111111",
                payment_url="https://pay.stripe.com/test",
                restaurant_name="Test Restaurant",
            )

            mock_wa.assert_not_called()
            mock_telnyx.assert_called_once()
