# Backend Architecture & WhatsApp Messaging Analysis (Requirement R1)

## 1. Executive Summary

This report delivers an in-depth architectural and technical investigation for **Requirement R1 (WhatsApp Business API Integration & SMS Fallback)** for TalkByte AI:
> *"After a restaurant customer completes an AI voice order, the system currently sends a Stripe Payment Link via Telnyx SMS. Extend the messaging layer so that if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API."*

### Key Findings:
1. **Existing Messaging Layer**: Located in `backend/app/services/sms.py` (`send_payment_sms`), which directly calls `telnyx.Message.create(...)`. The payment link dispatch is invoked from `backend/app/api/payments.py:create_payment_link`.
2. **Internal Messaging Endpoint Status**: There is currently no dedicated internal messaging endpoint in `backend/app/api/`. Acceptance criteria requires: *"A POST to the backend's internal messaging endpoint with an AU mobile number routes to WhatsApp delivery logic... If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration."* We have designed an internal endpoint (`POST /api/messages/send`) and a unified messaging service (`app/services/messaging.py`) that handles WhatsApp delivery with Telnyx fallback.
3. **Australian Phone Normalization**: No phone normalization or validation exists in the codebase today. Australian numbers must be normalized from formats like `04XXXXXXXX`, `+614XXXXXXXX`, `614XXXXXXXX`, and formatted strings (`0412 345 678`) to E.164 (`+614XXXXXXXX` for Telnyx) and country-code format without leading plus (`614XXXXXXXX` for Meta WhatsApp Cloud API).
4. **Official Meta WhatsApp Business Cloud API**: Meta's Graph API `https://graph.facebook.com/{version}/{phone_number_id}/messages` uses standard HTTP REST with Bearer token authentication. `httpx` is already pinned/included in `backend/requirements.txt`, meaning **zero new dependencies** are required.
5. **WhatsApp Registration & Fallback Mechanism**: Meta Cloud API does not support deprecated contact syncing (`/v1/contacts`); attempting delivery via Cloud API returns specific error codes (such as `#131026 Message undeliverable - Receiver is incapable of receiving this message`, `#131000`, or generic 400/404) when a user is not on WhatsApp or unreachable. Any HTTP error, API error, or unexpected exception must automatically trigger fallback to Telnyx SMS.
6. **Requirements & Build Safety**: `backend/requirements.txt` already includes `httpx`, `fastapi`, `pydantic`, `pytest`, `pytest-asyncio`, and `pytest-mock`. `pip install -r requirements.txt` succeeds without broken dependencies.

---

## 2. Codebase Baseline & Existing Inventory

### 2.1 Current SMS Delivery (`backend/app/services/sms.py`)
```python
async def send_payment_sms(to_number: str, from_number: str, payment_url: str, restaurant_name: str) -> None:
    telnyx.api_key = await get_platform_secret("TELNYX_API_KEY")
    message_text = f"Thank you for ordering with {restaurant_name}! Complete your payment here: {payment_url}"
    try:
        telnyx.Message.create(
            to=to_number,
            _from=from_number,
            text=message_text
        )
        log.info("sms.payment_link_sent", to=to_number, url=payment_url)
    except Exception as e:
        log.error("sms.payment_link_failed", error=str(e), to=to_number)
```
**Observations**:
- Synchronous call to `telnyx.Message.create` within an async function.
- Catches all exceptions and logs, but does not re-raise or return a status boolean/object.
- Secret retrieval is dynamic via `await get_platform_secret("TELNYX_API_KEY")`.

### 2.2 Payment Link Creation & Dispatch (`backend/app/api/payments.py`)
```python
@router.post("/create-link/{order_id}")
async def create_payment_link(order_id: str):
    ...
    call = await get_call(order.call_id) if order.call_id else None
    customer_number = call.caller_number if call else "+61400000000"
    ...
    session = stripe.checkout.Session.create(...)
    telnyx_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
    # Send SMS via Telnyx
    await send_payment_sms(
        to_number=customer_number,
        from_number=telnyx_number,
        payment_url=session.url,
        restaurant_name="Our Restaurant"
    )
    return {"payment_url": session.url, "order_id": order_id}
```
**Observations**:
- `customer_number` defaults to `+61400000000` if not present on call.
- Directly calls `send_payment_sms`.
- `from_number` comes from `TELNYX_PHONE_NUMBER` platform secret or `+61411111111`.

