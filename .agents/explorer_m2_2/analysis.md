# API Routing & Payments Messaging Integration Analysis (Milestone M2-2)

**Author**: `explorer_m2_2`  
**Date**: 2026-09-14  
**Scope**: `backend/app/api/messages.py`, `backend/main.py`, `backend/app/api/payments.py`  
**Related Requirements**: Requirement R1 (WhatsApp Business API Integration & SMS Fallback), Milestone M2  
**Parent Conversation ID**: `b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`  

---

## 1. Executive Summary & Objective Alignment

Requirement R1 of the TalkByte specification requires:
> *"After a restaurant customer completes an AI voice order, the system currently sends a Stripe Payment Link via Telnyx SMS. Extend the messaging layer so that if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API."*

Acceptance Criteria specifies:
> 1. *"A POST to the backend's internal messaging endpoint with an AU mobile number routes to WhatsApp delivery logic (verifiable by inspecting the code path and the Meta API call)."*
> 2. *"If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration."*

This investigation examines the API routing, router mounting, and payment link creation layer:
1. **`backend/app/api/messages.py`**: Design and specification of the internal messaging API endpoint `POST /api/messages/send` (request body, response schema, validation, error handling, and invocation of `app.services.messaging.send_payment_message`).
2. **`backend/main.py`**: Analysis of existing router inclusions, convention consistency, and mounting configuration for `messages.router`.
3. **`backend/app/api/payments.py`**: Inspection of `create_payment_link`, replacing the hardcoded legacy Telnyx SMS call with the unified messaging dispatcher `send_payment_message`, adding dynamic restaurant lookup, and preserving response contracts.
4. **Coordination**: Verified contract consistency with `explorer_m2_1` (services layer: `whatsapp.py`, `sms.py`, `messaging.py`) and `explorer_m2_3` (test suite: `test_messaging.py`).

---

## 2. Investigation of `backend/app/api/messages.py` (New Module)

### 2.1 Current State & Baseline
- The file `backend/app/api/messages.py` does not currently exist.
- There are no routes matching `/api/messages` or `/api/messaging` registered in FastAPI.
- Existing API modules in `backend/app/api/` (`admin.py`, `billing.py`, `orders.py`, `payments.py`, `restaurants.py`, `voice.py`) follow a consistent pattern:
  - Import `APIRouter` from `fastapi`.
  - Instantiate `router = APIRouter()`.
  - Use Pydantic `BaseModel` for request/response payloads (e.g. `billing.py:CreateCheckoutRequest`).
  - Use `structlog` for structured logging.
  - Return native dicts or Pydantic models with explicit HTTP status codes.

### 2.2 Endpoint Architecture & Design

#### Primary Endpoint: `POST /api/messages/send`
- **Path**: `/api/messages/send`
- **Method**: `POST`
- **Purpose**: Internal messaging gateway used by platform services, voice agents, and background tasks to dispatch customer notifications (specifically Stripe Checkout payment links) across WhatsApp and SMS channels.
- **Request Body**: `SendMessageRequest` (JSON)
- **Response**: `SendMessageResponse` (JSON, HTTP 200 on successful delivery via WhatsApp or Telnyx SMS fallback)
- **Error Response**:
  - `HTTP 422 Unprocessable Entity`: Validation failure (missing required fields, empty recipient, malformed URL).
  - `HTTP 500 Internal Server Error`: Both WhatsApp delivery and Telnyx SMS fallback failed, or unhandled internal exception.

#### Auxiliary Endpoints:
1. **`POST /api/messages` (Root Alias)**:
   - Identical handler to `/send`, mounted at root path `""` so callers querying either `POST /api/messages/send` or `POST /api/messages` succeed.
2. **`GET /api/messages/health`**:
   - Subsystem liveness probe returning `{"status": "ok", "service": "messages"}` for health audits.

### 2.3 Pydantic Data Contracts

