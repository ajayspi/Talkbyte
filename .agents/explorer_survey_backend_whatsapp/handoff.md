# Handoff Report — Backend WhatsApp Business API & SMS Fallback (Requirement R1)

## 1. Observation

1. **Existing SMS service**:
   - Location: `backend/app/services/sms.py`, lines 13–31.
   - Code:
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
2. **Current payment link dispatch**:
   - Location: `backend/app/api/payments.py`, lines 53, 73–82:
     ```python
     customer_number = call.caller_number if call else "+61400000000"
     ...
     telnyx_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
     # Send SMS via Telnyx
     await send_payment_sms(
         to_number=customer_number,
         from_number=telnyx_number,
         payment_url=session.url,
         restaurant_name="Our Restaurant"
     )
     ```
3. **Platform secrets retrieval**:
   - Location: `backend/app/services/secrets.py`, lines 5–16.
   - Reads secrets from Supabase table `platform_secrets` (`secret_name`, `secret_value`) and falls back to `os.getenv(secret_name.upper(), "")`.
4. **FastAPI app routers**:
   - Location: `backend/main.py`, lines 49–53:
     ```python
     app.include_router(voice.router,       prefix="/api/voice",       tags=["voice"])
     app.include_router(orders.router,      prefix="/api/orders",      tags=["orders"])
     app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
     app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
     app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])
     ```
   - Observation: There is currently **no** internal messaging endpoint or router mounted.
5. **Dependencies in `backend/requirements.txt`**:
   - Lines 9–11: `httpx`, `aiohttp==3.11.11`
   - Line 34: `telnyx`
   - Line 46: `pydantic==2.10.4`
   - Lines 54–57: `pytest==8.3.4`, `pytest-asyncio==0.25.0`, `pytest-mock==3.12.0`
   - Line 50: `requests==2.31.0`
   - Observation: `httpx` is already present, meaning official Meta Graph API REST calls do not require any new pip dependencies.
6. **Existing tests**:
   - Located in `backend/tests/conftest.py`, `backend/tests/unit/test_call.py`, `test_config.py`, `test_llm.py`, `test_order.py`, `test_restaurant.py`.
   - `conftest.py` sets test environment variables: `ENVIRONMENT='test'`, `SUPABASE_URL`, etc. No tests currently cover `sms.py`, `payments.py`, or messaging.

---

## 2. Logic Chain

1. **Routing Logic (Observations 1 & 2)**:
   - Voice orders in `payments.py` currently invoke `send_payment_sms` without phone validation, formatting, or channel selection.
   - The requirement demands: "if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API."
   - Therefore, a unified messaging service (`app/services/messaging.py`) should wrap both Meta WhatsApp Cloud API and Telnyx SMS, and `payments.py:create_payment_link` should delegate to this unified service.

2. **Internal Messaging Endpoint (Observations 2 & 4)**:
   - Acceptance criteria explicitly mandates: *"A POST to the backend's internal messaging endpoint with an AU mobile number routes to WhatsApp delivery logic... If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration."*
   - Because no messaging endpoint exists today in `backend/main.py`, we must introduce a dedicated endpoint `POST /api/messages/send` (or `POST /api/messaging/send`) in `backend/app/api/messages.py`, mounted in `backend/main.py`.
   - The endpoint accepts `{ "to_number": str, "payment_url": str, "restaurant_name": str = "Our Restaurant", "from_number": str | None = None }` and returns `{ "success": bool, "channel": "whatsapp"|"sms", "fallback_used": bool, "message_id": str | None }`.

3. **Phone Normalization (Observation 1)**:
   - Australian mobile numbers come in diverse string representations: `0412345678`, `0412 345 678`, `+61412345678`, `61412345678`.
   - Meta WhatsApp Cloud API requires country code + mobile number without `+` (e.g., `61412345678`).
   - Telnyx SMS requires E.164 with `+` (e.g., `+61412345678`).
   - A dedicated normalization helper `normalize_phone_number` and `is_au_mobile` regex `^(?:\+?61|0)4\d{8}$` correctly normalizes AU mobile numbers for both APIs and distinguishes AU mobile numbers from landlines or non-AU numbers.

