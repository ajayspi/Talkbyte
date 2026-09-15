# Handoff Report: Explorer M2-1 (WhatsApp & Messaging Service)

## 1. Observation
1. **`backend/app/services/whatsapp.py` (lines 23-34)**:
   - Contains:
     ```python
     _AU_MOBILE_RE = re.compile(r"^\+614\d{8}$")

     def is_au_mobile(phone_number: str) -> bool:
         normalised = phone_number.replace(" ", "").replace("-", "")
         return bool(_AU_MOBILE_RE.match(normalised))
     ```
   - Only accepts strictly formatted international numbers `+614xxxxxxxx`. Rejects domestic Australian numbers `04xxxxxxxx`, international digits `614xxxxxxxx`, and numbers with parentheses `(04) 1234-5678`.
2. **`backend/app/services/whatsapp.py` (lines 70-71, 89-93)**:
   - Recipient formatting uses `recipient = to_number.lstrip("+")`.
   - Meta Graph API base is hardcoded to `_GRAPH_API_BASE = "https://graph.facebook.com/v20.0"`.
   - Missing phone normalization means domestic `04xxxxxxxx` would be passed directly to Meta as `"to": "04xxxxxxxx"`, which Meta rejects.
3. **`backend/app/services/sms.py` (lines 50-65)**:
   - Contains:
     ```python
     if is_au_mobile(to_number):
         log.info("messaging.whatsapp_attempt", to=to_number)
         whatsapp_ok = await send_whatsapp_payment_link(
             to_number=to_number,
             payment_url=payment_url,
             restaurant_name=restaurant_name,
         )
         if whatsapp_ok:
             return
         log.info("messaging.whatsapp_failed_sms_fallback", to=to_number, reason="WhatsApp delivery unsuccessful")
     ```
   - WhatsApp fallback was previously embedded directly inside `send_payment_sms`.
   - Existing unit tests in `backend/tests/unit/test_whatsapp.py` lines 159–219 directly test `sms.send_payment_sms` calling `send_whatsapp_payment_link`.
4. **`backend/app/services/messaging.py`**:
   - File does not currently exist.
   - Milestone M2 and Acceptance Criteria require a unified messaging service that routes AU mobile numbers to WhatsApp first, with fallback to Telnyx SMS on ANY failure or exception, returning status metadata.

## 2. Logic Chain
1. **From Observation 1 & 2**: Because Australian restaurant callers routinely provide phone numbers in domestic format (`0412 345 678`) or digits format, `is_au_mobile` must be enhanced to accept `04xxxxxxxx` and `614xxxxxxxx`, and a canonical normalizer `normalize_phone` must convert input numbers to both E.164 (`+614...` for Telnyx) and digits-only (`614...` for Meta WhatsApp).
2. **From Observation 3**: Because `backend/tests/unit/test_whatsapp.py` patches `app.services.sms.send_whatsapp_payment_link` and `app.services.sms.is_au_mobile`, modifying `sms.send_payment_sms` to support `force_sms: bool = False` ensures that legacy callers and existing unit tests pass unmodified, while `messaging.py` can invoke `send_payment_sms(..., force_sms=True)` without triggering redundant duplicate WhatsApp API calls.
3. **From Observation 4**: Creating `backend/app/services/messaging.py` provides the required separation of concerns:
   - Function `send_payment_message(to_number, payment_url, restaurant_name, from_number) -> MessageResult`.
   - Normalizes recipient.
   - Checks `is_au_mobile`:
     - If AU mobile: attempts `send_whatsapp_payment_link`. Catches all HTTP errors AND any unhandled exceptions (`try...except Exception`), and falls back to `send_payment_sms(..., force_sms=True)`.
     - If non-AU: bypasses WhatsApp, routes directly to `send_payment_sms(..., force_sms=True)`.
   - Returns `MessageResult` dataclass with `success`, `channel` (`whatsapp` | `sms`), `to_number`, `fallback_used`, `message_id`, `error`, and `details`.

## 3. Caveats
- Meta WhatsApp Business Cloud API requires pre-registered sender numbers and active phone number IDs in production. For testing and demo mode, unit tests must mock `httpx.AsyncClient` responses and `telnyx.Message.create`.
- The Meta Graph API text message payload requires that the recipient has initiated a conversation or that a 24-hour customer service window is open, or otherwise a pre-approved template message must be used. For this milestone's payment link requirement, standard text message payload is implemented as specified in the prior survey.

## 4. Conclusion
1. `backend/app/services/whatsapp.py` must be upgraded with `normalize_phone` (returning `NormalizedPhone`), enhanced `is_au_mobile`, configurable `WHATSAPP_API_VERSION`, and normalized recipient extraction.
2. `backend/app/services/sms.py` must be updated with `force_sms: bool = False` and return a boolean status, preserving 100% backward compatibility with `test_whatsapp.py`.
3. `backend/app/services/messaging.py` must be implemented as the central multi-channel service implementing `send_payment_message(...) -> MessageResult` with robust exception safety and structured metadata.
4. Downstream agents (`explorer_m2_2` and `explorer_m2_3`) can safely implement `backend/app/api/messages.py`, update `payments.py:create_payment_link`, and write `backend/tests/unit/test_messaging.py` against this specification.

## 5. Verification Method
1. **Static Inspection**:
   - Inspect `backend/app/services/whatsapp.py` for `normalize_phone` and `is_au_mobile`.
   - Inspect `backend/app/services/messaging.py` for `send_payment_message` and `MessageResult`.
   - Inspect `backend/app/services/sms.py` for `force_sms` support.
2. **Unit Test Execution**:
   - Run existing tests: `pytest backend/tests/unit/test_whatsapp.py -v`. All 8 `is_au_mobile` tests, 4 `send_whatsapp_payment_link` tests, and 3 `send_payment_sms` tests must pass with 0 failures.
   - Run new messaging test suite once created: `pytest backend/tests/unit/test_messaging.py -v`.
3. **Invalidation Conditions**:
   - If `is_au_mobile("0412345678")` returns `False`, normalization is broken.
   - If WhatsApp throwing an exception causes `send_payment_message` to crash instead of falling back to Telnyx SMS, resilience criteria is violated.
   - If `send_payment_message` with an AU number makes duplicate WhatsApp calls upon fallback, the `force_sms` flag was omitted.