### 2.3 Secret Management (`backend/app/services/secrets.py`)
```python
async def get_platform_secret(secret_name: str) -> str:
    client = get_supabase()
    response = client.table("platform_secrets").select("secret_value").eq("secret_name", secret_name).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]["secret_value"]
    return os.getenv(secret_name.upper(), "")
```
**Observations**:
- Looks up keys in Supabase `platform_secrets` table, falling back to `os.getenv(...)`.
- We can add `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_API_VERSION` using the exact same mechanism.

---

## 3. Australian Mobile Number Normalization & Validation

### 3.1 Australian Mobile Number Structure
- **Country Code**: `+61`
- **Mobile Prefix**: `4` (Australian mobile numbers always start with 4)
- **Subscriber Number**: 8 digits after the mobile prefix (Total 9 digits after country code `+61 4XX XXX XXX`).
- **Domestic Representation**: `04XX XXX XXX` (10 digits starting with `04`).
- **International Representation**: `+614XXXXXXXX` (E.164, 12 characters including `+`).
- **Meta WhatsApp Format**: `614XXXXXXXX` (digits only, no `+`, no spaces, 11 digits).

### 3.2 Normalization Logic
```python
import re
from typing import NamedTuple

class NormalizedPhone(NamedTuple):
    raw: str
    is_valid: bool
    is_au_mobile: bool
    e164: str          # e.g. "+61412345678" (for Telnyx)
    whatsapp_id: str   # e.g. "61412345678" (for Meta WhatsApp Cloud API)

def normalize_phone_number(raw_number: str) -> NormalizedPhone:
    if not raw_number:
        return NormalizedPhone(raw="", is_valid=False, is_au_mobile=False, e164="", whatsapp_id="")
    
    # Strip spaces, hyphens, brackets, dots
    cleaned = re.sub(r"[\s\-\(\)\.]", "", raw_number)
    
    # Check Australian mobile formats
    # 1. Domestic: 04XXXXXXXX (10 digits)
    if re.match(r"^04\d{8}$", cleaned):
        digits = "61" + cleaned[1:]
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=True, e164="+" + digits, whatsapp_id=digits)
    
    # 2. International with leading plus: +614XXXXXXXX
    if re.match(r"^\+614\d{8}$", cleaned):
        digits = cleaned[1:]
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=True, e164=cleaned, whatsapp_id=digits)
    
    # 3. International digits only: 614XXXXXXXX (11 digits)
    if re.match(r"^614\d{8}$", cleaned):
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=True, e164="+" + cleaned, whatsapp_id=cleaned)
    
    # Other valid E.164 numbers (non-AU or AU landline)
    if cleaned.startswith("+") and cleaned[1:].isdigit() and len(cleaned) >= 8:
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=False, e164=cleaned, whatsapp_id=cleaned[1:])
    elif cleaned.isdigit() and len(cleaned) >= 8:
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=False, e164="+" + cleaned, whatsapp_id=cleaned)
    
    return NormalizedPhone(raw=raw_number, is_valid=False, is_au_mobile=False, e164=cleaned, whatsapp_id=cleaned)
```

---

## 4. Meta WhatsApp Business Cloud API Integration Architecture

### 4.1 Official Cloud API Endpoint
- **URL Pattern**: `https://graph.facebook.com/{api_version}/{phone_number_id}/messages`
- **Recommended API Version**: `v18.0` (or `v20.0` / `v21.0`), defaulting to `v18.0` with override support via `WHATSAPP_API_VERSION`.
- **Headers**:
  ```http
  Authorization: Bearer <WHATSAPP_ACCESS_TOKEN>
  Content-Type: application/json
  ```

### 4.2 Message Payloads
Meta WhatsApp Cloud API supports text messages and pre-approved template messages.

#### 1. Direct Text Message Payload:
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "61412345678",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Thank you for ordering with Our Restaurant! Complete your payment here: https://talkbyte.com/success"
  }
}
```

#### 2. Template Message Payload (Utility/Marketing Template):
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "61412345678",
  "type": "template",
  "template": {
    "name": "payment_link",
    "language": {
      "code": "en_AU"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {"type": "text", "text": "Our Restaurant"},
          {"type": "text", "text": "https://talkbyte.com/success"}
        ]
      }
    ]
  }
}
```

