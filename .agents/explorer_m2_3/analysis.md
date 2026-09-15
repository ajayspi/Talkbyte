# Backend Testing Setup & Messaging Unit Test Suite Analysis (M2-3)

**Author**: `explorer_m2_3`  
**Date**: 2026-09-14  
**Target Milestone**: Milestone 2 — WhatsApp Business API Integration & SMS Fallback (Requirement R1)  
**Target Test Suite**: `backend/tests/unit/test_messaging.py`  
**Working Directory**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m2_3`  

---

## 1. Executive Summary

This investigation analyzes the backend testing setup in `backend/` and designs a comprehensive, production-ready unit test suite in `backend/tests/unit/test_messaging.py` satisfying Requirement R1 from `ORIGINAL_REQUEST.md` and Milestone M2 from `PROJECT.md`:
> *"After a restaurant customer completes an AI voice order, the system currently sends a Stripe Payment Link via Telnyx SMS. Extend the messaging layer so that if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API."*

### Key Discoveries & Findings:
1. **Existing Test Framework**: The backend uses `pytest 8.3.4` configured in `backend/pytest.ini` with `pytest-asyncio 0.25.0` and `pytest-mock 3.12.0`. All test dependencies (`pytest`, `httpx`, `fastapi`, `pydantic`, `structlog`, `telnyx`) are already present in `backend/requirements.txt`.
2. **Current Test Fixtures (`backend/tests/conftest.py`)**: Environment variables are mocked for test execution (`ENVIRONMENT='test'`, Supabase dummy URLs/keys, Upstash dummy credentials). Existing fixtures mock Supabase (`mock_supabase`), Redis (`mock_redis`), and placeholders for Deepgram/OpenAI.
3. **Existing WhatsApp Test File (`backend/tests/unit/test_whatsapp.py`)**: A preliminary test file exists, but it has critical limitations:
   - Does NOT test Australian domestic phone formats like `0412345678`, `(04) 1234 5678`, or `61412345678` (only tests numbers with leading `+614`).
   - Does NOT test Meta API specific error code `#131026` ("Receiver is incapable of receiving this message").
   - Does NOT test the internal FastAPI endpoint `POST /api/messages/send`.
   - Does NOT test FastAPI `TestClient` request validation and status codes.
   - Does NOT test payment link dispatch from `create_payment_link`.
4. **Missing Production Modules**:
   - `backend/app/services/messaging.py`: Not yet implemented (needed for unified dispatch, channel tracking, and fallback reporting).
   - `backend/app/api/messages.py`: Not yet implemented (needed for `POST /api/messages/send`).
   - `backend/main.py`: `messages.router` is not yet registered.
5. **Full Test Design Delivered**: We have authored a complete, standalone test suite in `.agents/explorer_m2_3/proposed_test_messaging.py` covering all 5 core modules across 22 test cases with strict mocking and assertions.

---

## 2. Codebase Baseline & Test Environment Investigation

### 2.1 Pytest Configuration (`backend/pytest.ini`)
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v
```
- **Execution pattern**: Discovers all files named `test_*.py` under `tests/`. Both `tests/unit/test_whatsapp.py` and our designed `tests/unit/test_messaging.py` are automatically picked up by running `pytest` in `backend/`.
- **Async Support**: `pytest-asyncio` is installed (`0.25.0`). Tests use the standard `@pytest.mark.asyncio` decorator for coroutine execution.

### 2.2 Existing Fixtures in `backend/tests/conftest.py`
```python
import pytest
from unittest.mock import Mock, patch
import os

# Set test environment
os.environ['ENVIRONMENT'] = 'test'
os.environ['SUPABASE_URL'] = 'http://localhost:54321'
os.environ['SUPABASE_ANON_KEY'] = 'test-anon-key'
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key'
os.environ['UPSTASH_REDIS_REST_URL'] = 'https://test.upstash.io'
os.environ['UPSTASH_REDIS_REST_TOKEN'] = 'test-token'

@pytest.fixture
def mock_supabase():
    with patch('app.db.supabase.get_db') as mock:
        yield mock

@pytest.fixture
def mock_redis():
    with patch('app.db.redis.get_redis') as mock:
        yield mock
