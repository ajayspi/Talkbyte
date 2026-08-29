# TalkByte Foundation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design and implement the complete development, testing, and deployment foundation for TalkByte AI — a production-ready, phased approach that enables fast local iteration (Sprints 1–2) and seamless production hardening (Sprints 3+).

**Architecture:** TalkByte uses a hybrid approach: full Docker Compose locally for development (Supabase + Redis + app stack), switching to managed services (Supabase Cloud + Upstash Redis) plus containerized app code for demo/production on Oracle Cloud Free tier. This balances developer velocity with production readiness.

**Tech Stack:** 
- Backend: FastAPI + Python 3.12
- Frontend: Next.js 16 + React 19 + TypeScript
- Database: Supabase (Postgres 16 + pgvector, locally via Docker, Cloud in prod)
- Cache/Queue: Redis (locally via Docker, Upstash in prod)
- Testing: pytest (backend), Vitest + Playwright (frontend)
- CI/CD: GitHub Actions
- Deployment: Oracle Cloud Free tier (2 ARM vCPUs, 12GB RAM always-free)
- Containers: Docker + Docker Compose

**Spec:** This plan implements the design approved in brainstorming on 2026-08-29. Foundation covers local dev setup, production deployment, testing, CI/CD, secret management, and error handling.

---

## Global Constraints

- **Solo developer** — architecture must be simple enough for one person to operate
- **Phased approach** — research-grade quality (Sprints 1–2), production-hardening (Sprints 3+)
- **Demo hosting** — 7am–12pm daily on Oracle Cloud Free tier
- **Tech stack locked** — GPT-4.1, Telnyx, LiveKit, Deepgram, ElevenLabs (per CLAUDE.md)
- **No external dependencies in local dev** — everything runs via Docker Compose
- **Production-ready patterns early** — use managed services in production to reduce ops burden

---

## Section 1: Local Development Setup

**Purpose:** Enable fast iteration locally without external dependencies. Developer runs `docker-compose up` once and has the entire stack.

### Services in docker-compose.yml

| Service | Port | Purpose |
|---------|------|---------|
| backend | :8000 | FastAPI server |
| frontend | :3000 | Next.js dev server |
| supabase | :5432 | PostgreSQL database |
| redis | :6379 | Redis cache/queue |
| supabase-studio | :54321 | Supabase admin UI |

### Configuration Files

**docker-compose.yml** (local):
- Backend: FastAPI container, volumes for hot reload
- Frontend: Next.js container, volumes for hot reload
- Supabase: Official Supabase Docker image with seed data
- Redis: Official Redis image
- Networks: internal Docker network for inter-service communication
- Environment: loaded from `.env.local`

**.env.local** (gitignored, user creates from template):
```
# Supabase (local)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<local-key>
SUPABASE_SERVICE_ROLE_KEY=<local-key>

# Redis (local)
REDIS_URL=redis://redis:6379

# External APIs (user provides keys)
TELNYX_API_KEY=<user-key>
TELNYX_SIP_CONNECTION_ID=<user-value>
LIVEKIT_URL=<user-value>
LIVEKIT_API_KEY=<user-key>
LIVEKIT_API_SECRET=<user-key>
DEEPGRAM_API_KEY=<user-key>
OPENAI_API_KEY=<user-key>
ELEVENLABS_API_KEY=<user-key>

# App config
DEBUG=true
LOG_LEVEL=debug
```

**.env.example** (checked in):
- Template with all required keys (no secrets)
- Users copy to `.env.local` and fill in their credentials

### Startup & Debugging

**Starting:**
```bash
docker-compose up --build
```

**Accessing services:**
- Backend API: http://localhost:8000 (docs at /docs)
- Frontend: http://localhost:3000
- Supabase UI: http://localhost:54321
- Redis CLI: `docker-compose exec redis redis-cli`

**Logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Stopping:**
```bash
docker-compose down
```

### Database Initialization

**Supabase seed data:**
- `backend/supabase_schema.sql` is automatically loaded on first startup
- Creates tables: restaurants, users, menu_items, calls, orders, payments, plans, subscriptions
- Adds sample restaurant for testing