### 4.3 WhatsApp Registration Detection & Error Handling
On Meta's Cloud API:
1. When a message is sent to a recipient that is **not registered on WhatsApp** or cannot receive messages:
   - Meta returns an HTTP 400 error with JSON:
     ```json
     {
       "error": {
         "message": "(#131026) Message undeliverable",
         "type": "OAuthException",
         "code": 131026,
         "error_data": {
           "messaging_product": "whatsapp",
           "details": "Receiver is incapable of receiving this message"
         },
         "error_subcode": 2494010,
         "fbtrace_id": "..."
       }
     }
     ```
   - Other known error codes:
     - `131026`: Receiver incapable of receiving message (not on WhatsApp or privacy restricted)
     - `131000`: Something went wrong / delivery failure
     - `131051`: Unsupported message type
     - `100`: Invalid parameter / Phone number not found
2. When the phone number is NOT on WhatsApp or Meta returns any error (4xx, 5xx):
   - The WhatsApp service raises an exception or flags failure.
3. When any network error, timeout (`httpx.TimeoutException`), connection error, or HTTP error occurs:
   - The code catches the exception and immediately invokes the Telnyx SMS fallback.

---

## 5. Telnyx SMS Fallback Architecture & Resilience

The fallback mechanism works as a resilient two-tier messaging pipeline:

```
                  [Customer Phone Number]
                             │
                             ▼
               [AU Mobile & WhatsApp Check]
                             │
              ┌──────────────┴──────────────┐
     Eligible AU Mobile             Not AU Mobile / Plain SMS
              │                             │
              ▼                             │
    [Try Meta WhatsApp API]                 │
              │                             │
       ┌──────┴──────┐                      │
    Success       Failure                   │
       │        (HTTP 4xx/5xx,              │
       │       Error 131026,                │
       │        Exception)                  │
       │             │                      │
       ▼             └──────────────┐       │
  [WhatsApp                         ▼       ▼
  Delivered]              [Telnyx SMS Delivery]
                                    │
                             ┌──────┴──────┐
                          Success       Failure
                             │             │
                             ▼             ▼
                       [SMS Sent]   [Log & Raise]
```

### Key Resilience Rules:
1. **Never drop a payment link**: If WhatsApp fails for ANY reason (number not registered, invalid credentials, rate limit, network timeout, outage), Telnyx SMS is called immediately.
2. **Synchronous or Async Telnyx Call**: In `app/services/sms.py`, `telnyx.Message.create` is currently synchronous. We wrap it or execute via `asyncio.to_thread` to avoid blocking FastAPI's event loop.
3. **Structured Logging**: Every attempt logs clear event tags:
   - `whatsapp.attempt`: recipient, url
   - `whatsapp.sent`: message_id, recipient
   - `whatsapp.failed`: error, code, falling_back=True
   - `sms.fallback_triggered`: reason, recipient
   - `sms.payment_link_sent`: recipient, url

---

## 6. Internal Messaging Endpoint Design

### 6.1 Route Definition
- **Endpoint**: `POST /api/messages/send` (and/or `POST /api/messaging/send`)
- **Router Prefix**: Included in `main.py` under `app.include_router(messages.router, prefix="/api/messages", tags=["messages"])`

### 6.2 Pydantic Models
```python
from pydantic import BaseModel, Field

class SendMessageRequest(BaseModel):
    to_number: str = Field(..., description="Recipient phone number (e.g. +61412345678 or 0412345678)")
    payment_url: str = Field(..., description="Stripe payment link URL")
    restaurant_name: str = Field(default="Our Restaurant", description="Name of the restaurant")
    from_number: str | None = Field(default=None, description="Sender number for SMS fallback (defaults to platform secret)")

class SendMessageResponse(BaseModel):
    success: bool
    channel: str  # "whatsapp" | "sms"
    to_number: str
    message_id: str | None = None
    fallback_used: bool = False
    details: str | None = None
```

### 6.3 Routing Logic inside Endpoint
```python
@router.post("/send", response_model=SendMessageResponse)
async def send_message(req: SendMessageRequest):
    result = await send_payment_message(
        to_number=req.to_number,
        payment_url=req.payment_url,
        restaurant_name=req.restaurant_name,
        from_number=req.from_number,
    )
    return result
```

---

## 7. Integration with Voice Ordering Flow

In `backend/app/api/payments.py:create_payment_link`:
```python
# Replace direct send_payment_sms with unified send_payment_message
result = await send_payment_message(
    to_number=customer_number,
    from_number=telnyx_number,
    payment_url=session.url,
    restaurant_name="Our Restaurant"
)
```
This guarantees that:
- Direct POSTs to `/api/messages/send` route to WhatsApp with SMS fallback.
- AI voice orders that generate payment links via `/api/payments/create-link/{order_id}` also route to WhatsApp with SMS fallback.

---

