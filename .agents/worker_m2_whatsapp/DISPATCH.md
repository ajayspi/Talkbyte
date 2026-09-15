# Task Assignment: Milestone M2 Worker — WhatsApp Business API Integration & SMS Fallback (R1)

**Role**: teamwork_preview_worker
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2_whatsapp
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Survey Blueprint**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_survey_backend_whatsapp\analysis.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## File Ownership
You exclusively own:
- `backend/app/services/whatsapp.py` (New)
- `backend/app/services/messaging.py` (New)
- `backend/app/api/messages.py` (New)
- `backend/main.py` (Mount messages router)
- `backend/app/api/payments.py` (Update `create_payment_link` to use `send_payment_message`)
- `backend/tests/unit/test_messaging.py` (New unit test suite)

---

## Technical Specifications & Tasks
Reference the complete blueprint in `.agents/explorer_survey_backend_whatsapp/analysis.md`.

### 1. Create `backend/app/services/whatsapp.py`
- Australian mobile number normalization:
  - Supports `04XXXXXXXX`, `+614XXXXXXXX`, `614XXXXXXXX`, and formatted strings like `0412 345 678`.
  - Returns `is_valid`, `is_au_mobile`, `e164` (for Telnyx, e.g. `+61412345678`), and `whatsapp_id` (digits only, e.g. `61412345678`).
- Meta WhatsApp Business Cloud API client:
  - Uses `httpx.AsyncClient` (already in `backend/requirements.txt`).
  - URL: `https://graph.facebook.com/{version}/{phone_number_id}/messages` (version defaults to `"v18.0"`).
  - Auth: `Bearer <WHATSAPP_ACCESS_TOKEN>`.
  - Retrieves secrets using `get_platform_secret` from `app.services.secrets` (falling back to `os.getenv`).
  - Dispatches message with text body containing restaurant name and payment URL.
  - Raises custom `WhatsAppDeliveryError` on any HTTP error (such as 400 with code 131026 "Message undeliverable - Receiver is incapable of receiving this message") or connection/timeout error.

### 2. Create `backend/app/services/messaging.py`
- Orchestrates multi-channel delivery:
  - Normalizes recipient phone number.
  - If AU mobile: attempts `send_whatsapp_payment_message`.
  - If WhatsApp delivery raises an exception (or number is not on WhatsApp / not AU mobile): logs warning and falls back to `send_payment_sms` (Telnyx) from `app.services.sms`.
  - Returns structured result: `{"success": bool, "channel": "whatsapp" | "sms", "to_number": str, "message_id": str | None, "fallback_used": bool, "details": str | None}`.

### 3. Create `backend/app/api/messages.py` and Mount in `backend/main.py`
- Endpoint `POST /api/messages/send`:
  - Request body: `to_number` (str), `payment_url` (str), `restaurant_name` (str, default "Our Restaurant"), `from_number` (optional str).
  - Routes to `send_payment_message` from `app.services.messaging`.
  - Returns HTTP 200 with delivery result.
- In `backend/main.py`:
  - Import `messages` from `app.api` and include router: `app.include_router(messages.router, prefix="/api/messages", tags=["messages"])`.

### 4. Update `backend/app/api/payments.py`
- In `create_payment_link`: replace the direct call to `send_payment_sms` with `send_payment_message(to_number=customer_number, from_number=telnyx_number, payment_url=session.url, restaurant_name="Our Restaurant")`.

### 5. Create `backend/tests/unit/test_messaging.py`
Create comprehensive test cases using `pytest`, `pytest_asyncio`, and `unittest.mock`:
- Phone normalization: domestic `04XXXXXXXX`, international `+614XXXXXXXX`, digits `614XXXXXXXX`, non-AU numbers, invalid inputs.
- WhatsApp success: Meta API returns 200, returns `channel="whatsapp"`, Telnyx is NOT called.
- WhatsApp 131026 error: Meta returns 400 with code 131026 -> falls back to Telnyx, returns `channel="sms"`, `fallback_used=True`.
- WhatsApp timeout/exception: `httpx.ConnectTimeout` or network exception -> falls back to Telnyx, returns `channel="sms"`, `fallback_used=True`.
- API endpoint `POST /api/messages/send`: TestClient tests verifying routing and fallback.

### 6. Verification Commands
Run in `backend/`:
- `pytest tests/unit/test_messaging.py` (all tests pass).
- Verify `pip install -r requirements.txt` succeeds without dependency conflicts.

Write your report to `handoff.md` and notify orchestrator via `send_message`.

## 2026-09-14T01:16:10Z
Received dispatch prompt:
You are worker_m2_whatsapp, a Worker subagent for TalkByte.
Working directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2_whatsapp
Read your assignment in c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2_whatsapp\DISPATCH.md.
MANDATORY: Read the authoritative user request at c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md before starting work.
Also read c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md and .agents/explorer_survey_backend_whatsapp/analysis.md.

Tasks:
1. Implement backend/app/services/whatsapp.py with AU phone normalization and Meta WhatsApp Business Cloud API client using httpx.
2. Implement backend/app/services/messaging.py with multi-channel dispatch: attempt WhatsApp, catch any error/exception and fall back to send_payment_sms via Telnyx.
3. Implement backend/app/api/messages.py with endpoint POST /api/messages/send and mount in backend/main.py.
4. Update backend/app/api/payments.py:create_payment_link to call send_payment_message.
5. Create comprehensive unit tests in backend/tests/unit/test_messaging.py.
6. Verify implementation with pytest.
7. Write your execution report to handoff.md in your working directory and notify orchestrator via send_message.