**Migrations:**
- Future migrations: add `.sql` files to `backend/migrations/` directory
- Supabase Docker container runs them on startup

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local dev services |
| `backend/.env.example` | Environment template |
| `backend/.env.local` | User's local secrets (gitignored) |
| `frontend/.env.example` | Frontend env template |
| `frontend/.env.local` | Frontend local env (gitignored) |
| `docs/LOCAL_DEV_SETUP.md` | Detailed setup instructions |
| `backend/Dockerfile` | Backend container |
| `frontend/Dockerfile` | Frontend container |
| `backend/supabase_schema.sql` | Database schema (existing) |

---

## Section 2: Production/Demo Setup (Oracle Cloud Free Tier)

**Purpose:** Deploy to Oracle Cloud for daily demos (7am–12pm). Same app code, but with managed services to reduce Oracle VM resource usage.

### Architecture Change

| Component | Local Dev | Production/Demo |
|-----------|-----------|-----------------|
| Database | Supabase Docker | Supabase Cloud (free tier) |
| Cache/Queue | Redis Docker | Upstash Redis (free tier) |
| Backend | Docker Compose | Docker on Oracle VM |
| Frontend | Docker Compose | Docker on Oracle VM |

### Oracle Cloud Free Tier Setup (One-Time)

**Prerequisites:**
- Oracle Cloud free account (12-month free + $300 credit + always-free compute)
- 2 ARM vCPUs, 12GB RAM always-free compute instance

**Steps:**

1. **Create Supabase Cloud project:**
   - Sign up at supabase.com
   - Create project (free tier: 500MB database, 2GB bandwidth/month)
   - Get: Project URL + Service Role Key
   - Run schema SQL in Supabase dashboard

2. **Create Upstash Redis:**
   - Sign up at upstash.com
   - Create Redis database (free tier: 10,000 commands/day, 30MB storage)
   - Get: Connection string

3. **Create Oracle Compute Instance:**
   - Oracle Cloud Console → Compute → Instances
   - Image: Ubuntu 22.04 (free tier eligible)
   - Shape: VM.Standard.A1.Flex (2 ARM vCPUs, 12GB RAM)
   - Storage: 200GB (free tier)
   - Add public IP (free tier)

4. **Set up Oracle VM:**
   ```bash
   ssh ubuntu@<public-ip>
   
   # Install Docker
   sudo apt update && sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker ubuntu
   
   # Login to Oracle Container Registry
   sudo docker login -u <username> phx.ocir.io
   ```

### Deployment (Docker Images)

**docker-compose.prod.yml:**
```yaml
version: '3.8'
services:
  backend:
    image: phx.ocir.io/<namespace>/talkbyte-backend:latest
    ports:
      - "8000:8000"
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      REDIS_URL: ${REDIS_URL}
      # ... other env vars from .env.prod
  
  frontend:
    image: phx.ocir.io/<namespace>/talkbyte-frontend:latest
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_BACKEND_URL: http://<oracle-public-ip>:8000
```

**.env.prod** (stored securely, not in git):
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<key>
REDIS_URL=redis://default:<password>@<upstash-host>:6379
TELNYX_API_KEY=<key>
# ... other production keys
```

### Daily Demo Workflow (7am–12pm)

**Morning (7am):**
```bash
ssh ubuntu@<oracle-public-ip>

# Pull latest images
docker pull phx.ocir.io/<namespace>/talkbyte-backend:latest
docker pull phx.ocir.io/<namespace>/talkbyte-frontend:latest

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:8000/docs  # Backend API docs
curl http://localhost:3000       # Frontend
```

**During demo (7am–12pm):**
- Oracle VM running, public IP accessible
- Restaurant staff can call the Telnyx number
- Orders flow through backend → Supabase Cloud → frontend
- Data persists in Supabase Cloud + Upstash

**Afternoon (12pm):**
```bash
# Stop services (save Oracle compute costs)
docker-compose -f docker-compose.prod.yml down

