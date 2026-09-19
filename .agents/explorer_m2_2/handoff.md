# Handoff Report: Explorer M2-2 (FastAPI Routing & Payments Integration)

## 1. Observation
1. **`backend/app/api/` Directory Inventory**:
   - Files present: `admin.py`, `billing.py`, `orders.py`, `payments.py`, `restaurants.py`, `voice.py`.
   - `backend/app/api/messages.py` does NOT exist.
   - `backend/app/api/__init__.py` does NOT exist; routers are imported directly from `app.api`.
2. **`backend/main.py` (lines 15, 48–55)**:
   - Line 15:
     ```python
     from app.api import voice, orders, restaurants, payments, admin, billing
     ```
   - Lines 48–55:
     ```python
     # Routers
     app.include_router(voice.router,       prefix="/api/voice",       tags=["voice"])
     app.include_router(orders.router,      prefix="/api/orders",      tags=["orders"])
     app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
     app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
     app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])
     app.include_router(billing.router,     prefix="/api/billing",     tags=["billing"])
     ```
   - All entity routers use pluralized REST prefixes (`/api/orders`, `/api/restaurants`, `/api/payments`).
   - No route exists for `/api/messages` or `/api/messaging`.
3. **`backend/app/api/payments.py` (lines 8, 45–87)**:
   - Line 8:
     ```python
     from app.services.sms import send_payment_sms
     ```
   - Lines 52–53:
     ```python
     call = await get_call(order.call_id) if order.call_id else None
     customer_number = call.caller_number if call else "+61400000000"
     ```
   - Lines 73–80:
     ```python
     telnyx_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
     # Send SMS via Telnyx
     await send_payment_sms(
         to_number=customer_number,
         from_number=telnyx_number,
         payment_url=session.url,
         restaurant_name="Our Restaurant"
     )
     ```
   - Line 82:
     ```python
     return {"payment_url": session.url, "order_id": order_id}
     ```
   - `restaurant_name` is hardcoded to `"Our Restaurant"`, despite `order.restaurant_id` being available.
4. **Service & Test Suite Interfaces**:
   - `explorer_m2_1` (`.agents/explorer_m2_1/analysis.md`): Defined `app.services.messaging.send_payment_message(to_number, payment_url, restaurant_name, from_number) -> MessageResult`.
   - `explorer_m2_3` (`.agents/explorer_m2_3/proposed_test_messaging.py` lines 385–525): Defined unit test fixtures expecting:
     - `POST /api/messages/send` with payload `{"to_number": "...", "payment_url": "...", "restaurant_name": "..."}`.
     - Response schema with `success: bool`, `channel: str`, `to_number: str`, `fallback_used: bool`.
     - `payments.create_payment_link` invoking `send_payment_message` with `to_number` and `payment_url`.

## 2. Logic Chain
1. **From Observation 1 & 4**: Because Requirement R1 and acceptance criteria require an internal messaging endpoint (`POST /api/messages/send`), creating `backend/app/api/messages.py` provides this gateway. Defining Pydantic models `SendMessageRequest` (with validation for `to_number` and `payment_url`) and `SendMessageResponse` (exposing `channel`, `fallback_used`, `message_id`, `details`) guarantees contract compliance and schema documentation in OpenAPI.
2. **From Observation 2**: Because `backend/main.py` uniformly uses pluralized prefixes, mounting `messages.router` under `prefix="/api/messages"` adheres to the codebase standard. Additionally mounting `/api/messaging` as an alias guarantees that callers using either singular or plural conventions will succeed without 404s.
3. **From Observation 3 & 4**: Because `payments.py` currently invokes the legacy `send_payment_sms` function, updating it to invoke `send_payment_message` from `app.services.messaging` completes the integration between the voice ordering payment link generator and the multi-channel WhatsApp/Telnyx messaging dispatcher. Adding dynamic restaurant lookup via `get_restaurant_by_id(order.restaurant_id)` personalizes the message while safely defaulting to `"Our Restaurant"`.

## 3. Caveats
- `backend/app/services/messaging.py` must be created by the worker agent implementing M2 before `backend/app/api/messages.py` and `backend/app/api/payments.py` can execute in production. However, tests mock `send_payment_message` so unit tests can run independently.
- When both WhatsApp delivery and Telnyx SMS fallback fail (e.g. invalid phone number, dual provider outage), `messages.py` raises `HTTPException(status_code=500, detail=...)`.
- No caveats regarding existing tests: `payments.py` and `main.py` updates preserve all existing response structures, so no existing tests in `backend/tests/` will be broken.

## 4. Conclusion
1. **Create `backend/app/api/messages.py`**:
   - Primary endpoint: `@router.post("/send", response_model=SendMessageResponse)`
   - Secondary aliases: `@router.post("")` and `@router.get("/health")`
   - Models: `SendMessageRequest` and `SendMessageResponse`
   - Behavior: Calls `send_payment_message`, returns HTTP 200 with delivery channel metadata (`whatsapp` vs `sms`, `fallback_used`), returns HTTP 422 on bad payload, raises HTTP 500 on total delivery failure.
2. **Mount in `backend/main.py`**:
   - Line 15: Add `messages` to `from app.api import ...`
   - Line 55: Add `app.include_router(messages.router, prefix="/api/messages", tags=["messages"])`
   - Line 56: Add `app.include_router(messages.router, prefix="/api/messaging", tags=["messages"], include_in_schema=False)`
3. **Update `backend/app/api/payments.py`**:
   - Import `send_payment_message` from `app.services.messaging` and `get_restaurant_by_id` from `app.db.supabase`.
   - In `create_payment_link`: resolve `restaurant_name` dynamically from `order.restaurant_id`, invoke `send_payment_message(to_number=..., from_number=..., payment_url=..., restaurant_name=...)`, and log dispatch telemetry.

## 5. Verification Method
1. **Static Code Inspection**:
   - Verify `backend/app/api/messages.py` contains `router`, `SendMessageRequest`, `SendMessageResponse`, and `send_message_endpoint`.
   - Verify `backend/main.py` mounts `messages.router` under `/api/messages`.
   - Verify `backend/app/api/payments.py` imports `send_payment_message` and calls it inside `create_payment_link`.
2. **Automated Unit Tests**:
   - Run: `pytest backend/tests/unit/test_whatsapp.py -v` (verifies existing WhatsApp unit tests remain green).
   - Run: `pytest backend/tests/unit/test_messaging.py -v` (runs new 18-test suite covering phone normalization, WhatsApp delivery, fallback, `POST /api/messages/send`, and `payments.create_payment_link`).
3. **Interactive / TestClient Verification**:
   - Using FastAPI `TestClient(app)`:
     - `POST /api/messages/send` with `{"to_number": "0412345678", "payment_url": "https://pay.stripe.com/test", "restaurant_name": "Test"}` returns HTTP 200.
     - `POST /api/messages/send` with `{"restaurant_name": "Test"}` (missing fields) returns HTTP 422.
     - `POST /api/payments/create-link/{order_id}` invokes `send_payment_message` with `to_number` and `payment_url`.
4. **Invalidation Conditions**:
   - If `POST /api/messages/send` returns HTTP 404, router was not registered in `main.py`.
   - If `payments.py` still invokes `send_payment_sms`, voice orders will not route through the multi-channel WhatsApp dispatcher.
   - If `POST /api/messages/send` crashes with an unhandled exception when WhatsApp delivery fails instead of returning channel `sms` with `fallback_used: true`, exception safety is broken.
