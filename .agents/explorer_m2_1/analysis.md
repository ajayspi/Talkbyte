# Technical Analysis: WhatsApp Business API Client & Multi-Channel Messaging Service

**Author**: `explorer_m2_1`  
**Date**: 2026-09-14  
**Target Modules**: `backend/app/services/whatsapp.py`, `backend/app/services/sms.py`, `backend/app/services/messaging.py`  
**Parent Task**: M2 (WhatsApp Business API Integration & SMS Fallback, Requirement R1)

---

## 1. Executive Summary

Requirement R1 mandates:
> *"After a restaurant customer completes an AI voice order, the system currently sends a Stripe Payment Link via Telnyx SMS. Extend the messaging layer so that if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API."*

In this investigation, we inspected the existing codebase and designed the multi-channel messaging service:
1. **Existing WhatsApp Client (`backend/app/services/whatsapp.py`)**:
   - Contains a functional initial implementation of `send_whatsapp_payment_link` calling Meta Graph API `v20.0`.
   - Australian mobile validation (`is_au_mobile`) currently uses regex `^\+614\d{8}$` which only accepts strict E.164. It fails domestic numbers starting with `04...`, international numbers without plus (`614...`), and numbers with parentheses or formatting.
   - Needs a comprehensive normalization utility `normalize_phone` providing canonical E.164 (`+614...` for Telnyx) and digits-only format (`614...` for Meta WhatsApp Cloud API).
2. **Existing SMS Service (`backend/app/services/sms.py`)**:
   - Currently embeds a temporary WhatsApp check directly inside `send_payment_sms`.
   - Existing unit tests in `backend/tests/unit/test_whatsapp.py` specifically test `sms.send_payment_sms`.
   - To decouple clean architecture while preserving 100% test compatibility, `sms.py` will support `force_sms: bool = False`, allowing `messaging.py` to trigger pure SMS fallback without redundant WhatsApp attempts, while legacy calls continue to function seamlessly.
3. **Multi-Channel Dispatcher (`backend/app/services/messaging.py`)**:
   - Designed as the central dispatch hub with function `send_payment_message(...) -> MessageResult`.
   - Routes AU mobile numbers to WhatsApp first.
   - On **ANY** failure (HTTP 4xx/5xx, Meta error `#131026`, missing credentials) or **ANY** exception (`httpx.TimeoutException`, network error, or unexpected exception), automatically executes Telnyx SMS fallback.
   - Non-AU numbers directly route to Telnyx SMS without attempting WhatsApp.
   - Returns structured `MessageResult` metadata with channel, fallback flag, message IDs, and error descriptions.

---

## 2. Investigation of `backend/app/services/whatsapp.py`

### 2.1 Current Implementation State
The existing file `backend/app/services/whatsapp.py` contains:
- `_GRAPH_API_BASE = "https://graph.facebook.com/v20.0"`
- `_AU_MOBILE_RE = re.compile(r"^\+614\d{8}$")`
- `is_au_mobile(phone_number: str) -> bool`
- `send_whatsapp_payment_link(to_number: str, payment_url: str, restaurant_name: str) -> bool`

### 2.2 Critical Findings & Edge Cases

#### 1. Phone Normalization Deficiencies
- **Current logic**:
  ```python
  def is_au_mobile(phone_number: str) -> bool:
      normalised = phone_number.replace(" ", "").replace("-", "")
      return bool(_AU_MOBILE_RE.match(normalised))
  ```
- **Observed Behavior**:
  - `+61412345678`: Evaluates to `True` (matches `^\+614\d{8}$`).
  - `+614 12 345 678`: Evaluates to `True`.
  - `0412345678` (Domestic standard): Evaluates to `False` (does not match `^\+614`).
  - `61412345678`: Evaluates to `False`.
  - `(04) 1234-5678`: Evaluates to `False` (parentheses not stripped).
- **Impact**: In Australia, restaurant voice callers or customer records frequently provide domestic numbers (`0412 345 678`). If not normalized, all domestic callers would falsely be classified as `is_au_mobile = False` and bypassed directly to SMS!
- **Resolution**:
  Implement a robust `normalize_phone` helper and enhance `is_au_mobile`:
  ```python
  from typing import NamedTuple
  import re

  class NormalizedPhone(NamedTuple):
      raw: str
      e164: str          # e.g. "+61412345678" (Telnyx standard)
      whatsapp_to: str   # e.g. "61412345678" (Meta Cloud API standard)
      is_au_mobile: bool
      is_valid: bool
  ```
  `is_au_mobile` should return `True` for:
  - `+614xxxxxxxx`
  - `614xxxxxxxx`
  - `04xxxxxxxx`
  while retaining `False` for landlines (`02`, `03`, `07`, `08`, `+612...`), non-AU numbers (`+1...`), and incorrect digit lengths.

