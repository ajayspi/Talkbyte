"""
SMS service via Telnyx.
"""

import telnyx
from config import config
import structlog
from app.db.supabase import get_platform_secret

log = structlog.get_logger()


async def send_payment_sms(to_number: str, from_number: str, payment_url: str, restaurant_name: str) -> None:
    telnyx.api_key = await get_platform_secret("TELNYX_API_KEY")
    """
    Send an SMS to the customer with their Stripe payment link.
    """
    message_text = f"Thank you for ordering with {restaurant_name}! Complete your payment here: {payment_url}"
    try:
        # Telnyx SDK is synchronous for Message.create by default,
        # but we can wrap it or just call it directly if it supports async.
        # It's usually fine to call it directly in a background task or threaded.
        telnyx.Message.create(
            to=to_number,
            _from=from_number,
            text=message_text
        )
        log.info("sms.payment_link_sent", to=to_number, url=payment_url)
    except Exception as e:
        log.error("sms.payment_link_failed", error=str(e), to=to_number)
