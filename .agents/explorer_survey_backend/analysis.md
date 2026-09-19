# Backend Architecture Survey & Endpoint Specification Analysis

**Author:** `explorer_survey_backend`  
**Working Directory:** `.agents/explorer_survey_backend/`  
**Target Worktree:** `talkbyte-project-integration-fad989`  
**Date:** 2026-09-19T20:54:30Z  

---

## Executive Summary

This investigation explores the FastAPI backend architecture in `backend/` to specify the design, endpoints, request/response models, database interactions, error handling, and test strategies for three core features:
1. **AI Greeting Script Generator (R3)**: FastAPI endpoint calling OpenAI to generate a custom voice greeting script with robust deterministic fallback if the API key is missing or calls fail.
2. **Staff Management Invite Endpoint (R1)**: FastAPI endpoint (`POST /api/staff/invite`) integrating with Supabase Auth admin API and the `restaurant_users` table, plus staff listing.
3. **Integrations Storage & Endpoints (R2)**: FastAPI router (`/api/integrations`) to securely store and retrieve API keys/metadata for Square POS, Stripe Checkout, Twilio SMS, and Shopify POS into `restaurant_integrations`.
4. **Backend Setup & Test Verification**: Review of `requirements.txt`, `main.py`, router mounting, CORS, configuration, and `backend/tests/`.

---

## 1. AI Greeting Script Generator (R3)

### 1.1 Existing LLM / AI Integrations Review
- **Dependencies (`backend/requirements.txt:24`)**:
  - `openai==1.59.3` is installed.
  - `anthropic` is NOT installed in `requirements.txt`.
- **RAG & Secret Fetching (`backend/app/services/rag.py:5-28`)**:
  - `from openai import AsyncOpenAI`
  - Retrieves `OPENAI_API_KEY` dynamically via `await get_platform_secret("OPENAI_API_KEY")` in `backend/app/db/supabase.py:32-43`.
  - In `supabase.py:36`, `get_platform_secret` first queries Supabase table `platform_secrets` (`select("secret_value").eq("secret_name", secret_name)`). If not found or if query fails, it falls back to `os.environ.get(secret_name.upper(), "")`.
- **LiveKit Agent (`backend/app/services/livekit_agent.py:112-127`)**:
  - Mentions `LITELLM_BASE_URL` (`os.getenv("LITELLM_BASE_URL", "http://litellm:4000/v1")`) as optional proxy.
  - Uses `openai.LLM(model="gpt-4.1", ...)` or `gpt-4o-mini`.

### 1.2 Proposed Endpoint Specification
- **Endpoint Route**: `POST /api/voice/generate-greeting`
  - In `backend/app/api/voice.py`, since `voice.router` is already mounted at `/api/voice` in `backend/main.py:50`, adding `@router.post("/generate-greeting")` and `@router.post("/greeting")` creates:
    - Primary: `POST /api/voice/generate-greeting`
    - Alias: `POST /api/voice/greeting`
- **Request Model**:
  ```python
  class GenerateGreetingRequest(BaseModel):
      restaurant_name: str = Field(..., description="Name of the restaurant")
      persona: str = Field(default="Aria", description="Voice persona name")
      style_or_tone: Optional[str] = Field(default="friendly and professional", description="Tone or style instructions")
  ```
- **Response Model**:
  ```python
  class GenerateGreetingResponse(BaseModel):
      greeting: str
      status: str = "success"
  ```
- **Prompt Template**:
  ```text
  System Prompt:
  You are an expert hospitality voice assistant scriptwriter for Australian restaurants.
  Generate a concise, natural, warm, and professional phone greeting script (1 to 2 sentences, maximum 30 words) for an AI voice ordering assistant.
  Rules:
  1. Welcome the caller naturally (conversational Australian tone).
  2. Clearly identify the restaurant name and the AI persona name.
  3. Invite the customer to place an order or ask a question.
  4. Return ONLY the spoken greeting text. Do not include quotation marks, markdown, emojis, or stage directions.

  User Prompt:
  Restaurant: {restaurant_name}
  Assistant Persona: {persona}
  Tone: {style_or_tone}
  ```
- **Fallback Behavior (When LLM Key is Missing or Call Fails)**:
  To fulfill the acceptance criteria (*"Clicking 'Generate with AI' calls the backend and populates the text area with a dynamically generated script, without crashing"*), the endpoint MUST NOT crash with an HTTP 500 error if `OPENAI_API_KEY` is not set or if OpenAI returns 401/429/500/timeout:
  ```python
  def build_fallback_greeting(restaurant_name: str, persona: str) -> str:
      name = restaurant_name.strip() if restaurant_name and restaurant_name != "Loading..." else "our restaurant"
      p = persona.strip() if persona else "Aria"
      return f"G'day! Welcome to {name}. I'm {p}, your automated assistant. Would you like to place an order for pickup or delivery today?"
  ```
  If `openai_key` is empty or if `client.chat.completions.create(...)` raises an Exception, catch it, log a warning (`voice.generate_greeting.fallback_used`), and return the fallback greeting.