```python
from pydantic import BaseModel, Field, field_validator

class SendMessageRequest(BaseModel):
    """Payload for internal message dispatch."""
    to_number: str = Field(
        ...,
        description="Customer phone number (e.g. '+61412345678', '0412345678', or international format)",
        example="+61412345678",
    )
    payment_url: str = Field(
        ...,
        description="Stripe Checkout URL or payment link to include in the message body",
        example="https://checkout.stripe.com/c/pay/cs_test_123",
    )
    restaurant_name: str = Field(
        default="Our Restaurant",
        description="Display name of the restaurant for the greeting message",
        example="Mario's Italian",
    )
    from_number: str | None = Field(
        default=None,
        description="Optional sender phone number for SMS fallback. If omitted, resolved from TELNYX_PHONE_NUMBER secret",
    )
    order_id: str | None = Field(
        default=None,
        description="Optional TalkByte order ID for audit and telemetry correlation",
    )

    @field_validator("to_number")
    @classmethod
    def validate_to_number(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError("to_number must not be empty")
        return cleaned

    @field_validator("payment_url")
    @classmethod
    def validate_payment_url(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError("payment_url must not be empty")
        return cleaned


class SendMessageResponse(BaseModel):
    """Unified response detailing message dispatch channel and delivery status."""
    success: bool = Field(
        ...,
        description="True if message was accepted by either WhatsApp or Telnyx SMS fallback",
    )
    channel: str = Field(
        ...,
        description="Delivery channel used: 'whatsapp' or 'sms'",
        example="whatsapp",
    )
    to_number: str = Field(
        ...,
        description="Normalized recipient phone number",
        example="+61412345678",
    )
    message_id: str | None = Field(
        default=None,
        description="Provider-specific message identifier (Meta wamid or Telnyx message ID)",
    )
    fallback_used: bool = Field(
        default=False,
        description="True if WhatsApp delivery was attempted, failed, and fell back to SMS",
    )
    details: str | None = Field(
        default=None,
        description="Descriptive status narrative or provider error notes",
    )
```

### 2.4 Complete Proposed Implementation for `backend/app/api/messages.py`

```python
"""
Internal messaging endpoints — Sprint 2 / Milestone M2.

Exposes internal APIs for multi-channel notification dispatch
(Meta WhatsApp Business Cloud API with automatic Telnyx SMS fallback).
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.services.messaging import send_payment_message

log = structlog.get_logger()
router = APIRouter()


# ── Request / Response Models ────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    """Payload for internal message dispatch."""
    to_number: str = Field(
        ...,
        description="Customer phone number (e.g. '+61412345678' or '0412345678')",
    )
    payment_url: str = Field(
        ...,
        description="Stripe Checkout URL to send to the customer",
    )
    restaurant_name: str = Field(
        default="Our Restaurant",
        description="Display name of the restaurant",
    )
    from_number: str | None = Field(
        default=None,
        description="Optional sender number for SMS fallback path",
    )
    order_id: str | None = Field(
        default=None,
        description="Optional order ID for tracking / telemetry",
    )

    @field_validator("to_number")
    @classmethod
    def validate_to_number(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError("to_number must not be empty")
        return cleaned

    @field_validator("payment_url")
    @classmethod
    def validate_payment_url(cls, v: str) -> str:
        cleaned = v.strip() if v else ""
        if not cleaned:
            raise ValueError("payment_url must not be empty")
        return cleaned


class SendMessageResponse(BaseModel):
    """Response detailing delivery channel and status."""
    success: bool
    channel: str  # "whatsapp" | "sms"
    to_number: str
    message_id: str | None = None
    fallback_used: bool = False
    details: str | None = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/send", response_model=SendMessageResponse, status_code=status.HTTP_200_OK)
@router.post("", response_model=SendMessageResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
async def send_message_endpoint(req: SendMessageRequest) -> SendMessageResponse:
    """
    Send an order payment link to a customer.

    - Routes Australian mobile numbers (+614xxxxxxxx or 04xxxxxxxx) to WhatsApp first.
    - If WhatsApp delivery fails for ANY reason (not registered, API error, exception),
      automatically falls back to plain SMS via Telnyx.
    - Non-AU numbers bypass WhatsApp and deliver directly via SMS.
    """
    log.info(
        "messages.api_send_requested",
        to=req.to_number,
        restaurant_name=req.restaurant_name,
        order_id=req.order_id,
    )

    try:
        result = await send_payment_message(
            to_number=req.to_number,
            payment_url=req.payment_url,
            restaurant_name=req.restaurant_name,
            from_number=req.from_number,
        )

        # Handle polymorphism (MessageResult dataclass, SendMessageResponse, or dict)
        success = getattr(result, "success", None)
        if success is None and isinstance(result, dict):
            success = result.get("success", False)

        channel = getattr(result, "channel", "sms") if hasattr(result, "channel") else (result.get("channel", "sms") if isinstance(result, dict) else "sms")
        to_number = getattr(result, "to_number", req.to_number) if hasattr(result, "to_number") else (result.get("to_number", req.to_number) if isinstance(result, dict) else req.to_number)
        message_id = getattr(result, "message_id", None) if hasattr(result, "message_id") else (result.get("message_id") if isinstance(result, dict) else None)
        fallback_used = getattr(result, "fallback_used", False) if hasattr(result, "fallback_used") else (result.get("fallback_used", False) if isinstance(result, dict) else False)
        details = getattr(result, "details", None) if hasattr(result, "details") else (result.get("details") if isinstance(result, dict) else None)

        if not success:
            log.error(
                "messages.delivery_failed_both_channels",
                to=req.to_number,
                details=details,
            )
            # Both WhatsApp and SMS failed
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Message delivery failed on all channels: {details or 'Unknown error'}",
            )

        log.info(
            "messages.api_send_completed",
            to=to_number,
            channel=channel,
            fallback_used=fallback_used,
            message_id=message_id,
        )

        return SendMessageResponse(
            success=True,
            channel=channel,
            to_number=to_number,
            message_id=message_id,
            fallback_used=fallback_used,
            details=details,
        )

    except HTTPException:
        raise
    except Exception as exc:
        log.error("messages.api_unexpected_exception", error=str(exc), to=req.to_number)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal messaging error: {exc}",
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def messages_health():
    """Health check endpoint for internal messaging subsystem."""
    return {"status": "ok", "service": "messages"}
```

