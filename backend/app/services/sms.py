"""
Messaging service - WhatsApp-first with Telnyx SMS fallback.

Delivery strategy
-----------------
1. If the destination is an Australian mobile (+614xxxxxxxx), attempt
   delivery via the Meta WhatsApp Business Cloud API.
2. If WhatsApp delivery succeeds, return immediately.
3. If WhatsApp delivery fails for any reason (bad credentials, number not
   on WhatsApp, network error, etc.), fall back to plain SMS via Telnyx.
4. Non-AU numbers skip WhatsApp entirely and go straight to Telnyx SMS.
"""

from __future__ import annotations

import telnyx
import structlog

from app.db.supabase import get_platform_secret
from app.services.whatsapp import is_au_mobile, send_whatsapp_payment_link

log = structlog.get_logger()

async def send_payment_sms(
    to_number: str,
    from_number: str,
    payment_url: str,
    restaurant_name: str,
    force_sms: bool = False,
) -> bool:
    """
    Send the Stripe payment link to the customer.
    """
    if not force_sms and is_au_mobile(to_number):
        log.info("messaging.whatsapp_attempt", to=to_number)
        whatsapp_ok = await send_whatsapp_payment_link(
            to_number=to_number,
            payment_url=payment_url,
            restaurant_name=restaurant_name,
        )
        if whatsapp_ok:
            return True
        log.info(
            "messaging.whatsapp_failed_sms_fallback",
            to=to_number,
            reason="WhatsApp delivery unsuccessful",
        )

    api_key = await get_platform_secret("TELNYX_API_KEY")
    client = telnyx.Telnyx(api_key=api_key)
    message_text = (
        f"Thank you for ordering with {restaurant_name}! "
        f"Complete your payment here: {payment_url}"
    )
    try:
        client.messages.send(
            to=to_number,
            from_=from_number,
            text=message_text,
        )
        log.info("sms.payment_link_sent", to=to_number, url=payment_url)
        return True
    except Exception as e:
        log.error("sms.payment_link_failed", error=str(e), to=to_number)
        return False
