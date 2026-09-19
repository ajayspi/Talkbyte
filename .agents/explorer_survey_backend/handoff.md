# Handoff Report: Backend Architecture Survey for TalkByte Configuration Interfaces

**Agent:** `explorer_survey_backend`  
**Parent Agent:** `b87ce451-d3cf-4526-818f-49b010cd25db` (`orchestrator_9`)  
**Timestamp:** 2026-09-19T20:54:30Z  
**Type:** Hard (Task complete)  

---

## 1. Observation

1. **AI / Voice Stack & Configuration**:
   - `backend/requirements.txt:24`: `openai==1.59.3` is installed. `anthropic` is not in `requirements.txt`.
   - `backend/app/services/rag.py:5-28`: Initializes `AsyncOpenAI(api_key=key)` where key is fetched via `await get_platform_secret("OPENAI_API_KEY")`.
   - `backend/app/db/supabase.py:32-43`: `get_platform_secret(secret_name)` queries `platform_secrets` table in Supabase, falling back to `os.environ.get(secret_name.upper(), "")`.
   - `backend/app/services/livekit_agent.py:112-127`: Uses `openai.LLM` and mentions `LITELLM_BASE_URL` optional proxy.
   - `backend/app/api/voice.py:16`: `router = APIRouter()`, mounted in `backend/main.py:50` as `app.include_router(voice.router, prefix="/api/voice", tags=["voice"])`.
   - `frontend/src/components/restaurant/SettingsTab.tsx:340-348`:
     ```tsx
     <button
       type="button"
       className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
       onClick={() => setGreetingScript(`"Hi, welcome to ${businessName || 'our restaurant'}! I'm ${voicePersona}. Would you like to place an order today?"`)}
       style={{ fontSize: '10px' }}
     >
       ✨ Generate with AI
     </button>
     ```

2. **Staff Access & Multi-tenant Tables**:
   - Supabase project `agafustlankeieewtvck` has table `public.restaurant_users` with columns: `id (uuid, PK)`, `restaurant_id (uuid, FK)`, `user_id (uuid, FK)`, `role (text)`, `created_at (timestamptz)`.
   - `public.users` table exists in Supabase with columns: `id (uuid)`, `email (text)`, `name (text)`, `created_at (timestamptz)`. Contains user `demo@talkbyte.ai` (`045fc4ad-451b-4252-86b5-41f168fc2891`).
   - `backend/app/api/auth.py:39`: Verifies restaurant access using `await db.table("restaurant_users").select("*").eq("user_id", user.id).eq("restaurant_id", restaurant_id).execute()`.
   - `backend/app/api/restaurants.py:33-37`: Assigns restaurant owner on creation via `await db.table("restaurant_users").insert({"restaurant_id": restaurant["id"], "user_id": user.id, "role": "owner"}).execute()`.
   - `frontend/src/components/restaurant/SettingsTab.tsx:83-86, 121-137`: Currently uses mock React state `staffList` and adds temporary client objects without backend calls.

3. **Integrations & Third-Party Keys**:
   - `C:\Users\vigilare\.gemini\antigravity\brain\bd90ca65-fbbe-4f62-bb8e-103a5dc872bc\database_schema_proposal.md:98-107`: Defines `restaurant_integrations` table:
     ```sql
     create table restaurant_integrations (
       id            uuid primary key default gen_random_uuid(),
       restaurant_id uuid references restaurants(id) on delete cascade,
       provider      text not null, -- 'square', 'shopify', 'stripe', 'twilio'
       status        text default 'pending', -- 'connected', 'pending', 'error'
       api_key       text,
       metadata      jsonb default '{}',
       updated_at    timestamptz default now(),
       unique(restaurant_id, provider)
     );
     ```
   - `backend/app/services/pos/square.py:14-26`: Implements `SquarePOS(access_token, location_id, environment)` using `squareup` library.
   - `frontend/src/components/restaurant/SettingsTab.tsx:217-304`: Hardcoded badges for Square, Stripe, Twilio, and a mock button for Shopify.
   - `frontend/src/lib/api.ts:1`: Sets `const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'`.
   - `frontend/src/lib/proxy.ts:85-104`: Exports `proxyToBackend(endpoint, init)`.

4. **Framework & Test Setup**:
   - `backend/main.py:32-58`: Configures FastAPI, CORS (`config.frontend_url`), exception handlers, and mounts routers.
   - `backend/requirements.txt`: Contains all required packages (`fastapi`, `uvicorn`, `supabase`, `openai`, `stripe`, `squareup`, `pydantic`, `pytest`, `pytest-asyncio`).
   - `backend/tests/`: Uses `pytest==8.3.4` with `backend/pytest.ini` (`testpaths = tests`). Fixtures in `backend/tests/conftest.py` mock Supabase and Redis. Existing unit tests (`test_voice.py`, `test_order_api.py`) demonstrate `TestClient(app)` patterns.

---

## 2. Logic Chain

