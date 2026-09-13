"""
WhatsApp Business Cloud API service.

Sends payment-link messages via the Meta WhatsApp Business Cloud API.
Falls back gracefully so the caller can switch to Telnyx SMS on any failure.
"""

from __future__ import annotations

import re
import structlog
import httpx

from app.db.supabase import get_platform_secret

log = structlog.get_logger()

# Meta Graph API base URL (version pinned for stability)
_GRAPH_API_BASE = "https://graph.facebook.com/v20.0"

# AU mobile numbers: +614xxxxxxxx  (8 digits after +614)
# Matches +61 4xx xxx xxx in any formatting, normalised to E.164
_AU_MOBILE_RE = re.compile(r"^\+614\d{8}$")


def is_au_mobile(phone_number: str) -> bool:
    """
    Return True if *phone_number* is an Australian mobile number.

    Accepts E.164 format only (e.g. ``+61412345678``).
    Australian mobiles start with ``+614`` followed by 8 digits.
    """
    normalised = phone_number.replace(" ", "").replace("-", "")
    return bool(_AU_MOBILE_RE.match(normalised))


async def send_whatsapp_payment_link(
    to_number: str,
    payment_url: str,
    restaurant_name: str,
) -> bool:
    """
    Send a payment-link message via the Meta WhatsApp Business Cloud API.

    Parameters
    ----------
    to_number:
        Recipient phone number in E.164 format (e.g. ``+61412345678``).
    payment_url:
        Stripe Checkout URL to include in the message.
    restaurant_name:
        Display name of the restaurant, used in the message body.

    Returns
    -------
    bool
        ``True`` if WhatsApp delivery was accepted by the API,
        ``False`` on any error (caller should fall back to SMS).
    """
    phone_number_id = await get_platform_secret("WHATSAPP_PHONE_NUMBER_ID")
    access_token = await get_platform_secret("WHATSAPP_ACCESS_TOKEN")

    if not phone_number_id or not access_token:
        log.warning(
            "whatsapp.credentials_missing",
            hint="Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in platform_secrets",
        )
        return False

    # Strip leading '+' -- Meta expects E.164 without the plus sign
    recipient = to_number.lstrip("+")

    message_text = (
        f"Thank you for ordering with {restaurant_name}! "
        f"Complete your payment here: {payment_url}"
    )

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message_text,
        },
    }

    url = f"{_GRAPH_API_BASE}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            data = response.json()
            message_id = (data.get("messages") or [{}])[0].get("id", "unknown")
            log.info(
                "whatsapp.payment_link_sent",
                to=to_number,
                message_id=message_id,
                url=payment_url,
            )
            return True

        # Non-200 -> treat as a soft failure so SMS fallback kicks in
        log.warning(
            "whatsapp.api_error",
            to=to_number,
            status_code=response.status_code,
            body=response.text[:500],
        )
        return False

    except httpx.TimeoutException as exc:
        log.error("whatsapp.timeout", to=to_number, error=str(exc))
        return False
    except Exception as exc:  # noqa: BLE001
        log.error("whatsapp.unexpected_error", to=to_number, error=str(exc))
        return False