---

## 2. Staff Management Invite Endpoint (R1)

### 2.1 Database & Auth Survey
- **Supabase Database (`public.restaurant_users`)**:
  - Table already exists in Supabase (`project_id: agafustlankeieewtvck`):
    - `id`: `uuid` PK
    - `restaurant_id`: `uuid` FK -> `restaurants.id`
    - `user_id`: `uuid` FK -> `auth.users.id`
    - `role`: `text` (or `user_role` enum: 'owner', 'manager', 'staff')
    - `created_at`: `timestamptz`
  - In `backend/app/api/auth.py:37-41`, `verify_restaurant_access` already queries `restaurant_users` to verify user access:
    ```python
    result = await db.table("restaurant_users").select("*").eq("user_id", user.id).eq("restaurant_id", restaurant_id).execute()
    ```
- **User Profiles Table**:
  - `public.users` table exists in Supabase with columns: `id` (uuid), `email` (text), `name` (text), `created_at`.
  - `demo@talkbyte.ai` exists with id `045fc4ad-451b-4252-86b5-41f168fc2891`.
  - In `backend/supabase_schema.sql:38`, `restaurant_users` links `restaurant_id` to `user_id`.

### 2.2 Endpoint Specification
- **Recommended Module & Route**:
  Create `backend/app/api/staff.py` and mount in `backend/main.py` under prefix `/api/staff`.
  Also provide route alias in `backend/app/api/restaurants.py`:
  - `POST /api/staff/invite`
  - `GET /api/staff?restaurant_id={restaurant_id}`
  - (and `POST /api/restaurants/{restaurant_id}/staff/invite`)
- **Request Model**:
  ```python
  class StaffInviteRequest(BaseModel):
      restaurant_id: str
      name: str
      email: str
      role: Literal["owner", "manager", "staff", "Owner", "Manager", "Staff"] = "Staff"
  ```
- **Response Model**:
  ```python
  class StaffMemberResponse(BaseModel):
      id: str
      name: str
      email: str
      role: str
      lastLogin: str = "Pending Invite"
  ```
- **Interaction Flow with Supabase Auth & DB**:
  1. Receive `restaurant_id`, `name`, `email`, `role`.
  2. Normalize role to lowercase (`'manager'`, `'staff'`).
  3. Inspect `auth.users` / `public.users` to check if a user with `email` exists.
  4. If user does NOT exist:
     - Call Supabase Auth Admin:
       `user_res = await db.auth.admin.invite_user_by_email(email, {"data": {"full_name": name}})`
     - If `invite_user_by_email` raises an error (e.g. SMTP is unconfigured in development), fall back gracefully:
       `user_res = await db.auth.admin.create_user({"email": email, "email_confirm": True, "user_metadata": {"full_name": name}})`
     - Extract `user_id = user_res.user.id`.
     - Upsert into `public.users`:
       `await db.table("users").upsert({"id": user_id, "email": email, "name": name}).execute()`
  5. If user already exists:
     - `user_id = existing_user_id`.
  6. Upsert record into `restaurant_users`:
     ```python
     await db.table("restaurant_users").upsert({
         "restaurant_id": restaurant_id,
         "user_id": user_id,
         "role": role_norm,
     }, on_conflict="restaurant_id,user_id").execute()
     ```
  7. Return `{"status": "invited", "staff": {...}}`.
- **Listing Staff Endpoint (`GET /api/staff?restaurant_id=...`)**:
  - Query `restaurant_users` for `restaurant_id`.
  - Fetch corresponding user profiles from `public.users` (by `user_id`).
  - Return formatted list: `[{ "id": ..., "name": ..., "email": ..., "role": "Owner"|"Manager"|"Staff", "lastLogin": ... }]`.

---

## 3. Integrations Storage / Endpoint (R2)

### 3.1 Database Schema
From `database_schema_proposal.md:98-107`:
```sql
create table restaurant_integrations (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  provider      text not null, -- 'square', 'shopify', 'stripe', 'twilio'
  status        text default 'pending', -- 'connected', 'pending', 'error'
  api_key       text,          -- Store securely
  metadata      jsonb default '{}',
  updated_at    timestamptz default now(),
  unique(restaurant_id, provider)
);
```

