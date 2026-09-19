## 2026-09-20T02:47:40Z

You are worker_m2_1.
Your working directory is: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2_1`.
Parent orchestrator conversation ID: `b87ce451-d3cf-4526-818f-49b010cd25db`.

MANDATORY FIRST STEP: Read `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md` (specifically the section `Follow-up — 2026-09-19T20:52:08Z` and R1, R2, R3).
Also read:
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_survey_backend\analysis.md`
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_survey_backend\handoff.md`
- `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m1_1\handoff.md` (note: DB schema for restaurant_integrations and restaurant_users is already applied to Supabase).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE OF OWNERSHIP:
You exclusively own:
- `backend/app/api/voice.py`
- `backend/app/api/staff.py`
- `backend/app/api/integrations.py`
- `backend/main.py`
- `backend/tests/unit/test_greeting.py`
- `backend/tests/unit/test_staff.py`
- `backend/tests/unit/test_integrations.py`

TASK OBJECTIVES:
1. Implement `POST /api/voice/generate-greeting` in `backend/app/api/voice.py`:
   - Request schema: `restaurant_name: str`, `persona: str`.
   - Uses `AsyncOpenAI` with prompt engineering designed for Australian restaurant phone ordering (warm, concise, natural 1-2 sentences).
   - Infallible fallback: If `OPENAI_API_KEY` is not present or if the OpenAI call raises an exception/network error, generate a high-quality persona-specific dynamic greeting tailored to the restaurant name without crashing.
   - Return `{ "status": "success", "greeting": greeting, "provider": ... }`.
2. Implement Staff Management router in `backend/app/api/staff.py`:
   - `POST /api/staff/invite`: Request `{ "restaurant_id": str, "name": str, "email": str, "role": str }`.
     - Calls Supabase auth admin to invite user (`invite_user_by_email`, fallback to `create_user` if SMTP disabled).
     - Upserts into `public.users` (`id`, `email`, `name`).
     - Upserts into `public.restaurant_users` (`restaurant_id`, `user_id`, `role`).
     - Returns `{ "status": "success", "user_id": ..., "message": ... }`.
   - `GET /api/staff`: Accepts query param `restaurant_id: str`.
     - Queries `public.restaurant_staff_view` or `public.restaurant_users` joined with `public.users`.
     - Returns `{ "staff": [...] }`.
3. Implement Integrations router in `backend/app/api/integrations.py`:
   - `POST /api/integrations`: Request `{ "restaurant_id": str, "provider": str, "api_key": Optional[str], "metadata": Optional[dict], "config": Optional[dict] }`.
     - Supports providers: `square`, `stripe`, `twilio`, `shopify`.
     - Securely upserts into `public.restaurant_integrations` (handling conflict on `restaurant_id, provider`), setting `status: 'active'` or `'connected'`, and `is_active: True`.
     - Returns `{ "status": "success", "provider": provider, "connected": true }`.
   - `GET /api/integrations`: Accepts query param `restaurant_id: str`.
     - Queries `public.restaurant_integrations` for that restaurant.
     - Returns `{ "integrations": { [provider]: { "connected": bool, "status": str, "masked_key": str, "metadata": dict } } }`. Note: API keys MUST be masked for security (e.g. `sq0atp-****...****`).
4. Mount `staff.router` and `integrations.router` in `backend/main.py` under `/api/staff` and `/api/integrations`.
5. Unit tests:
   - Create `backend/tests/unit/test_greeting.py`, `backend/tests/unit/test_staff.py`, and `backend/tests/unit/test_integrations.py`.
   - Ensure tests verify endpoint functionality (both normal and fallback flows).
   - Run `pytest backend/tests/` and ensure all tests pass.
6. Verify Acceptance Criteria:
   - Run `pip install -r requirements.txt` in `backend/` and verify it succeeds with exit code 0.
   - Run `pytest backend/tests/` and verify all tests pass.
7. Record changes in working directory, write `handoff.md`, and notify parent `b87ce451-d3cf-4526-818f-49b010cd25db` via `send_message`.