#### 2. Meta WhatsApp Business Cloud API Contract
- **Endpoint**:
  `POST https://graph.facebook.com/{version}/{phone_number_id}/messages`
- **Dynamic Configuration**:
  Currently hardcoded to `v20.0`. It should check for `WHATSAPP_API_VERSION` via `get_platform_secret` with fallback to `"v20.0"` (or `"v18.0"`).
- **Recipient Formatting**:
  Meta's Graph API requires recipient phone numbers to be digits only, with country code, without leading `+` or domestic prefixes.
  - Correct: `"to": "61412345678"`
  - Incorrect: `"to": "+61412345678"` or `"to": "0412345678"`
  Using `normalize_phone(to_number).whatsapp_to` guarantees that whether the caller supplies `0412345678` or `+61412345678`, the Meta API receives `61412345678`.

#### 3. Error Handling & Status Detection
Meta Cloud API returns HTTP 200 on accepted delivery:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{"input": "61412345678", "wa_id": "61412345678"}],
  "messages": [{"id": "wamid.HBgL..."}]
}
```
When a number is not registered on WhatsApp or unreachable:
```json
{
  "error": {
    "message": "(#131026) Message undeliverable",
    "type": "OAuthException",
    "code": 131026,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Receiver is incapable of receiving this message"
    }
  }
}
```
`send_whatsapp_payment_link` safely catches:
- HTTP status != 200 (logs warning and returns `False`).
- `httpx.TimeoutException` (logs error and returns `False`).
- Generic `Exception` (logs error and returns `False`).

### 2.3 Proposed Refined Implementation for `backend/app/services/whatsapp.py`

```python
"""
WhatsApp Business Cloud API service.

Sends payment-link messages via the Meta WhatsApp Business Cloud API.
Falls back gracefully so the caller can switch to Telnyx SMS on any failure.
"""

from __future__ import annotations

import re
from typing import NamedTuple
import httpx
import structlog

from app.db.supabase import get_platform_secret

log = structlog.get_logger()

# Default Meta Graph API base URL
_DEFAULT_GRAPH_API_VERSION = "v20.0"
_GRAPH_API_HOST = "https://graph.facebook.com"

# AU mobile numbers: +614xxxxxxxx (8 digits after +614)
_AU_MOBILE_RE = re.compile(r"^\+614\d{8}$")


class NormalizedPhone(NamedTuple):
    """Normalized representation of a phone number."""
    raw: str
    e164: str          # "+61412345678" for Telnyx SMS
    whatsapp_to: str   # "61412345678" for Meta WhatsApp Cloud API
    is_au_mobile: bool
    is_valid: bool


def normalize_phone(phone_number: str) -> NormalizedPhone:
    """
    Parse, validate, and normalize any phone number into canonical formats.

    Supports:
    - Domestic AU mobile: 0412345678 -> E.164: +61412345678, WhatsApp: 61412345678
    - International AU mobile: +61412345678 or 61412345678
    - Formatted AU mobile: (0412) 345-678, +61 412 345 678
    - Non-AU international: +12025550179
    """
    if not phone_number:
        return NormalizedPhone(raw="", e164="", whatsapp_to="", is_au_mobile=False, is_valid=False)

    cleaned = re.sub(r"[\s\-\(\)\.]", "", str(phone_number).strip())

    # Domestic AU mobile: 04XXXXXXXX (10 digits starting with 04)
    if re.match(r"^04\d{8}$", cleaned):
        digits = "61" + cleaned[1:]
        return NormalizedPhone(
            raw=phone_number,
            e164="+" + digits,
            whatsapp_to=digits,
            is_au_mobile=True,
            is_valid=True,
        )

    # International AU mobile with '+': +614XXXXXXXX (12 characters)
    if _AU_MOBILE_RE.match(cleaned):
        digits = cleaned[1:]
        return NormalizedPhone(
            raw=phone_number,
            e164=cleaned,
            whatsapp_to=digits,
            is_au_mobile=True,
            is_valid=True,
        )

    # International AU mobile digits only: 614XXXXXXXX (11 digits)
    if re.match(r"^614\d{8}$", cleaned):
        return NormalizedPhone(
            raw=phone_number,
            e164="+" + cleaned,
            whatsapp_to=cleaned,
            is_au_mobile=True,
            is_valid=True,
        )

    # AU Landline: 02/03/07/08
    if re.match(r"^0[2378]\d{8}$", cleaned):
        digits = "61" + cleaned[1:]
        return NormalizedPhone(
            raw=phone_number,
            e164="+" + digits,
            whatsapp_to=digits,
            is_au_mobile=False,
            is_valid=True,
        )
    if re.match(r"^\+61[2378]\d{8}$", cleaned):
        return NormalizedPhone(
            raw=phone_number,
            e164=cleaned,
            whatsapp_to=cleaned[1:],
            is_au_mobile=False,
            is_valid=True,
        )

    # General International E.164 (+ followed by 7 to 15 digits)
    if re.match(r"^\+[1-9]\d{6,14}$", cleaned):
        return NormalizedPhone(
            raw=phone_number,
            e164=cleaned,
            whatsapp_to=cleaned[1:],
            is_au_mobile=False,
            is_valid=True,
        )

    # Unparseable fallback
    return NormalizedPhone(
        raw=phone_number,
        e164=cleaned if cleaned.startswith("+") else "+" + cleaned,
        whatsapp_to=cleaned.lstrip("+"),
        is_au_mobile=False,
        is_valid=False,
    )


