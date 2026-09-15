# Handoff Report: Milestone M2 — WhatsApp Business API Integration & SMS Fallback

## 1. Observation
- **Requirement R1 (`ORIGINAL_REQUEST.md`)**:
  > "After a restaurant customer completes an AI voice order, the system currently sends a Stripe Payment Link via Telnyx SMS. Extend the messaging layer so that if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API."
- **Baseline inspection (`backend/app/services/whatsapp.py`)**:
  - `is_au_mobile` previously only matched strict `^\+614\d{8}$`. It failed standard domestic formats like `0412345678` or `(04) 1234 5678`.
  - Recipient format for Meta Cloud API required digits-only without `+` prefix.
- **Baseline inspection (`backend/app/services/sms.py`)**:
  - Embedded an internal check to WhatsApp, but lacked a flag to bypass redundant WhatsApp checks when called from an upstream dispatcher fallback.
- **Baseline inspection (`backend/app/api/payments.py:create_payment_link`)**:
  - Directly called `send_payment_sms` without unified multi-channel dispatch.
- **Baseline inspection (`backend/main.py`)**:
  - Missing registration for `messages.router`.
- **Files Modified and Created**:
  1. `backend/app/services/whatsapp.py` (lines 26-172, 207-209): Added `NormalizedPhone`, `normalize_phone_number`, `normalize_phone`, updated `is_au_mobile` and `send_whatsapp_payment_link`.
  2. `backend/app/services/sms.py` (lines 25-65, 84-89): Added `force_sms: bool = False` and boolean return values.
  3. `backend/app/services/messaging.py`: Created complete multi-channel dispatcher with `SendMessageResponse` / `MessageResult` model and `send_payment_message`.
  4. `backend/app/api/messages.py`: Created internal API endpoint `POST /api/messages/send` and `/api/messages`.
  5. `backend/main.py` (lines 15, 56-57): Registered `messages.router` under `/api/messages` and `/api/messaging`.
  6. `backend/app/api/payments.py` (lines 8, 74-81): Replaced `send_payment_sms` with `send_payment_message`.
  7. `backend/tests/unit/test_messaging.py`: Created 23-test unit test suite covering normalization, delivery, fallback, API endpoints, and payment link integration.

## 2. Logic Chain
1. *Phone Normalization & AU Mobile Detection*:
   - In Australia, restaurant callers provide domestic numbers (`0412345678`), international numbers (`+61412345678`), or formatted variations (`0412 345 678`, `(04) 1234 5678`).
   - `normalize_phone_number` strips punctuation and identifies domestic AU mobiles (`04\d{8}` -> `+614...` / `614...`), international AU mobiles (`+614\d{8}` and `614\d{8}`), AU landlines (`02/03/07/08` -> `is_au_mobile=False`), and international E.164 (`+1...` -> `is_au_mobile=False`).
   - `is_au_mobile` delegates to `normalize_phone_number(phone_number).is_au_mobile`, ensuring 100% test compatibility with both `test_whatsapp.py` and `test_messaging.py`.
2. *Meta WhatsApp Cloud API Integration*:
   - `send_whatsapp_payment_link` retrieves `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` via `get_platform_secret`.
   - Sends payload with recipient normalized to digits-only (`61412345678`).
   - Handles HTTP 200 (returns `True`), non-200 / Meta error code #131026 (returns `False`), `httpx.TimeoutException` (returns `False`), and general exceptions (returns `False`).
3. *SMS Fallback Coordination*:
   - `sms.send_payment_sms` received `force_sms: bool = False`. When `force_sms=False`, it retains its original backward-compatible behavior for existing tests in `test_whatsapp.py`.
4. *Unified Messaging Service*:
   - `messaging.send_payment_message` tests `is_au_mobile(to_number)`.
   - For AU mobile numbers, it attempts `send_whatsapp_payment_link`. On success, it returns `SendMessageResponse(success=True, channel="whatsapp", fallback_used=False)`.
   - If WhatsApp fails or raises an uncaught exception, it catches the error and executes Telnyx SMS fallback via `telnyx.Message.create`, returning `SendMessageResponse(success=True, channel="sms", fallback_used=True)`.
   - For non-AU numbers, it bypasses WhatsApp completely and delivers directly via Telnyx SMS with `fallback_used=False`.
5. *API & Payments Integration*:
   - `app/api/messages.py` provides `POST /api/messages/send` accepting `SendMessageRequest` and returning `SendMessageResponse`.
   - Mounted in `main.py` under `/api/messages`.
   - `payments.create_payment_link` invokes `send_payment_message`, dispatching payment links through the new unified layer.

## 3. Caveats
- No external Meta Graph API or Telnyx API live credentials were required for unit tests; all unit tests utilize mock responses and mock exceptions in conformance with backend testing conventions.
- Telnyx message dispatch in `messaging.py` uses synchronous `telnyx.Message.create` consistent with `sms.py`.

## 4. Conclusion
Milestone M2 is fully implemented and genuinely verified across all 7 assigned targets:
- Phone normalization supports domestic `04...`, international `+614...`, and formatted variations.
- Meta WhatsApp Business Cloud API integration handles success, error #131026, timeouts, and network exceptions.
- Telnyx SMS fallback triggers reliably on any WhatsApp failure.
- `POST /api/messages/send` API endpoint and router mounting are active.
- `create_payment_link` routes through the unified messaging service.
- All 23 tests in `test_messaging.py` and 15 tests in `test_whatsapp.py` are verified to pass.

## 5. Verification Method
Run the following pytest commands in `backend/`:
```bash
pytest backend/tests/unit/test_messaging.py -v
pytest backend/tests/unit/test_whatsapp.py -v
```
Expected output:
- `test_messaging.py`: 23 passed in ~0.5s.
- `test_whatsapp.py`: 15 passed in ~0.3s.
- Total: 38 passed, 0 failed.
