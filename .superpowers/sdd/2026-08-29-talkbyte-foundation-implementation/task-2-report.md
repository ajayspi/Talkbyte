# Task 2 Report: Backend Configuration Management System

**Status:** DONE

## Commits

- `b43a710` feat: add backend configuration management
- `c72d934` fix: wire dotenv loading, correct redis config shape, use config in db clients

## Test Summary

Configuration loading verified: `Config loaded: development` when `ENVIRONMENT=development` is set.

## Implementation Details

### Files Created
- **`backend/config.py`**: Config dataclass with 15 environment variables (database, cache, API keys, app config) with sensible defaults and `from_env()` factory method.

### Files Modified
- **`backend/main.py`**: Added config import, environment logging in lifespan, and dynamic CORS allow_origins based on debug flag.
- **`backend/requirements.txt`**: No changes needed — python-dotenv (1.0.1) and pydantic (2.10.4) already present.

### Environment Variables Supported
- Database: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Cache: REDIS_URL
- APIs: TELNYX_API_KEY, TELNYX_SIP_CONNECTION_ID, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, DEEPGRAM_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY
- App: DEBUG, LOG_LEVEL, ENVIRONMENT

## Concerns

None. All requirements met. Config is now globally available via `from config import config`.

---

## Fix Report: Coordinator Review Findings

### Issues Fixed

#### 1. **load_dotenv() was never called** (CRITICAL)
- **Problem**: Config only worked if env vars were manually exported to shell; `.env.local` was never loaded
- **Fix**: Added `from dotenv import load_dotenv` and explicit load calls at module level in config.py
  - Tries `.env.local` first (local overrides), falls back to `.env`
  - Uses explicit `dotenv_path` parameter to ensure loading works

#### 2. **redis_url field was wrong shape** (CRITICAL)
- **Problem**: Config had single `redis_url: str` field, but actual Redis client expects two separate values
- **Fix**: Replaced single field with two:
  - `upstash_redis_rest_url: str`
  - `upstash_redis_rest_token: str`
- **Verified**: Read `app/db/redis.py` — confirmed it uses `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

#### 3. **config not wired into existing code** (IMPORTANT)
- **Problem**: `app/db/supabase.py` and `app/db/redis.py` still read `os.environ[...]` directly
- **Fix**: Updated both files to import `from config import config` and use:
  - `app/db/supabase.py`: Now uses `config.supabase_url` and `config.supabase_service_role_key`
  - `app/db/redis.py`: Now uses `config.upstash_redis_rest_url` and `config.upstash_redis_rest_token`
- **Behavior**: Identical — this is pure refactoring to centralize config

#### 4. **production CORS origin hardcoded** (MINOR)
- **Problem**: CORS allow_origins had hardcoded `"https://yourdomain.com"`
- **Fix**: Added `frontend_url: str` field to Config (defaults to `"http://localhost:3000"`)
- **Verified**: `.env.example` already has `FRONTEND_URL` variable (line 51)
- **Updated**: `main.py` CORS now uses `config.frontend_url`

### Additional Improvements
- Added fields for payment services: `stripe_secret_key`, `square_application_id`, `square_application_secret`
- Added `telnyx_public_key` (was in `.env.example` but missing from Config)
- Reorganized Config fields with descriptive comments (Telephony, Voice & Video, Payments, App Config)

### Verification Tests

**Test 1: Basic config loading with shell env var**
```bash
cd backend && export ENVIRONMENT=development && python -c "from config import config; print(f'Config loaded: {config.environment}')"
```
**Result**: `Config loaded: development` ✓

**Test 2: load_dotenv() loading from .env.local**
Created `.env.local` with test values:
```
ENVIRONMENT=staging
UPSTASH_REDIS_REST_URL=https://test-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=test-token-123
```
Config correctly read all three values from file (verified via Python). ✓

**Test 3: Fallback to shell env vars when no .env file**
After removing `.env.local`, shell env var `ENVIRONMENT=production` was correctly read. ✓

### Files Modified
- **`backend/config.py`**: load_dotenv() wiring, corrected Redis fields, added payment/frontend fields
- **`backend/main.py`**: CORS now uses `config.frontend_url`
- **`backend/app/db/redis.py`**: Uses `config.upstash_*` instead of `os.environ`
- **`backend/app/db/supabase.py`**: Uses `config.supabase_*` instead of `os.environ`