def is_au_mobile(phone_number: str) -> bool:
    """
    Return True if *phone_number* is an Australian mobile number.

    Accepts E.164 (+614xxxxxxxx), domestic (04xxxxxxxx), or digits-only (614xxxxxxxx)
    with or without whitespace, hyphens, and parentheses.
    """
    return normalize_phone(phone_number).is_au_mobile


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
        Recipient phone number (E.164, domestic, or digits-only).
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

    norm = normalize_phone(to_number)
    recipient = norm.whatsapp_to or to_number.lstrip("+")

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

    api_version = await get_platform_secret("WHATSAPP_API_VERSION") or _DEFAULT_GRAPH_API_VERSION
    url = f"{_GRAPH_API_HOST}/{api_version}/{phone_number_id}/messages"
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
        error_code = None
        error_details = response.text[:500]
        try:
            err_json = response.json().get("error", {})
            error_code = err_json.get("code")
            error_details = err_json.get("message")
        except Exception:
            pass

        log.warning(
            "whatsapp.api_error",
            to=to_number,
            status_code=response.status_code,
            error_code=error_code,
            details=error_details,
        )
        return False

    except httpx.TimeoutException as exc:
        log.error("whatsapp.timeout", to=to_number, error=str(exc))
        return False
    except Exception as exc:  # noqa: BLE001
        log.error("whatsapp.unexpected_error", to=to_number, error=str(exc))
        return False
