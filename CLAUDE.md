# TalkByte AI — Claude Code Project

> AI phone ordering system for Australian restaurants.
> Caller rings → AI answers → takes order → sends SMS payment link → pushes to POS.

---

## Status: Pre-Sprint 1 (User Research Week)

User research is running in parallel. **Do not start Sprint 1 code until research is complete** unless told otherwise. All architectural decisions below are final — do not re-research.

---

## What Has Already Been Built (Do Not Recreate)

| File | Contents |
|------|----------|
| `talkbyte-production-plan.html` | Full production blueprint, 25 test scenarios, 5-year roadmap |
| `talkbyte-admin-panel.html` | Operator admin panel (static HTML prototype) |
| `talkbyte-user-research-plan.html` | 7-day research sprint, interview guides, surveys |
| `talkbyte-restaurant-dashboard.html` | Restaurant owner/staff dashboard prototype |
| `docs/LOCAL_DEV_SETUP.md` | Local development setup guide |
| `docs/DEPLOYMENT.md` | Production deployment guide |
| `docs/ORACLE_CLOUD_SETUP.md` | Oracle Cloud Free Tier configuration |
| `docs/DAILY_DEMO_INSTRUCTIONS.md` | Daily demo quick reference |

---

## Final Tech Stack (Validated — Do Not Change)

### Voice Pipeline — Option A (default, start here)
```
Telnyx → LiveKit Agents → Deepgram Flux STT → GPT-4.1 → ElevenLabs TTS
Latency: 350–600ms E2E
```
### Voice Pipeline — Option B (A/B test in Sprint 2)
```
Telnyx → LiveKit → gpt-realtime-2.1-mini (native speech-to-speech)
Latency: 200–350ms E2E
```

| Layer | Choice | Reason |
|-------|--------|--------|
| **Telephony** | Telnyx | $0.018/min AU mobile vs Twilio $0.050/min (64% cheaper). Own IP network. |
| **Voice Orchestration** | LiveKit Agents (Python SDK) | Apache 2.0, WebRTC, native Telnyx SIP integration |
| **STT** | Deepgram Flux | <70ms TTFT, best AU English accuracy, $0.0065/min |
| **LLM** | GPT-4.1 | Best function calling, reliable JSON output, Structured Outputs |
| **TTS** | ElevenLabs (Phase 1) | Best naturalness. Fish Speech self-hosted in Phase 2 to cut costs |
| **Backend** | FastAPI + Python 3.12 | #1 Python framework 2026, async-first, fastest DX |
| **Frontend** | Next.js 16 (App Router) | Largest AU hiring pool, stable Turbopack |
| **Database** | Supabase (Postgres 16 + pgvector) | Eliminates separate vector DB, built-in Auth + Realtime |
| **Cache / Queue** | Upstash Redis (serverless) | Celery broker + call session state, TTL 30min |
| **Payments** | Stripe Payment Links + Stripe Connect | No PCI scope on app, per-order links via SMS |
| **SMS** | Telnyx Messaging (same provider) | Unified billing, AU numbers included |
| **POS Primary** | Square (webhooks + REST) | Largest AU install base |
| **POS Secondary** | Lightspeed, Kounta | Phase 2 |
| **Styling** | shadcn/ui + Tailwind CSS v4 | |
| **State** | TanStack Query v5 + Zustand | |
| **Deployment** | Railway (backend) + Vercel (frontend) | |

---

## Call State Machine

```
GREETING → TAKING_ORDER → CONFIRMING → CONFIRMED → PAYMENT_SENT → COMPLETE

Error states:
  TRANSFER_TO_HUMAN   — caller requests human / 3 mishears
  CALL_DROPPED        — WebSocket disconnect mid-call
  POS_FAILED          — Square push failed after 3 retries → email fallback
  PAYMENT_EXPIRED     — Stripe link not opened in 30min
```

---

## Database Schema (Supabase / Postgres 16)