1. **AI Voice Greeting Generator (R3)**:
   - *Premise*: Frontend needs a real dynamic greeting script from an LLM based on restaurant name and persona, without crashing if the LLM key is absent.
   - *Reasoning*: `AsyncOpenAI` is already configured in the codebase via `get_platform_secret("OPENAI_API_KEY")`. If this key is missing or the external API call fails, returning an unhandled error breaks the user experience and fails acceptance criteria.
   - *Deduction*: We must create `POST /api/voice/generate-greeting` in `backend/app/api/voice.py` that calls OpenAI with a prompt customized for Australian voice ordering (concise, 1-2 sentences, warm, professional). A deterministic fallback generator must be wrapped around the call to guarantee a valid greeting is returned even without an API key or when network errors occur.

2. **Staff Management Integration (R1)**:
   - *Premise*: The invite modal in `SettingsTab.tsx` must trigger a backend endpoint to invite staff, and the staff table must reflect real database records.
   - *Reasoning*: `restaurant_users` connects `restaurant_id` and `user_id`. `public.users` stores profile information (`email`, `name`). The backend has administrative access via `supabase_service_role_key`.
   - *Deduction*: Create `POST /api/staff/invite` (in a new `backend/app/api/staff.py` router) that accepts `restaurant_id`, `name`, `email`, and `role`. It calls `db.auth.admin.invite_user_by_email` (falling back to `db.auth.admin.create_user`), upserts into `public.users`, and upserts into `restaurant_users`. Also provide `GET /api/staff?restaurant_id={restaurant_id}` so the frontend can easily fetch real staff data joined with names and emails.

3. **Integrations Storage & Routing (R2)**:
   - *Premise*: The dashboard must securely collect and store API keys for Square, Stripe, Twilio, and Shopify.
   - *Reasoning*: Storing third-party secret tokens directly from browser clients poses a significant security vulnerability (exposing unmasked secrets). Managing this via a backend endpoint allows secret masking on read requests (`GET /api/integrations`) and validation before saving.
   - *Deduction*: Create `backend/app/api/integrations.py` mounted at `/api/integrations` with `GET /api/integrations?restaurant_id=...` (returns connection status and masked keys) and `POST /api/integrations` (saves provider, api_key, and metadata into `restaurant_integrations`).

4. **Integration Architecture & Tests**:
   - *Premise*: The backend must remain strictly type-safe, maintain clean router organization, and pass test suites.
   - *Reasoning*: All dependencies are already installed in `requirements.txt`. Router registration follows a standard pattern in `backend/main.py`.
   - *Deduction*: Registering `staff.router` and `integrations.router` in `backend/main.py` and extending `voice.router` introduces no breaking changes and integrates cleanly with the existing CORS and test client setup.

---

## 3. Caveats

1. **Supabase SMTP Configuration**: In local development or unconfigured Supabase instances, `db.auth.admin.invite_user_by_email` may return an error if email sending (SMTP) is disabled. The backend implementation must include an automatic fallback to `db.auth.admin.create_user` to ensure inviting staff succeeds reliably in all development and test environments.
2. **Database Table Creation (R0)**: The `restaurant_integrations` table must be applied to the database before the integrations endpoint can execute SQL against it.
3. **Frontend Origin & CORS**: FastAPI's `CORSMiddleware` in `backend/main.py:41` allows `config.frontend_url` (`http://localhost:3000`). When calling from tests or other origins, ensure standard CORS headers or test client mocking is used.

---

## 4. Conclusion

The backend architecture is well-prepared to support the new configuration endpoints with zero new external dependencies:
1. **R3**: Add `POST /api/voice/generate-greeting` in `backend/app/api/voice.py` using `AsyncOpenAI` with prompt engineering for Australian restaurant voice ordering and an infallible heuristic fallback.
2. **R1**: Implement `POST /api/staff/invite` and `GET /api/staff` in `backend/app/api/staff.py` integrating Supabase Auth admin API with `restaurant_users` and `public.users`.
3. **R2**: Implement `GET /api/integrations` (masked secrets) and `POST /api/integrations` in `backend/app/api/integrations.py` saving to `restaurant_integrations`.
4. Register both new routers (`staff` and `integrations`) in `backend/main.py`.

Detailed specifications, endpoint contracts, schemas, and test plans have been documented in `.agents/explorer_survey_backend/analysis.md`.

---

## 5. Verification Method

1. **Verify Files & Specifications**:
   - Inspect `.agents/explorer_survey_backend/analysis.md`.
   - Inspect `backend/app/api/voice.py` and `backend/main.py`.
2. **Verify Python Environment & Test Execution**:
   - Run `pytest backend/tests/` to verify existing tests pass.
   - When new endpoints are implemented, run:
     - `pytest backend/tests/unit/test_greeting.py`
     - `pytest backend/tests/unit/test_staff.py`
     - `pytest backend/tests/unit/test_integrations.py`
3. **Verify API Endpoints via HTTP**:
   - `POST /api/voice/generate-greeting` with `{"restaurant_name": "Nonna's Pizzeria", "persona": "Aria"}` returns 200 with non-empty `greeting` string.
   - `POST /api/staff/invite` with `{"restaurant_id": "...", "name": "Marco", "email": "marco@example.com", "role": "Manager"}` returns 200 and persists record.
   - `POST /api/integrations` with `{"restaurant_id": "...", "provider": "square", "api_key": "sq0atp-...", "metadata": {"location_id": "LOC1"}}` returns 200 and masks key on subsequent `GET`.