### 3.2 Architectural Analysis: Backend Endpoint vs. Direct Client Supabase Save
- **Security Analysis**:
  - API keys for Square (Personal Access Tokens), Stripe (Secret Keys `sk_...`), Twilio (Auth Tokens), and Shopify (Admin API Tokens) are high-privilege credentials.
  - Storing them directly from client-side Supabase requires granting client insert/select on `restaurant_integrations`. If clients can `select *`, any compromised staff account or XSS could read all plaintext API keys.
  - Using a FastAPI backend endpoint (`POST /api/integrations`) allows:
    1. **Secret Masking on Read**: When returning integrations to the frontend (`GET /api/integrations`), the backend returns masked keys (e.g. `sq0atp-••••••••abcd`), never leaking the raw token.
    2. **Validation / Testing**: The backend can validate the credentials against the third-party provider (e.g. `squareup Client(access_token=...)` or `stripe.Account.retrieve()`) and update `status` to `'connected'` or `'error'`.
    3. **RLS Isolation**: Handled via backend `service_role` key, avoiding complex client RLS policies for credentials.
- **Dedicated Router Specification (`backend/app/api/integrations.py`)**:
  - `GET /api/integrations?restaurant_id={restaurant_id}`:
    Returns status and configuration for all 4 providers:
    ```json
    {
      "integrations": [
        {
          "provider": "square",
          "status": "connected",
          "api_key_masked": "sq0atp-••••••••7a1f",
          "metadata": { "location_id": "L12345", "environment": "sandbox" }
        },
        {
          "provider": "stripe",
          "status": "connected",
          "api_key_masked": "sk_test_••••••••88bb",
          "metadata": { "account_id": "acc_1Nk..." }
        },
        {
          "provider": "twilio",
          "status": "connected",
          "api_key_masked": "AC••••••••9102",
          "metadata": { "phone_number": "+61299991234" }
        },
        {
          "provider": "shopify",
          "status": "pending",
          "api_key_masked": null,
          "metadata": {}
        }
      ]
    }
    ```
  - `POST /api/integrations`:
    Request payload:
    ```python
    class SaveIntegrationRequest(BaseModel):
        restaurant_id: str
        provider: Literal["square", "stripe", "twilio", "shopify"]
        api_key: str = Field(..., min_length=1)
        metadata: dict = Field(default_factory=dict)
        status: Optional[str] = "connected"
    ```
    Saves/upserts into `restaurant_integrations`.
  - `DELETE /api/integrations/{provider}?restaurant_id={restaurant_id}`:
    Removes or resets integration record.

---

## 4. Backend Configuration, Main Application & Test Setup

### 4.1 `backend/requirements.txt`
All required libraries are present:
- `fastapi==0.115.6`, `uvicorn[standard]==0.32.1`
- `supabase`, `asyncpg==0.30.0`
- `openai==1.59.3`
- `stripe`, `squareup==39.0.0.20241120`
- `pydantic==2.10.4`, `pydantic-settings==2.7.0`
- `pytest==8.3.4`, `pytest-asyncio==0.25.0`, `pytest-mock==3.12.0`
No new dependencies are required; `pip install -r requirements.txt` will succeed with exit code 0.

### 4.2 `backend/main.py` Router Registration Plan
Current routers in `backend/main.py:50-58`:
```python
app.include_router(voice.router,       prefix="/api/voice",       tags=["voice"])
app.include_router(orders.router,      prefix="/api/orders",      tags=["orders"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])
app.include_router(billing.router,     prefix="/api/billing",     tags=["billing"])
app.include_router(messages.router,    prefix="/api/messages",    tags=["messages"])
```
Proposed router additions:
```python
from app.api import staff, integrations

app.include_router(staff.router,        prefix="/api/staff",        tags=["staff"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
```
And inside `app/api/voice.py`:
Add `@router.post("/generate-greeting")` and `@router.post("/greeting")`.

### 4.3 Test Suite Architecture (`backend/tests/`)
Existing test structure:
- `backend/tests/conftest.py`: Mocks `get_db()`, `get_redis()`, sets environment variables.
- `backend/tests/api/test_voice.py`: Tests voice webhook endpoints.
- `backend/tests/unit/test_order_api.py`: Tests endpoints with `TestClient(app)` and mocked dependencies.
Required new tests:
1. `backend/tests/unit/test_greeting.py`:
   - Test LLM greeting generation when OpenAI returns text.
   - Test fallback greeting generation when `OPENAI_API_KEY` is absent.
   - Test fallback greeting generation when OpenAI raises `APIConnectionError` or `RateLimitError`.
2. `backend/tests/unit/test_staff.py`:
   - Test `POST /api/staff/invite` successfully creates/invites user and inserts `restaurant_users` row.
   - Test `GET /api/staff` returns staff members joined with user profiles.
3. `backend/tests/unit/test_integrations.py`:
   - Test `POST /api/integrations` saves Square/Stripe/Twilio/Shopify credentials to `restaurant_integrations`.
   - Test `GET /api/integrations` returns masked API keys.
   - Test `DELETE /api/integrations/{provider}` deletes record.