```sql
-- Core tables
restaurants (id uuid pk, name, phone_number, telnyx_number, plan, active, created_at)
restaurant_users (id uuid pk, restaurant_id fk, user_id fk, role)
menu_items (id uuid pk, restaurant_id fk, name, description, price, category,
            available bool, embedding vector(1536))   -- pgvector
calls (id uuid pk, restaurant_id fk, caller_number, state, started_at, ended_at,
       transcript jsonb, stt_confidence float)
orders (id uuid pk, call_id fk, restaurant_id fk, items jsonb, total_cents,
        state, pos_order_id, created_at)
payment_events (id uuid pk, order_id fk, stripe_payment_link, stripe_session_id,
                sent_at, paid_at, expires_at)
plans (id, name, monthly_cents, call_limit)
subscriptions (id, restaurant_id fk, plan_id fk, stripe_subscription_id,
               status, current_period_end)
```

**Menu RAG:** `text-embedding-3-small` → pgvector. Top-5 results per utterance injected into LLM context window.

---

## LLM System Prompt Structure

```
[STATIC — cached at session start]
You are an AI phone ordering assistant for {restaurant_name}.
You take orders clearly and confirm before finalising.
Today is {date}. Current time: {time}.
Restaurant closes at {closing_time}.

[RESTAURANT CONTEXT — cached per session]
Menu: {RAG top-5 items for current utterance}
Special instructions: {restaurant.ai_instructions}
Payment: Customer will receive SMS with payment link after order confirmed.

[CALL STATE — updated each turn]
Current state: {state}
Items in order: {order_items_so_far}
```

---

## Project Structure

```
talkbyte/
├── CLAUDE.md                    ← you are here
├── .claude/
│   └── settings.json
├── docs/                        ← all HTML prototypes + SRS (do not edit)
├── backend/
│   ├── main.py                  ← FastAPI app entry
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/
│       │   ├── voice.py         ← Telnyx webhook + LiveKit call handler
│       │   ├── orders.py        ← order CRUD
│       │   ├── restaurants.py   ← restaurant management
│       │   ├── payments.py      ← Stripe webhook + payment link generation
│       │   └── admin.py         ← admin endpoints
│       ├── services/
│       │   ├── livekit_agent.py ← LiveKit Agents pipeline
│       │   ├── stt.py           ← Deepgram Flux WebSocket
│       │   ├── llm.py           ← GPT-4.1 with function calling
│       │   ├── tts.py           ← ElevenLabs streaming
│       │   ├── pos/
│       │   │   ├── square.py    ← Square POS integration
│       │   │   └── base.py      ← POS interface (Strategy pattern)
│       │   ├── rag.py           ← pgvector menu search
│       │   └── sms.py           ← Telnyx SMS (payment links)
│       ├── models/
│       │   ├── call.py          ← Call state machine
│       │   ├── order.py
│       │   └── restaurant.py
│       ├── db/
│       │   ├── supabase.py      ← Supabase client
│       │   └── redis.py         ← Upstash Redis client
│       └── workers/
│           └── celery_app.py    ← Celery tasks (POS retry, payment expiry)
└── frontend/
    ├── package.json
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── (restaurant)/    ← restaurant dashboard routes
        │   └── (admin)/         ← admin panel routes
        ├── components/
        └── lib/
```

---

## Sprint 1 — Voice Pipeline MVP (Weeks 1–2)

**Goal:** Caller rings AU number → AI greets, takes order → order saved to DB → call ends.
No payment, no POS yet.