```

---

## 3. Investigation of `backend/app/services/sms.py`

### 3.1 Current Implementation State
In `backend/app/services/sms.py`:
- `send_payment_sms(to_number: str, from_number: str, payment_url: str, restaurant_name: str) -> None`
- Lines 51-65 currently perform an internal check: `if is_au_mobile(to_number): ...`
- If WhatsApp delivery succeeds, it returns early; otherwise it proceeds to `telnyx.Message.create(...)`.

### 3.2 Coordination with `messaging.py`
When `messaging.py` is introduced as the multi-channel service:
- `messaging.py` attempts WhatsApp delivery first.
- If WhatsApp fails, `messaging.py` falls back to `send_payment_sms`.
- **Problem**: If `send_payment_sms` also tries WhatsApp, the WhatsApp API would be queried twice unnecessarily!
- **Existing Unit Tests**: `backend/tests/unit/test_whatsapp.py` contains `TestSendPaymentSmsWithWhatsAppFallback` which asserts `sms.send_payment_sms` executes the WhatsApp check when called directly.
- **Solution**:
  Add an optional keyword-only parameter `force_sms: bool = False` to `send_payment_sms`:
  - When called from legacy code or existing unit tests (`force_sms=False`), it performs the WhatsApp check as before.
  - When called as a fallback from `messaging.py` (`force_sms=True`), it bypasses WhatsApp and goes straight to Telnyx SMS.
  - Return `bool` (`True` if message sent, `False` on exception).

### 3.3 Proposed Implementation for `backend/app/services/sms.py`

```python
"""
SMS service via Telnyx with backward-compatible WhatsApp-first routing.
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
    *,
    force_sms: bool = False,
) -> bool:
    """
    Send payment link via Telnyx SMS, with backward-compatible WhatsApp check.

    Parameters
    ----------
    to_number:
        Recipient phone number in E.164 format.
    from_number:
        Telnyx sender phone number.
    payment_url:
        Stripe Checkout URL.
    restaurant_name:
        Restaurant name.
    force_sms:
        If True, bypasses WhatsApp delivery and directly sends via Telnyx SMS.
        Defaults to False for backward compatibility with existing tests.

    Returns
    -------
    bool
        True if sent successfully via either channel, False on failure.
    """
    # Backward compatibility: If not forced SMS, attempt WhatsApp for AU mobiles
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

    # -- Telnyx SMS Delivery ---------------------------------------------------
    telnyx.api_key = await get_platform_secret("TELNYX_API_KEY")
    message_text = (
        f"Thank you for ordering with {restaurant_name}! "
        f"Complete your payment here: {payment_url}"
    )
    try:
        telnyx.Message.create(
            to=to_number,
            _from=from_number,
            text=message_text,
        )
        log.info("sms.payment_link_sent", to=to_number, url=payment_url)
        return True
    except Exception as e:
        log.error("sms.payment_link_failed", error=str(e), to=to_number)
        return False
```

---

## 4. Design of `backend/app/services/messaging.py`

### 4.1 Architecture & Responsibility
`backend/app/services/messaging.py` is the top-level multi-channel messaging service. It acts as the single source of truth for outbound notifications.

```
                              Incoming Message Request
                         (to_number, payment_url, ...)
                                       │
                                       ▼
                             [Phone Normalization]
                         (e.g. 0412345678 -> +61412345678)
                                       │
                        Is Australian Mobile Number?
                         (is_au_mobile == True)
                                       │
                       ┌───────────────┴───────────────┐
                      YES                              NO
                       │                               │
                       ▼                               │
              [Try WhatsApp API]                       │
                       │                               │
            ┌──────────┴──────────┐                    │
         Success               Failure                 │
     (HTTP 200 OK)       (API error, 131026,           │
            │           Timeout, or Exception)         │
            │                     │                    │
            │                     └────────────┐       │
            ▼                                  ▼       ▼
    [Return MessageResult]              [Telnyx SMS Delivery]
    channel: "whatsapp"                   (force_sms=True)
    fallback_used: False                       │
                                        ┌──────┴──────┐
                                     Success       Failure
                                        │             │
                                        ▼             ▼
                                [Return MessageResult]
                                channel: "sms"
                                fallback_used: True/False
                                success: True / False
```

### 4.2 Detailed Return Signature: `MessageResult`
To satisfy the requirement: *"Ensure return signature and status metadata"*:
We provide a dataclass `MessageResult` with explicit fields:
- `success: bool`: whether the message was accepted by either channel.
- `channel: str`: `"whatsapp"`, `"sms"`, or `"none"`.
- `to_number: str`: the normalized phone number used for dispatch.
- `fallback_used: bool`: `True` if WhatsApp was attempted and failed, causing SMS fallback.
- `message_id: Optional[str]`: provider message ID if available.
- `error: Optional[str]`: error message if all delivery channels failed.
- `details: Optional[str]`: descriptive narrative of the outcome.
- Helper method `to_dict() -> dict[str, Any]` for serialization.

### 4.3 Resilience & Fallback Guarantees
1. **Any Exception during WhatsApp is Caught**:
   `send_payment_message` encapsulates the call to `send_whatsapp_payment_link` in a blanket `try...except Exception as exc:` block. Even if unexpected library errors, DNS resolution issues, or argument bugs occur in `whatsapp.py`, execution proceeds directly to `send_payment_sms`.
2. **Soft Failure Detection**:
   If `send_whatsapp_payment_link` returns `False` (e.g. Meta error `#131026` or HTTP 400), it immediately falls back to SMS.
3. **Non-AU Fast-Path**:
   Non-AU mobile numbers (e.g. `+1...`) and AU landlines (`02...`) skip WhatsApp entirely and execute Telnyx SMS directly with `fallback_used = False`.
4. **Sender Number Resolution**:
   If `from_number` is not provided in the parameters, `messaging.py` automatically resolves `TELNYX_PHONE_NUMBER` from `platform_secrets` (falling back to `+61411111111`).

### 4.4 Complete Implementation for `backend/app/services/messaging.py`

```python
"""
Multi-channel messaging service.