# Data remains in Supabase Cloud + Upstash
```

### Continuous Deployment (GitHub Actions)

**Workflow:**
1. Push code to `main` branch
2. GitHub Actions builds Docker images
3. Pushes to Oracle Container Registry
4. Dev manually pulls + restarts on Oracle VM

**Files:**
- `.github/workflows/build-and-push.yml` — CI/CD pipeline

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `docker-compose.prod.yml` | Production config (managed services) |
| `.env.prod.example` | Production env template |
| `.github/workflows/build-and-push.yml` | Docker build + push to registry |
| `docs/ORACLE_CLOUD_SETUP.md` | Step-by-step Oracle setup |
| `docs/DAILY_DEMO_INSTRUCTIONS.md` | 7am–12pm checklist |
| `backend/Dockerfile` | Backend image definition |
| `frontend/Dockerfile` | Frontend image definition |

---

## Section 3: Testing Infrastructure

**Purpose:** Ensure code quality and catch bugs before deployment. Phased: basic tests in Sprints 1–2, comprehensive coverage by Sprint 3.

### Backend Testing (pytest)

**Structure:**
```
backend/
├── tests/
│   ├── unit/
│   │   ├── test_llm.py           ← test LLM service
│   │   ├── test_stt.py           ← test STT service
│   │   ├── test_tts.py           ← test TTS service
│   │   ├── test_rag.py           ← test RAG search
│   │   └── test_pos.py           ← test POS integration
│   ├── integration/
│   │   ├── test_voice_api.py     ← test voice endpoint
│   │   ├── test_orders_api.py    ← test orders CRUD
│   │   └── test_call_state.py    ← test state machine
│   ├── conftest.py               ← pytest fixtures
│   └── fixtures/
│       ├── mock_deepgram.py      ← mock Deepgram
│       ├── mock_openai.py        ← mock OpenAI
│       └── mock_telnyx.py        ← mock Telnyx
```

**Mocking external services:**
- Use `pytest-mock` to mock Telnyx, Deepgram, OpenAI, ElevenLabs
- Tests run in <1 second (no real API calls)
- Fixtures: hardcoded responses matching real API format

**Running:**
```bash
pytest backend/tests/ -v
pytest backend/tests/ --cov=app  # with coverage
```

### Frontend Testing (Vitest + Playwright)

**Unit tests (Vitest):**
```
frontend/__tests__/
├── unit/
│   ├── components/
│   │   ├── CallStatus.test.tsx
│   │   └── OrderForm.test.tsx
│   └── lib/
│       └── api.test.ts
```

**E2E tests (Playwright):**
```
frontend/__tests__/
├── e2e/
│   ├── call-flow.spec.ts         ← full call + order flow
│   └── dashboard.spec.ts         ← restaurant dashboard
```

**Running:**
```bash
npm run test                  # unit tests
npx playwright test          # E2E tests
npm run test:ui              # interactive UI
```

### CI/CD Testing (GitHub Actions)

**On every push to main:**
1. Run backend pytest
2. Run frontend Vitest
3. Check code coverage
4. Run linting (ESLint, black, flake8)
5. Build Docker images (no push yet)

**On PR:**
- Same checks
- Comment coverage delta on PR
- Block merge if tests fail

**On merge to main:**
- Build + push Docker images to Oracle Container Registry
- (Dev manually deploys to Oracle VM)

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `backend/tests/` | pytest suite |
| `backend/tests/conftest.py` | pytest fixtures + mocks |
| `frontend/__tests__/` | Vitest + Playwright tests |
| `frontend/vitest.config.ts` | Vitest configuration |
| `frontend/playwright.config.ts` | Playwright configuration |
| `.github/workflows/test.yml` | Test CI/CD pipeline |
| `pyproject.toml` | pytest configuration |
| `backend/requirements.txt` | Add pytest, pytest-cov, pytest-mock |
| `frontend/package.json` | Add vitest, playwright |

---

## Section 4: Project File Structure

**Complete directory tree:**

```
talkbyte/
├── .claude/
│   └── settings.json                   ← Claude Code config
├── .github/
│   └── workflows/
│       ├── test.yml                    ← Test CI/CD
│       └── build-and-push.yml          ← Docker build CI/CD
├── backend/
│   ├── main.py                         ← FastAPI entry point
│   ├── requirements.txt                ← Python dependencies
│   ├── Dockerfile                      ← Backend container
│   ├── .env.example                    ← Env template
│   ├── supabase_schema.sql             ← Database schema
│   ├── migrations/                     ← Future DB migrations
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── voice.py                ← Telnyx webhook + call handler
│   │   │   ├── orders.py               ← Orders CRUD
│   │   │   ├── restaurants.py          ← Restaurant management
│   │   │   ├── payments.py             ← Stripe webhooks
│   │   │   └── admin.py                ← Admin endpoints
│   │   ├── services/
│   │   │   ├── livekit_agent.py        ← LiveKit Agents pipeline
│   │   │   ├── stt.py                  ← Deepgram STT
│   │   │   ├── llm.py                  ← GPT-4.1 integration
│   │   │   ├── tts.py                  ← ElevenLabs TTS
│   │   │   ├── rag.py                  ← Menu RAG search
│   │   │   ├── sms.py                  ← Telnyx SMS
│   │   │   ├── logging.py              ← Structured logging
│   │   │   └── pos/
│   │   │       ├── base.py             ← POS interface
│   │   │       └── square.py           ← Square integration
│   │   ├── models/
│   │   │   ├── call.py                 ← Call state machine
│   │   │   ├── order.py                ← Order model
│   │   │   └── restaurant.py           ← Restaurant model
│   │   ├── db/
│   │   │   ├── supabase.py             ← Supabase client
│   │   │   └── redis.py                ← Redis client
│   │   └── workers/
│   │       └── celery_app.py           ← Celery task queue
│   └── tests/
│       ├── conftest.py                 ← Fixtures + mocks
│       ├── unit/
│       │   ├── test_llm.py
│       │   ├── test_stt.py
│       │   ├── test_tts.py
│       │   ├── test_rag.py
│       │   └── test_pos.py
│       └── integration/
│           ├── test_voice_api.py
│           ├── test_orders_api.py
│           └── test_call_state.py
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile                      ← Frontend container
│   ├── .env.example                    ← Env template
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/                ← Admin panel routes
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── [...slug]/
│   │   │   └── (restaurant)/           ← Restaurant routes
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       └── [...slug]/
│   │   ├── components/
│   │   │   ├── CallStatus.tsx
│   │   │   ├── OrderForm.tsx
│   │   │   ├── RestaurantDashboard.tsx
│   │   │   ├── AdminPanel.tsx
│   │   │   └── common/
│   │   └── lib/
│   │       ├── api.ts                  ← Backend API client
│   │       ├── hooks/
│   │       └── utils/
│   └── __tests__/
│       ├── unit/
│       │   └── components/
│       └── e2e/
├── docs/
│   ├── superpowers/
│   │   └── specs/
│   │       └── 2026-08-29-talkbyte-foundation-design.md  ← this file
│   ├── LOCAL_DEV_SETUP.md              ← Local dev guide
│   ├── ORACLE_CLOUD_SETUP.md           ← Oracle setup
│   └── DAILY_DEMO_INSTRUCTIONS.md      ← Demo checklist
├── docker-compose.yml                  ← Local dev stack
├── docker-compose.prod.yml             ← Production stack
├── .env.example                        ← Root env template
├── .gitignore
├── CLAUDE.md                           ← Project spec
└── README.md                           ← Project overview
```

---

## Section 5: Error Handling & Logging

**Purpose:** Ensure production visibility and graceful degradation when external services fail.

### Backend Error Handling

**Structured Logging (structlog):**
```python
import structlog
log = structlog.get_logger()