---

## 3. Investigation of `backend/main.py` (Router Mounting)

### 3.1 Existing Router Structure
Inspecting `backend/main.py`:
- **Line 15**:
  ```python
  from app.api import voice, orders, restaurants, payments, admin, billing
  ```
- **Lines 48–55**:
  ```python
  # Routers
  app.include_router(voice.router,       prefix="/api/voice",       tags=["voice"])
  app.include_router(orders.router,      prefix="/api/orders",      tags=["orders"])
  app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
  app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
  app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])
  app.include_router(billing.router,     prefix="/api/billing",     tags=["billing"])
  ```

### 3.2 Conventions & Route Prefix Analysis
1. **Pluralized Resource Prefixes**:
   All entity routes follow the pluralized REST convention (`/api/orders`, `/api/restaurants`, `/api/payments`). Therefore, `/api/messages` is the exact canonical route prefix conforming with the existing architecture.
2. **Singular/Plural Client Safety**:
   Some internal clients or scripts might query `/api/messaging/send` while others query `/api/messages/send`. Mounting `messages.router` under `/api/messages` as primary and `/api/messaging` as an alias guarantees 100% interoperability without breaking any caller.

### 3.3 Diff / Code Changes for `backend/main.py`

```diff
--- backend/main.py
+++ backend/main.py
@@ -12,5 +12,5 @@
 from app.db.supabase import init_supabase
 from app.db.redis import init_redis
-from app.api import voice, orders, restaurants, payments, admin, billing
+from app.api import voice, orders, restaurants, payments, admin, billing, messages
 
 log = setup_logging(config.debug)
@@ -52,4 +52,6 @@
 app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
 app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])
 app.include_router(billing.router,     prefix="/api/billing",     tags=["billing"])
+app.include_router(messages.router,    prefix="/api/messages",    tags=["messages"])
+app.include_router(messages.router,    prefix="/api/messaging",   tags=["messages"], include_in_schema=False)
 
 
 @app.get("/health")
```

---

## 4. Investigation of `backend/app/api/payments.py` (`create_payment_link`)

### 4.1 Current Implementation State
In `backend/app/api/payments.py`:
- **Line 8**:
  ```python
  from app.services.sms import send_payment_sms
  ```
- **Lines 45–87**:
  ```python
  @router.post("/create-link/{order_id}")
  async def create_payment_link(order_id: str):
      stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
      order = await get_order(order_id)
      if not order:
          raise HTTPException(status_code=404, detail="Order not found")

      call = await get_call(order.call_id) if order.call_id else None
      customer_number = call.caller_number if call else "+61400000000"

      try:
          # Create Stripe Checkout Session
          session = stripe.checkout.Session.create(
              payment_method_types=["card"],
              line_items=[{
                  "price_data": {
                      "currency": "aud",
                      "product_data": {"name": "TalkByte Restaurant Order"},
                      "unit_amount": order.total_cents,
                  },
                  "quantity": 1,
              }],
              mode="payment",
              success_url="https://talkbyte.com/success",
              cancel_url="https://talkbyte.com/cancel",
              client_reference_id=order_id,
          )

          telnyx_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
          # Send SMS via Telnyx
          await send_payment_sms(
              to_number=customer_number,
              from_number=telnyx_number,
              payment_url=session.url,
              restaurant_name="Our Restaurant"
          )

          return {"payment_url": session.url, "order_id": order_id}
      except Exception as e:
          log.error("stripe.create_link.failed", error=str(e))
          raise HTTPException(
              status_code=500, detail="Failed to create payment link")
  ```

