# BRIEFING — 2026-09-20T02:48:00Z

## Mission
Implement backend voice greeting generation endpoint with infallible fallback, Staff management API (invite and list), and Integrations API (connect and list with masked keys), mount routers in main.py, and write comprehensive unit tests.

## 🔒 My Identity
- Archetype: implementer / qa / specialist
- Roles: implementer, qa, specialist
- Working directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m2_1
- Original parent: b87ce451-d3cf-4526-818f-49b010cd25db
- Milestone: M2 - Voice Greeting, Staff Management, Integrations APIs & Unit Tests

## 🔒 Key Constraints
- Genuine implementation only, no cheating or hardcoding test outputs.
- Scope of ownership strictly limited to:
  - `backend/app/api/voice.py`
  - `backend/app/api/staff.py`
  - `backend/app/api/integrations.py`
  - `backend/main.py`
  - `backend/tests/unit/test_greeting.py`
  - `backend/tests/unit/test_staff.py`
  - `backend/tests/unit/test_integrations.py`
- Prompt engineering for Australian restaurant phone ordering (warm, concise, natural 1-2 sentences).
- Infallible fallback for greeting if OPENAI_API_KEY is missing or API errors.
- Masked API keys in GET integrations.
- Supabase auth invite/create user with upsert to users and restaurant_users.

## Current Parent
- Conversation ID: b87ce451-d3cf-4526-818f-49b010cd25db
- Updated: not yet

## Task Summary
- **What to build**:
  1. `POST /api/voice/generate-greeting` in `backend/app/api/voice.py`
  2. `POST /api/staff/invite` and `GET /api/staff` in `backend/app/api/staff.py`
  3. `POST /api/integrations` and `GET /api/integrations` in `backend/app/api/integrations.py`
  4. Mount routers in `backend/main.py`
  5. Unit tests in `backend/tests/unit/`
- **Success criteria**:
  - `pytest backend/tests/` passes completely
  - All endpoints behave according to specification with genuine error handling and fallback logic

## Key Decisions Made
- [TBD]

## Artifact Index
- `.agents/worker_m2_1/DISPATCH.md` — Dispatch instructions
- `.agents/worker_m2_1/BRIEFING.md` — Persistent situational memory
- `.agents/worker_m2_1/progress.md` — Progress tracker and liveness heartbeat

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- None required