# Logs as JSON
log.info("call.started", call_id=call_id, restaurant_id=restaurant_id)
log.error("deepgram.timeout", call_id=call_id, latency_ms=elapsed_ms)
```

**API Error Responses:**
```python
# Consistent error format
{
  "error": "ORDER_TIMEOUT",
  "message": "Order confirmation timed out after 30 seconds",
  "details": {
    "call_id": "call_123",
    "state": "CONFIRMING"
  }
}
```

**Retry Strategy (Exponential Backoff):**
- Deepgram STT: 3 retries, 1s–8s delays
- OpenAI LLM: 3 retries, 1s–8s delays
- Square POS: 3 retries, 5s–60s delays + email fallback
- Telnyx SMS: 3 retries, 2s–30s delays

**Custom Exceptions:**
```python
class CallDropped(Exception):
    """WebSocket disconnected mid-call"""
    pass

class POSIntegrationError(Exception):
    """Square/Lightspeed order push failed"""
    pass
```

### Frontend Error Handling

**Error Boundaries:**
- Wrap CallStatus component
- Wrap OrderForm component
- Graceful fallback UI on error

**User-Facing Messages:**
- "Network error — retrying..."
- "Call dropped — please try again"
- "Order failed — please contact restaurant"

### Monitoring & Alerts (Research-Grade, Sprint 1–2)

**Logs:**
- All logs to stdout (JSON format)
- Docker captures to stdout
- Oracle Cloud Logging (free tier) aggregates

**Alerts (manual checks):**
- Email on critical errors
- Script to check call_drop_rate > 5%
- Script to check order_capture_rate < 90%

**Production-Grade (Sprint 3+):**
- Datadog or similar for dashboards
- Real-time latency tracking
- Order success rate by restaurant

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `backend/app/services/logging.py` | Structured logging setup |
| `backend/app/models/exception.py` | Custom exceptions |
| `backend/app/utils/retry.py` | Retry decorator |
| `backend/tests/test_error_handling.py` | Error handling tests |

---

## Section 6: Secret Management

**Purpose:** Safely store and load credentials without committing them to git.

### Local Development

**Template (.env.example, checked in):**
```
# Copy to .env.local and fill in YOUR credentials
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELNYX_API_KEY=
OPENAI_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
# ... etc
```

**Local Env (.env.local, gitignored):**
- User creates from template
- Populated with their API keys
- Loaded by docker-compose & FastAPI

**Loading in code:**
```python
import os
from dotenv import load_dotenv