### 4.2 Deficiencies in Current Implementation
1. **Direct Coupling to Legacy SMS Function**:
   `payments.py` directly calls `send_payment_sms`. Although `send_payment_sms` in `sms.py` was partially patched with an AU check, the proper architectural separation specified in Milestone M2 requires all outbound messaging to go through the unified `send_payment_message` dispatcher from `app.services.messaging`.
2. **Hardcoded Restaurant Name**:
   Line 79 passes `restaurant_name="Our Restaurant"`. The order object has `order.restaurant_id`. By querying `get_restaurant_by_id(order.restaurant_id)`, the customer receives a branded message (`"Thank you for ordering with Nonna's Pizza! Complete your payment here: ..."`).
3. **No Messaging Outcome Logging**:
   `payments.py` does not log whether the payment link was dispatched via WhatsApp or SMS, making production triage and telemetry difficult.

### 4.3 Proposed Refactoring for `backend/app/api/payments.py`

#### Changes:
1. Update imports:
   - Import `get_restaurant_by_id` from `app.db.supabase`.
   - Import `send_payment_message` from `app.services.messaging`.
2. Retrieve the restaurant display name dynamically:
   ```python
   restaurant_name = "Our Restaurant"
   if order.restaurant_id:
       try:
           restaurant = await get_restaurant_by_id(order.restaurant_id)
           if restaurant and restaurant.name:
               restaurant_name = restaurant.name
       except Exception as exc:
           log.warning("payments.restaurant_lookup_failed", error=str(exc), restaurant_id=order.restaurant_id)
   ```
3. Invoke `send_payment_message`:
   ```python
   msg_result = await send_payment_message(
       to_number=customer_number,
       from_number=telnyx_number,
       payment_url=session.url,
       restaurant_name=restaurant_name,
   )
   ```
4. Log structured telemetry:
   ```python
   log.info(
       "payments.link_dispatched",
       order_id=order_id,
       customer_number=customer_number,
       channel=getattr(msg_result, "channel", "unknown"),
       fallback_used=getattr(msg_result, "fallback_used", False),
   )
   ```
5. Maintain return signature contract:
   Return `{"payment_url": session.url, "order_id": order_id}` (or augmented with channel info), ensuring 100% backward compatibility with existing tests and clients.

### 4.4 Diff for `backend/app/api/payments.py`

```diff
--- backend/app/api/payments.py
+++ backend/app/api/payments.py
@@ -3,9 +3,9 @@
 from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
 import stripe
 from config import config
-from app.db.supabase import get_order, update_order_state, get_call, get_platform_secret
+from app.db.supabase import get_order, update_order_state, get_call, get_platform_secret, get_restaurant_by_id
 from app.models.order import OrderState
-from app.services.sms import send_payment_sms
+from app.services.messaging import send_payment_message
 import structlog
 from app.workers.celery_app import push_order_to_pos
 
@@ -72,13 +72,27 @@
         )
 
         telnyx_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
-        # Send SMS via Telnyx
-        await send_payment_sms(
+
+        # Dynamic restaurant display name lookup
+        restaurant_name = "Our Restaurant"
+        if order.restaurant_id:
+            try:
+                rest_record = await get_restaurant_by_id(order.restaurant_id)
+                if rest_record and rest_record.name:
+                    restaurant_name = rest_record.name
+            except Exception as e:
+                log.warning("payments.restaurant_name_lookup_failed", error=str(e))
+
+        # Send payment link via unified multi-channel messaging (WhatsApp first, Telnyx SMS fallback)
+        msg_result = await send_payment_message(
             to_number=customer_number,
             from_number=telnyx_number,
             payment_url=session.url,
-            restaurant_name="Our Restaurant"
+            restaurant_name=restaurant_name,
         )
+        log.info(
+            "payments.link_dispatched",
+            order_id=order_id,
+            to=customer_number,
+            channel=getattr(msg_result, "channel", "unknown"),
+            fallback_used=getattr(msg_result, "fallback_used", False),
+        )
 
         return {"payment_url": session.url, "order_id": order_id}
```

---

## 5. End-to-End Interaction & Architecture

### 5.1 System Data Flow Diagram