```
**Observations**:
- Root environment variables are set immediately at import time, preventing unintended live Supabase connections.
- Mocking convention in this repository favors `unittest.mock` (`patch`, `AsyncMock`, `MagicMock`).

### 2.3 Existing Test Inventory in `backend/tests/unit/`
| File | Size | Focus Area | Mocking Style |
|---|---|---|---|
| `test_order.py` | 6.7 KB | Order items, cents calculations, formatting | Pure unit tests, no mocks needed |
| `test_restaurant.py` | 4.6 KB | Restaurant & MenuItem models, prompt formatting | Pure unit tests |
| `test_call.py` | 4.9 KB | Call state machine, Redis serialization | Model & state machine tests |
| `test_config.py` | 0.9 KB | Env var loading, default fallbacks | `monkeypatch` |
| `test_llm.py` | 4.0 KB | LLM prompt rendering and function calling | Mocking OpenAI |
| `test_whatsapp.py` | 8.8 KB | `is_au_mobile`, `send_whatsapp_payment_link`, `send_payment_sms` | `patch`, `AsyncMock`, `MagicMock` |

---

## 3. Gap Analysis: Current State vs. Requirement R1

### Gap 1: Phone Normalization Defect
In `backend/app/services/whatsapp.py`:
```python
_AU_MOBILE_RE = re.compile(r"^\+614\d{8}$")

def is_au_mobile(phone_number: str) -> bool:
    normalised = phone_number.replace(" ", "").replace("-", "")
    return bool(_AU_MOBILE_RE.match(normalised))
```
- **Defect**: Australian domestic users and restaurant POS systems provide numbers starting with `04` (e.g. `0412345678`, `0412 345 678`, `(04) 1234 5678`) or without plus (`61412345678`).
- Calling `is_au_mobile("0412345678")` evaluates to `False`!
- **Requirement**: Downstream implementation must include a robust `normalize_phone_number` function converting `04...` to `+614...` (E.164 for Telnyx) and `614...` (digits only for WhatsApp Cloud API).

### Gap 2: Meta Error Code #131026 Unhandled Specifically
- When a recipient is not on WhatsApp, Meta Graph API returns HTTP 400 with:
  ```json
  {"error": {"code": 131026, "message": "(#131026) Message undeliverable", "error_data": {"details": "Receiver is incapable of receiving this message"}}}
  ```
- Current code handles all non-200 responses identically with a generic log, but doesn't explicitly verify and handle code `131026` or extract diagnostic information.

### Gap 3: Absence of Internal Messaging Endpoint & Router
- `ORIGINAL_REQUEST.md` specifically mandates:
  > *"A POST to the backend's internal messaging endpoint with an AU mobile number routes to WhatsApp delivery logic (verifiable by inspecting the code path and the Meta API call). If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration."*
- Currently, there is NO internal endpoint `POST /api/messages/send` in `backend/app/api/` and no router mounted in `backend/main.py`.

### Gap 4: Missing Unified Dispatcher Service
- `backend/app/services/sms.py` currently holds the fallback logic, but returns `None` and catches exceptions without exposing metadata.
- A dedicated `app/services/messaging.py` is needed to return structured responses:
  ```python
  class SendMessageResponse(BaseModel):
      success: bool
      channel: str  # "whatsapp" | "sms"
      to_number: str
      message_id: str | None = None
      fallback_used: bool = False
      details: str | None = None
  ```

---

## 4. Comprehensive Unit Test Suite Design (`test_messaging.py`)

We have organized `backend/tests/unit/test_messaging.py` into five distinct test suites:

```
backend/tests/unit/test_messaging.py
├── TestSuite 1: TestPhoneNormalization
│   ├── test_valid_domestic_au_mobile_standard (0412345678)
│   ├── test_valid_domestic_au_mobile_with_formatting (spaces, hyphens, brackets)
│   ├── test_valid_international_au_mobile_e164 (+61412345678)
│   ├── test_valid_au_mobile_digits_only (61412345678)
│   ├── test_au_landline_not_mobile (0291234567)
│   ├── test_international_non_au_number (+12025550179)
│   └── test_invalid_phone_inputs ("", "abc", "12345", etc.)
├── TestSuite 2: TestWhatsAppServiceDelivery
│   ├── test_whatsapp_delivery_success (HTTP 200, wamid payload)
│   ├── test_whatsapp_missing_credentials_returns_false (empty secrets)
│   ├── test_whatsapp_error_131026_recipient_not_on_whatsapp (HTTP 400 error 131026)
│   ├── test_whatsapp_server_error_500_returns_false (HTTP 500)
│   ├── test_whatsapp_network_timeout_returns_false (httpx.TimeoutException)
│   └── test_whatsapp_connect_error_returns_false (httpx.ConnectError)
├── TestSuite 3: TestMessagingDispatcher
│   ├── test_dispatch_au_mobile_whatsapp_success (WhatsApp sent, Telnyx not called)
│   ├── test_dispatch_au_mobile_whatsapp_error_falls_back_to_sms (error 131026 -> Telnyx SMS)
│   ├── test_dispatch_au_mobile_whatsapp_exception_falls_back_to_sms (network error -> Telnyx SMS)
│   ├── test_dispatch_non_au_number_skips_whatsapp_directly_to_sms (US number -> direct SMS)
│   └── test_dispatch_telnyx_failure_handled_gracefully (both fail -> success=False)
├── TestSuite 4: TestMessagesApiEndpoint
│   ├── test_api_send_au_mobile_routes_to_whatsapp (HTTP 200, channel="whatsapp")
│   ├── test_api_send_whatsapp_error_returns_fallback_sms (HTTP 200, channel="sms", fallback_used=True)
│   ├── test_api_send_non_au_number_direct_sms (HTTP 200, channel="sms", fallback_used=False)
│   └── test_api_send_missing_fields_returns_422 (Pydantic 422)
└── TestSuite 5: TestPaymentLinkIntegration
    └── test_create_payment_link_uses_messaging_dispatcher (calls send_payment_message)