Routes outbound customer messages (such as Stripe payment links) across
channels with automatic failover:
1. Australian mobile numbers (+614xxxxxxxx) are routed to Meta WhatsApp Business Cloud API first.
2. If WhatsApp delivery fails for ANY reason (user not registered on WhatsApp,
   API error, network timeout, missing credentials, or exception), the service
   immediately falls back to Telnyx SMS.
3. Non-AU numbers or non-mobile numbers bypass WhatsApp and route directly to Telnyx SMS.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Optional
import structlog

from app.db.supabase import get_platform_secret
from app.services.whatsapp import (
    is_au_mobile,
    send_whatsapp_payment_link,
    normalize_phone,
)
from app.services.sms import send_payment_sms

log = structlog.get_logger()


@dataclass
class MessageResult:
    """Result of a multi-channel message dispatch attempt."""
    success: bool
    channel: str              # "whatsapp" | "sms" | "none"
    to_number: str            # Normalized recipient number
    fallback_used: bool = False
    message_id: Optional[str] = None
    error: Optional[str] = None
    details: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert result to dictionary representation."""
        return asdict(self)


async def send_payment_message(
    to_number: str,
    payment_url: str,
    restaurant_name: str = "Our Restaurant",
    from_number: Optional[str] = None,
) -> MessageResult:
    """
    Dispatch a payment link to a customer via WhatsApp with Telnyx SMS fallback.

    Routing Strategy
    ----------------
    1. Recipient phone number is normalized to canonical E.164.
    2. If recipient is an Australian mobile (+614xxxxxxxx, 04xxxxxxxx):
       - Attempt delivery via Meta WhatsApp Business Cloud API.
       - If WhatsApp delivery succeeds: return with channel='whatsapp', fallback_used=False.
       - If WhatsApp delivery returns False or raises ANY exception:
         Fall back immediately to Telnyx SMS with fallback_used=True.
    3. If recipient is not an Australian mobile:
       - Direct delivery via Telnyx SMS with fallback_used=False.

    Parameters
    ----------
    to_number:
        Recipient phone number (E.164 e.g. ``+61412345678``, domestic ``0412345678``, etc.).
    payment_url:
        Stripe Checkout URL to include in the message body.
    restaurant_name:
        Display name of the restaurant.
    from_number:
        Telnyx sender number. If None, loaded from TELNYX_PHONE_NUMBER secret.

    Returns
    -------
    MessageResult
        Comprehensive metadata detailing the delivery channel, status, and fallback flag.
    """
    # 1. Resolve fallback sender number
    if not from_number:
        from_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"

    # 2. Normalize recipient number
    norm = normalize_phone(to_number)
    target_e164 = norm.e164 or to_number

    log.info(
        "messaging.dispatch_started",
        raw_to=to_number,
        normalized=target_e164,
        is_au_mobile=norm.is_au_mobile,
    )

    # 3. Route Australian mobile numbers to WhatsApp first
    if norm.is_au_mobile:
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
            return MessageResult(
                success=True,
                channel="whatsapp",
                to_number=target_e164,
                fallback_used=False,
                details="Delivered via Meta WhatsApp Business Cloud API",
            )

        # WhatsApp delivery unsuccessful or raised exception -> SMS fallback
        log.info(
            "messaging.fallback_to_sms",
            to=target_e164,
            reason=whatsapp_error or "WhatsApp delivery returned False",
        )

        try:
            sms_ok = await send_payment_sms(
                to_number=target_e164,
                from_number=from_number,
                payment_url=payment_url,
                restaurant_name=restaurant_name,
                force_sms=True,
            )
            return MessageResult(
                success=sms_ok is not False,
                channel="sms",
                to_number=target_e164,
                fallback_used=True,
                details="Delivered via Telnyx SMS (WhatsApp delivery failed or unavailable)",
            )
        except Exception as exc:  # noqa: BLE001
            log.error(
                "messaging.fallback_sms_failed",
                to=target_e164,
                error=str(exc),
            )
            return MessageResult(
                success=False,
                channel="sms",
                to_number=target_e164,
                fallback_used=True,
                error=str(exc),
                details="Both WhatsApp and Telnyx SMS fallback failed",
            )

    # 4. Non-AU mobile -> Direct to Telnyx SMS
    log.info("messaging.direct_sms", to=target_e164)
    try:
        sms_ok = await send_payment_sms(
            to_number=target_e164,
            from_number=from_number,
            payment_url=payment_url,
            restaurant_name=restaurant_name,
            force_sms=True,
        )
        return MessageResult(
            success=sms_ok is not False,
            channel="sms",
            to_number=target_e164,
            fallback_used=False,
            details="Delivered via Telnyx SMS (non-AU destination)",
        )
    except Exception as exc:  # noqa: BLE001
        log.error("messaging.direct_sms_failed", to=target_e164, error=str(exc))
        return MessageResult(
            success=False,
            channel="sms",
            to_number=target_e164,
            fallback_used=False,
            error=str(exc),
            details="Telnyx SMS delivery failed",
        )
```

---

## 5. Downstream Integration Specifications

### 5.1 Internal Messaging API Endpoint (`POST /api/messages/send`)
For `explorer_m2_2` and the implementing worker:
The router in `backend/app/api/messages.py` can directly consume `send_payment_message`:

```python
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.messaging import send_payment_message

router = APIRouter()

class SendMessageRequest(BaseModel):
    to_number: str = Field(..., description="Recipient phone number")
    payment_url: str = Field(..., description="Stripe Checkout URL")
    restaurant_name: str = Field(default="Our Restaurant", description="Restaurant name")
    from_number: str | None = Field(default=None, description="Sender number for SMS")

class SendMessageResponse(BaseModel):
    success: bool
    channel: str
    to_number: str
    fallback_used: bool
    message_id: str | None = None
    error: str | None = None
    details: str | None = None

@router.post("/send", response_model=SendMessageResponse)
async def send_message_endpoint(payload: SendMessageRequest):
    result = await send_payment_message(
        to_number=payload.to_number,
        payment_url=payload.payment_url,
        restaurant_name=payload.restaurant_name,
        from_number=payload.from_number,
    )
    return SendMessageResponse(
        success=result.success,
        channel=result.channel,
        to_number=result.to_number,
        fallback_used=result.fallback_used,
        message_id=result.message_id,
        error=result.error,
        details=result.details,
    )
```

### 5.2 Payment Link Generation (`backend/app/api/payments.py:create_payment_link`)
In `create_payment_link`:
Replace line 8 (`from app.services.sms import send_payment_sms`) and line 75 (`await send_payment_sms(...)`):
```python
from app.services.messaging import send_payment_message

...
await send_payment_message(
    to_number=customer_number,
    from_number=telnyx_number,
    payment_url=session.url,
    restaurant_name="Our Restaurant"
)
```

---

## 6. Unit Testing Strategy & Test Cases

For `explorer_m2_3` and test implementation in `backend/tests/unit/test_messaging.py`:

| Test Function | Scenario | Expected Behavior |
|---|---|---|
| `test_normalize_au_domestic` | Input `"0412 345 678"` | Returns `e164="+61412345678"`, `whatsapp_to="61412345678"`, `is_au_mobile=True` |
| `test_normalize_au_e164` | Input `"+61412345678"` | Returns `e164="+61412345678"`, `whatsapp_to="61412345678"`, `is_au_mobile=True` |
| `test_normalize_non_au` | Input `"+12025550179"` | Returns `is_au_mobile=False` |
| `test_send_payment_message_whatsapp_success` | AU number, Meta 200 | WhatsApp called, Telnyx not called, `result.channel == "whatsapp"`, `result.fallback_used is False` |
| `test_send_payment_message_whatsapp_error_fallback` | AU number, Meta 400 (e.g. 131026) | WhatsApp called, Telnyx called, `result.channel == "sms"`, `result.fallback_used is True` |
| `test_send_payment_message_whatsapp_exception_fallback` | AU number, `httpx.TimeoutException` | WhatsApp raises exception, caught, Telnyx called, `result.channel == "sms"`, `result.fallback_used is True` |
| `test_send_payment_message_non_au_skips_whatsapp` | Non-AU number `+1...` | WhatsApp not called, Telnyx called, `result.channel == "sms"`, `result.fallback_used is False` |

---

## 7. Implementation Checklist

- [ ] Update `backend/app/services/whatsapp.py`:
  - Add `normalize_phone` and `NormalizedPhone`.
  - Enhance `is_au_mobile` to support domestic `04...` and formatted numbers.
  - Enhance `send_whatsapp_payment_link` to use `normalize_phone(to_number).whatsapp_to` and support `WHATSAPP_API_VERSION`.
- [ ] Update `backend/app/services/sms.py`:
  - Add `force_sms: bool = False` to `send_payment_sms`.
  - Return boolean status.
- [ ] Create `backend/app/services/messaging.py`:
  - Implement `MessageResult` and `send_payment_message`.
- [ ] Preserve 100% passing status for `backend/tests/unit/test_whatsapp.py`.