```
                 [Customer Calls Restaurant]
                              │
                              ▼
                   [LiveKit AI Agent Turn]
                              │  (Order confirmed)
                              ▼
                 [POST /api/payments/create-link/{order_id}]
                              │
               ┌──────────────┴──────────────┐
               │                             │
    [Stripe Checkout Session]      [POST /api/messages/send]
    (generates session.url)        (Direct API / webhook test)
               │                             │
               └──────────────┬──────────────┘
                              │
                              ▼
            [app.services.messaging.send_payment_message]
                              │
                     [Phone Normalization]
               (0412345678 -> +61412345678 / 61412345678)
                              │
                     Is Australian Mobile?
                              │
               ┌──────────────┴──────────────┐
              YES                            NO
               │                             │
               ▼                             │
    [app.services.whatsapp]                  │
    send_whatsapp_payment_link               │
               │                             │
        ┌──────┴──────┐                      │
     Success       Failure                   │
    (Meta 200)   (4xx/5xx, #131026,          │
        │         Timeout, Exception)        │
        │             │                      │
        ▼             └──────────────┐       │
   [Channel:                         ▼       ▼
    "whatsapp"              [app.services.sms]
   fallback: false]          send_payment_sms (Telnyx)
                                     │
                              ┌──────┴──────┐
                           Success       Failure
                              │             │
                              ▼             ▼
                         [Channel:      [HTTP 500
                           "sms"         Delivery
                         fallback:      Failed on
                         true/false]    all channels]
```

### 5.2 Contract Alignment Across Team Modules

| Layer | Module | Interface / Symbol | Consumers | Status |
|---|---|---|---|---|
| Service | `app.services.whatsapp` | `normalize_phone`, `is_au_mobile`, `send_whatsapp_payment_link` | `messaging.py`, unit tests | Designed by `explorer_m2_1` |
| Service | `app.services.sms` | `send_payment_sms(..., force_sms=True)` | `messaging.py`, legacy tests | Updated by `explorer_m2_1` |
| Service | `app.services.messaging` | `send_payment_message(...) -> MessageResult` | `messages.py`, `payments.py`, `test_messaging.py` | Designed by `explorer_m2_1` |
| API | `app.api.messages` | `router`, `SendMessageRequest`, `SendMessageResponse` | `main.py`, external clients, `test_messaging.py` | Designed by `explorer_m2_2` (This report) |
| Core App | `backend/main.py` | `app.include_router(messages.router, prefix="/api/messages")` | FastAPI application runtime | Designed by `explorer_m2_2` (This report) |
| API | `app.api.payments` | `create_payment_link(order_id)` invoking `send_payment_message` | Voice checkout pipeline, `test_messaging.py` | Designed by `explorer_m2_2` (This report) |
| Test | `backend/tests/unit/test_messaging.py` | `TestMessagesApiEndpoint`, `TestPaymentLinkIntegration` | Pytest test runner | Designed by `explorer_m2_3` |

---

## 6. Resilience, Error Handling & Edge Cases

1. **WhatsApp Exception Resilience**:
   Acceptance criteria specifies: *"If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration."*
   In our design, even if `send_whatsapp_payment_link` raises an uncaught runtime error (`ConnectionRefusedError`, `httpx.ConnectTimeout`, `KeyError`), the caller in `send_payment_message` intercepts it via `try...except Exception:` and executes `send_payment_sms(..., force_sms=True)`. The API endpoint returns HTTP 200 with `channel: "sms"` and `fallback_used: true`.
2. **Missing Meta Credentials**:
   If `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` is missing from `platform_secrets` or environment variables, `send_whatsapp_payment_link` logs a warning and returns `False`. The dispatcher immediately routes to Telnyx SMS without stalling.
3. **Invalid Request Payloads**:
   If a client submits empty strings or missing fields to `POST /api/messages/send`, FastAPI and Pydantic validation automatically reject the request with HTTP 422 Unprocessable Entity and standard field-level validation errors.
4. **Catastrophic Failure Handling**:
   If both WhatsApp and Telnyx SMS fail (e.g. invalid phone number that cannot receive SMS and is not on WhatsApp, or global Telnyx API outage), the endpoint catches the failure and raises `HTTPException(status_code=500, detail="Message delivery failed on all channels")`, allowing upstream callers to handle retries.

---

## 7. Implementation Checklist for Worker Agents

- [ ] **Step 1**: Create `backend/app/api/messages.py` with `SendMessageRequest`, `SendMessageResponse`, and routes `POST /send`, `POST ""`, and `GET /health`.
- [ ] **Step 2**: Edit `backend/main.py` to import `messages` from `app.api` and register `messages.router` under `/api/messages` and `/api/messaging`.
- [ ] **Step 3**: Edit `backend/app/api/payments.py` to import `send_payment_message` from `app.services.messaging` and `get_restaurant_by_id` from `app.db.supabase`, replace `send_payment_sms` call with `send_payment_message`, and log dispatch telemetry.
- [ ] **Step 4**: Run unit tests: `pytest backend/tests/unit/test_whatsapp.py backend/tests/unit/test_messaging.py -v`.
