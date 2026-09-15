# Task Assignment: Worker M2 (WhatsApp Business API & Telnyx SMS Fallback Implementation)

**Role**: teamwork_preview_worker
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Explorer Reports**:
- `.agents/explorer_m2_1/analysis.md`
- `.agents/explorer_m2_2/analysis.md`
- `.agents/explorer_m2_3/analysis.md`
- Reference test file: `.agents/explorer_m2_3/proposed_test_messaging.py`
**Parent Conversation ID**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f

## Exclusive Write Ownership
You exclusively own:
- `backend/app/services/whatsapp.py`
- `backend/app/services/sms.py`
- `backend/app/services/messaging.py`
- `backend/app/api/messages.py`
- `backend/main.py`
- `backend/app/api/payments.py`
- `backend/tests/unit/test_messaging.py`

## Instructions
1. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
2. Read the explorer reports carefully.
3. In `backend/app/services/whatsapp.py`:
   - Enhance `is_au_mobile` to recognize Australian mobile numbers in domestic (`04XXXXXXXX`), E.164 (`+614XXXXXXXX`), digits (`614XXXXXXXX`), and formatted variations.
   - Implement `normalize_phone_number` / `normalize_phone` returning E.164 and WhatsApp recipient ID.
   - Ensure `send_whatsapp_payment_link` uses normalized recipient ID (digits only without `+`) and handles Meta Cloud API responses properly.
4. In `backend/app/services/sms.py`:
   - Add `force_sms: bool = False` parameter to `send_payment_sms` so that `messaging.py` can invoke Telnyx SMS without redundant duplicate WhatsApp checks, while preserving backward compatibility with `test_whatsapp.py`.
5. Create `backend/app/services/messaging.py`:
   - Implement `send_payment_message(to_number: str, payment_url: str, restaurant_name: str = "Our Restaurant", from_number: str | None = None) -> MessageResult`.
   - If `to_number` is AU mobile, attempt `send_whatsapp_payment_link`. On success, return `MessageResult(success=True, channel="whatsapp", fallback_used=False, ...)`.
   - On any Meta error or exception, or if `to_number` is not AU mobile, fall back to `send_payment_sms(..., force_sms=True)` and return `MessageResult(success=True, channel="sms", fallback_used=True, ...)`.
6. Create `backend/app/api/messages.py`:
   - Implement `POST /api/messages/send` with Pydantic request/response models (`SendMessageRequest`, `SendMessageResponse`).
   - Call `send_payment_message` and return appropriate status.
7. Update `backend/main.py`:
   - Mount `messages.router` under prefix `/api/messages`.
8. Update `backend/app/api/payments.py`:
   - Update `create_payment_link` to use `send_payment_message` from `app.services.messaging`.
9. Create `backend/tests/unit/test_messaging.py` (adopting and verifying tests from `.agents/explorer_m2_3/proposed_test_messaging.py`).
10. Run tests using `pytest` command (e.g. `pytest backend/tests/unit/test_messaging.py -v` and `pytest backend/tests/unit/test_whatsapp.py -v`).
11. Document all changes and test outputs in `handoff.md` and report back via `send_message`.

## 2026-09-14T05:25:40Z
Implement Milestone M2:
1. Update backend/app/services/whatsapp.py (AU normalization, normalize_phone_number, send_whatsapp_payment_link).
2. Update backend/app/services/sms.py (add force_sms parameter).
3. Create backend/app/services/messaging.py (send_payment_message with WhatsApp priority and Telnyx SMS fallback).
4. Create backend/app/api/messages.py (POST /api/messages/send).
5. Update backend/main.py (mount messages.router).
6. Update backend/app/api/payments.py (create_payment_link using send_payment_message).
7. Create backend/tests/unit/test_messaging.py.
8. Run unit tests using pytest in backend/ and ensure both test_messaging.py and test_whatsapp.py pass 100%.
9. Document your implementation and test output in handoff.md, and send a message back to your parent (b49662ee-22a2-47ec-a9cb-7ce83bdfa26f).