load_dotenv()  # loads .env.local in dev, env vars in prod

TELNYX_API_KEY = os.getenv("TELNYX_API_KEY")
```

### Production (Oracle)

**Secret Storage:**
- Option 1: Oracle Cloud Vault (secure, recommended)
- Option 2: Environment variables (simpler, less secure)

**Loading in production:**
1. Operator logs into Oracle VM
2. Sets env vars: `export SUPABASE_URL=https://...`
3. Starts docker-compose: `docker-compose -f docker-compose.prod.yml up`
4. Containers read from environment

**Never:**
- Commit `.env.prod` to git
- Log credentials
- Expose keys in error messages

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `.env.example` | Env template (checked in) |
| `.env.prod.example` | Production env template |
| `.gitignore` | Ensure .env.* are ignored |
| `backend/config.py` | Config loading from env |

---

## Section 7: API Documentation & Monitoring

**Purpose:** Document endpoints for frontend devs and ops teams; track performance.

### API Documentation (Swagger/OpenAPI)

**Auto-generated by FastAPI:**
- Backend docs at: http://localhost:8000/docs
- Covers all endpoints, request/response schemas
- Interactive testing UI

**Manual docs:**
- `docs/API.md` — high-level overview
- API endpoints list
- Error codes reference
- Authentication flow

### Monitoring & Metrics (Research-Grade, Sprint 1–2)

**Key metrics:**
- Call latency (end-to-end)
- STT accuracy (confidence scores)
- Order capture rate (orders captured vs. calls)
- Call drop rate
- POS success rate

**Logging strategy:**
- Every call: log start, state transitions, end
- Every order: log creation, confirmation, payment
- Every error: log with context

**Dashboards (Sprint 3+):**
- Datadog or similar
- Real-time call count
- Latency percentiles (p50, p95, p99)
- Error rate by service

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `docs/API.md` | API reference |
| `backend/app/services/metrics.py` | Metrics collection |

---

## Implementation Sequence

This foundation is implemented across **multiple sprints**:

**Sprint 1 (Weeks 1–2): Local Dev + Basic Tests**
1. Docker Compose setup (Supabase, Redis, app services)
2. Environment configuration (.env files)
3. Basic pytest unit tests for services
4. Local dev documentation

**Sprint 2 (Weeks 3–4): Testing + CI/CD**
1. Frontend tests (Vitest, Playwright)
2. GitHub Actions CI/CD pipeline
3. Docker image build + registry push
4. Integration tests

**Sprint 3+ (Weeks 5+): Production Deployment**
1. Oracle Cloud setup (Supabase Cloud, Upstash Redis)
2. Docker deployment to Oracle VM
3. Production monitoring + logging
4. Daily demo workflow automation

---

## Approval Checklist

- [ ] Local dev setup (docker-compose, .env files) — makes sense?
- [ ] Production deployment (Oracle Cloud Free, managed services) — feasible?
- [ ] Testing infrastructure (pytest, Vitest, Playwright) — adequate?
- [ ] File structure (clear boundaries, single responsibility) — sound?
- [ ] Error handling + logging (structured, retry strategies) — comprehensive?
- [ ] Secret management (.env, no git commits) — secure?
- [ ] API docs + monitoring (swagger, metrics) — sufficient?

**All sections approved? Ready for implementation plan?**