### Tasks in order:
1. [ ] Telnyx account + AU number + SIP trunk config
2. [ ] FastAPI skeleton (`main.py`, health check, CORS)
3. [ ] Supabase project — run schema SQL above
4. [ ] LiveKit Cloud account + `livekit-agents` Python SDK setup
5. [ ] Telnyx → LiveKit SIP bridge (inbound call webhook → LiveKit room)
6. [ ] Deepgram Flux WebSocket STT (`app/services/stt.py`)
7. [ ] GPT-4.1 integration — hardcoded test menu, no RAG yet (`app/services/llm.py`)
8. [ ] ElevenLabs TTS streaming (`app/services/tts.py`)
9. [ ] Call state machine: GREETING → TAKING_ORDER → CONFIRMING → CONFIRMED
10. [ ] Save call + order to Supabase on completion
11. [ ] Test: call AU number, order 2 items, hear confirmation
12. [ ] Latency measurement — target <600ms E2E

### Key env vars needed for Sprint 1:
```
TELNYX_API_KEY
TELNYX_SIP_CONNECTION_ID
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
DEEPGRAM_API_KEY
OPENAI_API_KEY
ELEVENLABS_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## Sprint 2 — Payments + POS (Weeks 3–4)

1. Stripe account + Payment Links API
2. Telnyx SMS after order confirmed (payment link in body)
3. Stripe webhook → update payment_events table
4. Square POS integration (OAuth + order push)
5. Celery worker for POS retry (3× exponential backoff → email fallback)
6. pgvector menu RAG (replace hardcoded menu)
7. Full state machine including PAYMENT_SENT → COMPLETE

---

## Sprint 3 — Restaurant Dashboard (Weeks 5–6)

Prototype already exists at `docs/talkbyte-restaurant-dashboard.html`.
Build as Next.js 16 app using that HTML as the reference design.

---

## Sprint 4 — Admin Panel (Weeks 7–8)

Prototype at `docs/talkbyte-admin-panel.html`.
Build as Next.js 16 app with real Supabase data.

---

## Key Architectural Decisions (Do Not Reverse)

1. **Telnyx over Twilio** — cost target requires <$0.025/min all-in. Twilio makes this impossible.
2. **LiveKit over custom WebSocket** — SIP bridging, agent framework, auto-reconnect all built in.
3. **Supabase over separate Postgres + Qdrant** — pgvector eliminates the vector DB, Supabase Auth handles multi-tenant restaurant access.
4. **Upstash Redis over self-hosted** — serverless, zero ops. Call session TTL = 30min.
5. **Stripe Payment Links over payment terminal** — customers pay on their own phone, no hardware needed at restaurant.
6. **Email fallback for POS failures** — Square is not 100% reliable. Print email as order slip.
7. **Strategy pattern for POS** — `base.py` interface so Square / Lightspeed / Kounta are swappable.

---

## WhatsApp Decision (Pending Research)

Research question: Do AU customers prefer WhatsApp or SMS for payment links?

- If ≥60% prefer WhatsApp → build WhatsApp Business API **before** SMS in Sprint 2
- If 40–60% → build both simultaneously
- If <40% → SMS only for now, WhatsApp in Phase 2

**This decision gates Sprint 2 payment implementation.** Check research findings before starting Sprint 2.

---

## WTP / Pricing (Pending Research Validation)

Hypothesis: Restaurants pay $149–$299/month (tiered by call volume).
Revenue share: 1–2% of order value (secondary).
Do not finalise pricing until interview data confirms WTP.

---

## Target Metrics (Sprint 1 Exit Criteria)

| Metric | Target |
|--------|--------|
| E2E call latency | <600ms (Option A), <400ms (Option B) |
| STT accuracy | >95% on AU English |
| Order capture rate | >90% in happy path |
| Call drop rate | <2% |

---

## Useful Links (fill in when accounts are created)

- Telnyx Portal: https://portal.telnyx.com
- LiveKit Cloud: https://cloud.livekit.io
- Deepgram Console: https://console.deepgram.com
- Supabase Dashboard: https://supabase.com/dashboard
- Upstash Console: https://console.upstash.com
- Stripe Dashboard: https://dashboard.stripe.com
- Railway: https://railway.app
- Vercel: https://vercel.com

---

## Contact

Project owner: A (ajayspi@gmail.com)