```

---

## 5. Detailed Test Specifications & Mocking Logic

### 5.1 Test Suite 1: Phone Normalization
- **Purpose**: Verify that any user-entered Australian phone number (domestic, formatted, or international) correctly normalizes to E.164 and WhatsApp digit string formats, while rejecting landlines and malformed strings.
- **Assertions**:
  - `0412345678` -> `norm.e164 == "+61412345678"`, `norm.whatsapp_id == "61412345678"`, `is_au_mobile == True`.
  - `(04) 1234 5678` -> `norm.e164 == "+61412345678"`, `is_au_mobile == True`.
  - `+12025550179` -> `norm.is_au_mobile == False`, `is_valid == True`.
  - `""`, `"abc"`, `"04123"` -> `norm.is_valid == False`.

### 5.2 Test Suite 2: Meta WhatsApp Cloud API Service
- **Purpose**: Verify the HTTP client interactions with Meta Graph API `https://graph.facebook.com/v20.0/{phone_number_id}/messages`.
- **Mocking Technique**:
  ```python
  with patch("httpx.AsyncClient") as mock_client_cls:
      mock_client = AsyncMock()
      mock_client.post = AsyncMock(return_value=mock_resp)
      mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
      mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)
  ```
- **Error Code 131026 Simulation**:
  ```python
  mock_resp.status_code = 400
  mock_resp.text = '{"error":{"message":"(#131026) Message undeliverable","code":131026}}'
  ```
  Returns `False` without raising an unhandled exception.

### 5.3 Test Suite 3: Messaging Dispatcher & Telnyx SMS Fallback
- **Purpose**: Verify that the dispatcher correctly decides between WhatsApp and SMS, and guarantees SMS fallback on WhatsApp failure.
- **Assertions**:
  - For AU mobile with WhatsApp success: `res.channel == "whatsapp"`, `res.fallback_used == False`, `mock_telnyx.assert_not_called()`.
  - For AU mobile with WhatsApp failure: `res.channel == "sms"`, `res.fallback_used == True`, `mock_telnyx.assert_called_once()`.
  - For Non-AU: `res.channel == "sms"`, `res.fallback_used == False`, `mock_wa.assert_not_called()`.

### 5.4 Test Suite 4: Internal Endpoint (`POST /api/messages/send`)
- **Purpose**: Verify FastAPI route handling, Pydantic model serialization, HTTP status codes, and input validation using `fastapi.testclient.TestClient`.
- **Fixture Strategy**:
  ```python
  @pytest.fixture
  def client(self):
      from app.api.messages import router as messages_router
      app = FastAPI()
      app.include_router(messages_router, prefix="/api/messages")
      return TestClient(app)
  ```
  *Rationale*: Testing the router on an isolated `FastAPI()` instance avoids triggering `main.py` lifespan (which connects to live Supabase/Redis), making the test 100% deterministic and lightning fast.

### 5.5 Test Suite 5: Payment Link Dispatch Integration
- **Purpose**: Verify that `backend/app/api/payments.py:create_payment_link` invokes the messaging dispatcher with the customer's phone number and Stripe Checkout URL.

---

## 6. Implementation Specifications for Downstream Builder

To ensure that the test suite passes with zero friction, the builder agent should implement the following interfaces:

### 1. `backend/app/services/whatsapp.py`
Add phone normalization:
```python
from typing import NamedTuple
import re

class NormalizedPhone(NamedTuple):
    raw: str
    is_valid: bool
    is_au_mobile: bool
    e164: str
    whatsapp_id: str

def normalize_phone_number(raw_number: str) -> NormalizedPhone:
    if not raw_number or not isinstance(raw_number, str):
        return NormalizedPhone(raw=str(raw_number), is_valid=False, is_au_mobile=False, e164="", whatsapp_id="")
    cleaned = re.sub(r"[\s\-\(\)\.]", "", raw_number)
    # Domestic: 04XXXXXXXX
    if re.match(r"^04\d{8}$", cleaned):
        digits = "61" + cleaned[1:]
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=True, e164="+" + digits, whatsapp_id=digits)
    # International with plus: +614XXXXXXXX
    if re.match(r"^\+614\d{8}$", cleaned):
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=True, e164=cleaned, whatsapp_id=cleaned[1:])
    # International without plus: 614XXXXXXXX
    if re.match(r"^614\d{8}$", cleaned):
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=True, e164="+" + cleaned, whatsapp_id=cleaned)
    # Other E.164
    if cleaned.startswith("+") and cleaned[1:].isdigit() and 8 <= len(cleaned) <= 15:
        return NormalizedPhone(raw=raw_number, is_valid=True, is_au_mobile=False, e164=cleaned, whatsapp_id=cleaned[1:])
    return NormalizedPhone(raw=raw_number, is_valid=False, is_au_mobile=False, e164=cleaned, whatsapp_id=cleaned)

def is_au_mobile(phone_number: str) -> bool:
    return normalize_phone_number(phone_number).is_au_mobile
```

### 2. `backend/app/services/messaging.py`
Unified messaging service:
```python
from pydantic import BaseModel
import structlog
import telnyx
from app.db.supabase import get_platform_secret
from app.services.whatsapp import is_au_mobile, normalize_phone_number, send_whatsapp_payment_link

log = structlog.get_logger()

class SendMessageResponse(BaseModel):
    success: bool
    channel: str
    to_number: str
    message_id: str | None = None
    fallback_used: bool = False
    details: str | None = None

async def send_payment_message(
    to_number: str,
    payment_url: str,
    restaurant_name: str = "Our Restaurant",
    from_number: str | None = None,
) -> SendMessageResponse:
    norm = normalize_phone_number(to_number)
    target_e164 = norm.e164 if norm.is_valid else to_number

    if norm.is_au_mobile:
        log.info("messaging.whatsapp_attempt", to=target_e164)
        try:
            wa_ok = await send_whatsapp_payment_link(target_e164, payment_url, restaurant_name)
            if wa_ok:
                return SendMessageResponse(
                    success=True, channel="whatsapp", to_number=target_e164, fallback_used=False
                )
        except Exception as e:
            log.warning("messaging.whatsapp_exception", error=str(e))
        log.info("messaging.fallback_to_sms", to=target_e164)

    # Fallback / Direct SMS
    telnyx_api_key = await get_platform_secret("TELNYX_API_KEY")
    telnyx.api_key = telnyx_api_key
    sender = from_number or await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
    text = f"Thank you for ordering with {restaurant_name}! Complete your payment here: {payment_url}"

    try:
        telnyx.Message.create(to=target_e164, _from=sender, text=text)
        log.info("sms.payment_link_sent", to=target_e164)
        return SendMessageResponse(
            success=True,
            channel="sms",
            to_number=target_e164,
            fallback_used=norm.is_au_mobile,
        )
    except Exception as e:
        log.error("sms.failed", error=str(e), to=target_e164)
        return SendMessageResponse(
            success=False,
            channel="sms",
            to_number=target_e164,
            fallback_used=norm.is_au_mobile,
            details=str(e),
        )
```

### 3. `backend/app/api/messages.py`
API router:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.messaging import send_payment_message, SendMessageResponse

router = APIRouter()

class SendMessageRequest(BaseModel):
    to_number: str = Field(..., min_length=5)
    payment_url: str = Field(..., min_length=1)
    restaurant_name: str = Field(default="Our Restaurant")
    from_number: str | None = None

@router.post("/send", response_model=SendMessageResponse)
async def send_message_endpoint(req: SendMessageRequest):
    res = await send_payment_message(
        to_number=req.to_number,
        payment_url=req.payment_url,
        restaurant_name=req.restaurant_name,
        from_number=req.from_number,
    )
    return res
```

### 4. `backend/main.py`
Mount the router:
```python
from app.api import voice, orders, restaurants, payments, admin, billing, messages
...
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
```

### 5. `backend/app/api/payments.py`
Update `create_payment_link`:
```python
from app.services.messaging import send_payment_message
...
await send_payment_message(
    to_number=customer_number,
    from_number=telnyx_number,
    payment_url=session.url,
    restaurant_name="Our Restaurant",
)
```

---

## 7. Artifacts Created

1. `.agents/explorer_m2_3/proposed_test_messaging.py`: Full executable test suite ready for builder implementation into `backend/tests/unit/test_messaging.py`.
2. `.agents/explorer_m2_3/analysis.md`: This comprehensive testing architecture and gap analysis report.
3. `.agents/explorer_m2_3/handoff.md`: 5-component handoff report.
