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


from typing import NamedTuple


class NormalizedPhone(NamedTuple):
    """Normalized representation of a phone number."""
    raw: str
    is_valid: bool
    is_au_mobile: bool
    e164: str
    whatsapp_id: str

    @property
    def whatsapp_to(self) -> str:
        """Alias for Meta WhatsApp recipient format."""
        return self.whatsapp_id


def normalize_phone_number(raw_number: str) -> NormalizedPhone:
    """
    Parse, validate, and normalize any phone number into canonical formats.

    Supports:
    - Domestic AU mobile: 0412345678 -> E.164: +61412345678, WhatsApp: 61412345678
    - International AU mobile: +61412345678 or 61412345678
    - Formatted AU mobile: (04) 1234 5678, 0412-345-678, 0412.345.678, +61 412 345 678
    - AU landlines: 02/03/07/08 -> is_valid=True, is_au_mobile=False
    - Non-AU international: +12025550179 -> is_valid=True, is_au_mobile=False
    - Malformed/invalid numbers -> is_valid=False, is_au_mobile=False
    """
    if not raw_number or not isinstance(raw_number, str):
        return NormalizedPhone(
            raw=str(raw_number) if raw_number else "",
            is_valid=False,
            is_au_mobile=False,
            e164="",
            whatsapp_id="",
        )

    cleaned = re.sub(r"[\s\-\(\)\.]", "", raw_number.strip())
    if not cleaned:
        return NormalizedPhone(raw=raw_number, is_valid=False, is_au_mobile=False, e164="", whatsapp_id="")

    # 1. Domestic AU mobile: 04XXXXXXXX (exactly 10 digits starting with 04)
    if re.match(r"^04\d{8}$", cleaned):
        digits = "61" + cleaned[1:]
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=True,
            e164="+" + digits,
            whatsapp_id=digits,
        )

    # 2. International AU mobile with '+': +614XXXXXXXX (exactly 12 chars)
    if _AU_MOBILE_RE.match(cleaned):
        digits = cleaned[1:]
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=True,
            e164=cleaned,
            whatsapp_id=digits,
        )

    # 3. International AU mobile digits only: 614XXXXXXXX (exactly 11 digits)
    if re.match(r"^614\d{8}$", cleaned):
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=True,
            e164="+" + cleaned,
            whatsapp_id=cleaned,
        )

    # 4. AU Landline: 02/03/07/08 (10 digits starting with 02, 03, 07, 08)
    if re.match(r"^0[2378]\d{8}$", cleaned):
        digits = "61" + cleaned[1:]
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=False,
            e164="+" + digits,
            whatsapp_id=digits,
        )
    # AU Landline with +61
    if re.match(r"^\+61[2378]\d{8}$", cleaned):
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=False,
            e164=cleaned,
            whatsapp_id=cleaned[1:],
        )
    # AU Landline with 61 digits only
    if re.match(r"^61[2378]\d{8}$", cleaned):
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=False,
            e164="+" + cleaned,
            whatsapp_id=cleaned,
        )

    # If it starts with Australian prefixes (+61, 61, 0) but didn't match valid AU patterns above, it's invalid
    if cleaned.startswith("+61") or cleaned.startswith("61") or cleaned.startswith("0"):
        return NormalizedPhone(
            raw=raw_number,
            is_valid=False,
            is_au_mobile=False,
            e164=cleaned if cleaned.startswith("+") else "+" + cleaned,
            whatsapp_id=cleaned.lstrip("+"),
        )

    # 5. General International E.164 (+ followed by 7 to 14 digits, country code 1-9)
    if re.match(r"^\+[1-9]\d{6,13}$", cleaned):
        return NormalizedPhone(
            raw=raw_number,
            is_valid=True,
            is_au_mobile=False,
            e164=cleaned,
            whatsapp_id=cleaned[1:],
        )

    # Unparseable / invalid fallback
    return NormalizedPhone(
        raw=raw_number,
        is_valid=False,
        is_au_mobile=False,
        e164=cleaned if cleaned.startswith("+") else "+" + cleaned,
        whatsapp_id=cleaned.lstrip("+"),
    )


# Alias for backward compatibility / alternate naming
normalize_phone = normalize_phone_number


def is_au_mobile(phone_number: str) -> bool:
    """
    Return True if *phone_number* is an Australian mobile number.

    Accepts E.164 (+614xxxxxxxx), domestic (04xxxxxxxx), or digits-only (614xxxxxxxx)
    with or without whitespace, hyphens, and parentheses.
    """
    return normalize_phone_number(phone_number).is_au_mobile



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

    norm = normalize_phone_number(to_number)
    recipient = norm.whatsapp_id if (norm.is_valid and norm.whatsapp_id) else to_number.lstrip("+")

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
