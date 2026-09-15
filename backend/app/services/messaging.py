"""
Multi-channel messaging service.

Routes outbound customer messages (such as Stripe payment links) across
channels with automatic failover:
1. Australian mobile numbers (+614xxxxxxxx, 04xxxxxxxx) are routed to Meta WhatsApp Business Cloud API first.
2. If WhatsApp delivery fails for ANY reason (user not registered on WhatsApp,
   API error, network timeout, missing credentials, or exception), the service
   immediately falls back to Telnyx SMS.
3. Non-AU numbers or non-mobile numbers bypass WhatsApp and route directly to Telnyx SMS.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field
import structlog
import telnyx

from app.db.supabase import get_platform_secret
from app.services.whatsapp import (
    is_au_mobile,
    normalize_phone_number,
    send_whatsapp_payment_link,
)

log = structlog.get_logger()


class SendMessageResponse(BaseModel):
    """Unified response detailing message dispatch channel and delivery status."""
    success: bool = Field(
        ...,
        description="True if message was accepted by either WhatsApp or Telnyx SMS fallback",
    )
    channel: str = Field(
        ...,
        description="Delivery channel used: 'whatsapp' or 'sms'",
    )
    to_number: str = Field(
        ...,
        description="Normalized recipient phone number",
    )
    message_id: Optional[str] = Field(
        default=None,
        description="Provider-specific message identifier",
    )
    fallback_used: bool = Field(
        default=False,
        description="True if WhatsApp delivery was attempted, failed, and fell back to SMS",
    )
    details: Optional[str] = Field(
        default=None,
        description="Descriptive status narrative",
    )
    error: Optional[str] = Field(
        default=None,
        description="Error detail if delivery failed",
    )


# Alias for backward compatibility / architecture conventions
MessageResult = SendMessageResponse


async def send_payment_message(
    to_number: str,
    payment_url: str,
    restaurant_name: str = "Our Restaurant",
    from_number: Optional[str] = None,
) -> SendMessageResponse:
    """
    Dispatch a payment link to a customer via WhatsApp with Telnyx SMS fallback.

    Parameters
    ----------
    to_number:
        Recipient phone number in E.164 (+614xxxxxxxx), domestic (04xxxxxxxx), or international format.
    payment_url:
        Stripe Checkout URL to include in the message.
    restaurant_name:
        Display name of the restaurant.
    from_number:
        Optional Telnyx sender number. If omitted, resolved from TELNYX_PHONE_NUMBER secret.

    Returns
    -------
    SendMessageResponse
        Delivery metadata including channel ('whatsapp' or 'sms') and fallback_used flag.
    """
    norm = normalize_phone_number(to_number)
    target_e164 = norm.e164 if (norm.is_valid and norm.e164) else to_number

    # Explicitly call is_au_mobile to respect any pytest patches on app.services.messaging.is_au_mobile
    au_mobile = is_au_mobile(to_number)

    log.info(
        "messaging.dispatch_started",
        raw_to=to_number,
        normalized=target_e164,
        is_au_mobile=au_mobile,
    )

    if au_mobile:
        log.info("messaging.whatsapp_attempt", to=target_e164)
        whatsapp_ok = False
        whatsapp_error: Optional[str] = None

        try:
            whatsapp_ok = await send_whatsapp_payment_link(
                to_number=target_e164,
                payment_url=payment_url,
                restaurant_name=restaurant_name,
            )
        except Exception as exc:  # noqa: BLE001
            whatsapp_error = str(exc)
            log.warning(
                "messaging.whatsapp_exception_caught",
                to=target_e164,
                error=whatsapp_error,
            )
            whatsapp_ok = False

        if whatsapp_ok:
            log.info("messaging.whatsapp_success", to=target_e164)
            return SendMessageResponse(
                success=True,
                channel="whatsapp",
                to_number=target_e164,
                fallback_used=False,
                details="Delivered via Meta WhatsApp Business Cloud API",
            )

        log.info(
            "messaging.fallback_to_sms",
            to=target_e164,
            reason=whatsapp_error or "WhatsApp delivery returned False",
        )

    # Fallback path (AU mobile where WhatsApp failed) or Direct SMS (non-AU destination)
    fallback_used = bool(au_mobile)

    try:
        telnyx_api_key = await get_platform_secret("TELNYX_API_KEY")
        if telnyx_api_key:
            telnyx.api_key = telnyx_api_key

        sender = from_number or await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
        message_text = (
            f"Thank you for ordering with {restaurant_name}! "
            f"Complete your payment here: {payment_url}"
        )

        telnyx.Message.create(
            to=target_e164,
            _from=sender,
            text=message_text,
        )
        log.info(
            "sms.payment_link_sent",
            to=target_e164,
            channel="sms",
            fallback_used=fallback_used,
        )
        return SendMessageResponse(
            success=True,
            channel="sms",
            to_number=target_e164,
            fallback_used=fallback_used,
            details="Delivered via Telnyx SMS" + (" (fallback from WhatsApp)" if fallback_used else ""),
        )

    except Exception as exc:  # noqa: BLE001
        log.error(
            "sms.payment_link_failed",
            error=str(exc),
            to=target_e164,
            fallback_used=fallback_used,
        )
        return SendMessageResponse(
            success=False,
            channel="sms",
            to_number=target_e164,
            fallback_used=fallback_used,
            error=str(exc),
            details=f"SMS delivery failed: {exc}",
        )