## 8. Dependencies & Environment Verification

### 8.1 Requirements Check
`backend/requirements.txt` was inspected:
- Line 10 contains `httpx`.
- Line 50 contains `requests==2.31.0`.
- Line 34 contains `telnyx`.
- Line 46 contains `pydantic==2.10.4`.
- Line 54-57 contains `pytest==8.3.4`, `pytest-asyncio==0.25.0`, `pytest-cov==4.1.0`, `pytest-mock==3.12.0`.

**Conclusion**: No new dependencies or pins are required. Using `httpx` for Meta Graph API calls keeps the dependency footprint 100% compliant with existing requirements, guaranteeing `pip install -r requirements.txt` succeeds with exit code 0.

### 8.2 Environment Variables / Secrets
The following secrets can be set in Supabase `platform_secrets` table or `.env` / `.env.local`:
- `WHATSAPP_ACCESS_TOKEN`: Meta Graph API System User Token
- `WHATSAPP_PHONE_NUMBER_ID`: Meta WhatsApp Business Phone Number ID
- `WHATSAPP_API_VERSION`: Optional, defaults to `"v18.0"`
- `TELNYX_API_KEY`: Existing Telnyx API Key
- `TELNYX_PHONE_NUMBER`: Existing Telnyx Phone Number (defaults to `+61411111111`)

---

## 9. Comprehensive Testing & Mocking Strategy

### 9.1 Test File Structure
Create `backend/tests/unit/test_messaging.py` covering:

1. **Phone Normalization Tests**:
   - `test_normalize_domestic_au_mobile`: `0412 345 678` -> `61412345678` & `+61412345678`.
   - `test_normalize_international_au_mobile`: `+61412345678` -> `61412345678` & `+61412345678`.
   - `test_normalize_non_au_number`: `+14155552671` -> flagged `is_au_mobile=False`.
   - `test_normalize_invalid_number`: `abc`, `""`, `123` -> flagged `is_valid=False`.

2. **WhatsApp Delivery (Happy Path)**:
   - Mock `httpx.AsyncClient.post` returning HTTP 200 with `{"messages": [{"id": "wamid.HBgL..."}]}`.
   - Verify Meta API URL: `https://graph.facebook.com/v18.0/{phone_number_id}/messages`.
   - Verify headers: `Authorization: Bearer test_token`, `Content-Type: application/json`.
   - Verify payload: `messaging_product="whatsapp"`, `to="61412345678"`, `text.body` contains restaurant name and payment URL.
   - Verify Telnyx `Message.create` is NOT called.
   - Verify returned channel is `"whatsapp"`, `fallback_used=False`.

3. **WhatsApp Delivery Error Code 131026 (Not on WhatsApp) -> Fallback to Telnyx SMS**:
   - Mock `httpx.AsyncClient.post` returning HTTP 400 with `{"error": {"code": 131026, "message": "Receiver is incapable of receiving this message"}}`.
   - Mock Telnyx `Message.create`.
   - Verify code catches error, logs warning, and executes Telnyx SMS.
   - Verify returned channel is `"sms"`, `fallback_used=True`.

4. **WhatsApp Delivery Network/Timeout Exception -> Fallback to Telnyx SMS**:
   - Mock `httpx.AsyncClient.post` raising `httpx.ConnectTimeout` or `httpx.HTTPError`.
   - Mock Telnyx `Message.create`.
   - Verify Telnyx SMS fallback is executed.
   - Verify returned channel is `"sms"`, `fallback_used=True`.

5. **Internal Messaging API Endpoint (`POST /api/messages/send`)**:
   - Use FastAPI `TestClient`:
     - POST valid AU mobile number: routes to WhatsApp.
     - When WhatsApp raises exception: falls back to Telnyx SMS with HTTP 200 and `fallback_used: true`.
     - When invalid payload sent: returns HTTP 422 Unprocessable Entity.

---

## 10. Summary & Handoff Readiness
All components of Requirement R1 have been surveyed, verified against existing code, and fully specified. Downstream implementation requires:
1. Creating `backend/app/services/whatsapp.py` (Meta Cloud API client and phone normalization).
2. Creating `backend/app/services/messaging.py` (unified dispatch layer orchestrating WhatsApp + Telnyx fallback).
3. Creating `backend/app/api/messages.py` (internal messaging endpoint router) and mounting it in `backend/main.py`.
4. Updating `backend/app/api/payments.py:create_payment_link` to use `send_payment_message`.
5. Creating `backend/tests/unit/test_messaging.py` with comprehensive mocks.