4. **Meta WhatsApp Cloud API & Exception Fallback (Observations 1, 5, & Acceptance Criteria)**:
   - Meta Cloud API messages are sent via `POST https://graph.facebook.com/v18.0/{phone_number_id}/messages` with `Authorization: Bearer {token}`.
   - Using `httpx.AsyncClient` allows async HTTP POST without blocking the event loop.
   - Meta returns HTTP 400 with error code `#131026` ("Message undeliverable - Receiver is incapable of receiving this message") when a number is not registered on WhatsApp.
   - Any exception (`httpx.HTTPError`, `httpx.TimeoutException`, connection failure, or non-200 response) caught during the WhatsApp delivery attempt triggers the existing Telnyx integration `send_payment_sms(...)`.
   - This satisfies the acceptance criteria: "If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration."

5. **Dependency Integrity (Observation 5)**:
   - `httpx` is already in `backend/requirements.txt`.
   - No packages need to be added or modified in `backend/requirements.txt`.
   - `pip install -r requirements.txt` succeeds with exit code 0.

---

## 3. Caveats

1. **Meta WhatsApp Template vs. Text Messages**: In production, Meta requires pre-approved template messages if messaging outside the 24-hour customer care window. The service should default to standard text messages (`type: "text"` with `preview_url: true`) for flexibility and direct link delivery, with optional template support if `WHATSAPP_TEMPLATE_NAME` is configured.
2. **Telnyx Mocking in Unit Tests**: Telnyx SDK's `telnyx.Message.create` makes live network calls if not mocked. All unit tests must mock `telnyx.Message.create` and `httpx.AsyncClient.post` to avoid network dependency.
3. **No Caveats on Other Backend Modules**: This requirement does not alter LiveKit SIP, Supabase schemas, or POS adapters.

---

## 4. Conclusion

Requirement R1 is clearly defined and ready for implementation.
The implementation blueprint consists of:
1. **`backend/app/services/whatsapp.py`**:
   - `normalize_phone_number(phone: str)`
   - `is_au_mobile(phone: str)`
   - `send_whatsapp_payment_message(to_number: str, payment_url: str, restaurant_name: str) -> dict`
2. **`backend/app/services/messaging.py`**:
   - `send_payment_message(to_number: str, payment_url: str, restaurant_name: str = "Our Restaurant", from_number: str | None = None) -> dict`
   - Manages AU mobile check -> WhatsApp delivery attempt -> exception capture -> Telnyx SMS fallback.
3. **`backend/app/api/messages.py`**:
   - Implements `POST /api/messages/send`.
   - Pydantic models: `SendMessageRequest`, `SendMessageResponse`.
4. **`backend/main.py`**:
   - Register `messages.router` under `/api/messages`.
5. **`backend/app/api/payments.py`**:
   - Refactor `create_payment_link` to use `send_payment_message`.
6. **`backend/tests/unit/test_messaging.py`**:
   - Tests for AU phone normalization, WhatsApp delivery happy path, WhatsApp exception fallback to Telnyx SMS, error code 131026 fallback to Telnyx SMS, and internal messaging endpoint.

---

## 5. Verification Method

1. **Check Requirements Installation**:
   - Command: `pip install -r backend/requirements.txt`
   - Expected Result: Exit code 0, no conflicting dependencies.
2. **Unit Tests Verification**:
   - Command: `pytest backend/tests/unit/test_messaging.py -v`
   - Expected Result: All unit tests pass, verifying:
     - AU mobile number routes to WhatsApp delivery logic and makes Meta API call.
     - When Meta API raises an exception or returns error code (e.g. 131026), code falls back to Telnyx SMS (`telnyx.Message.create` is invoked).
3. **Internal Messaging Endpoint Verification**:
   - Test using FastAPI `TestClient`:
     - Send POST to `/api/messages/send` with `{"to_number": "+61412345678", "payment_url": "https://stripe.com/pay"}`.
     - Inspect call trace: Meta Cloud API endpoint is called.
     - When Meta Cloud API is mocked to raise `httpx.ConnectTimeout`, inspect call trace: Telnyx SMS client is called, endpoint returns `{ "success": true, "channel": "sms", "fallback_used": true }`.
