# Restaurant backend + restaurant dashboard

Independent operating unit. Tenant-facing: voice/orders/menu API + restaurant UI.

## What this is
Per-restaurant: inbound calls, orders, menu, billing for that venue.

## Backend code
`backend/` FastAPI.

| Path | Role |
|------|------|
| `backend/main.py` | App entry, CORS, routers |
| `backend/app/api/voice.py` | Telnyx / LiveKit |
| `backend/app/api/orders.py` | Order CRUD |
| `backend/app/api/restaurants.py` | Restaurant mgmt |
| `backend/app/api/payments.py` | Stripe links / webhooks |
| `backend/app/services/` | STT, LLM, TTS, POS, RAG, SMS |
| `backend/app/models/` | Call / order / restaurant |
| `backend/app/workers/celery_app.py` | POS retry, payment expiry |

**Out of scope for this unit:** `backend/app/api/admin.py` (operator).

## Restaurant UI
`frontend/src/app/(restaurant)/`

| Path | Role |
|------|------|
| `(restaurant)/layout.tsx` | Shell + 7 tabs |
| `(restaurant)/dashboard/page.tsx` | Overview, calls, orders, menu, analytics, billing, settings |

## Run
```
# API
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Dashboard
cd frontend
npm run dev
```
Dashboard: http://localhost:3000/dashboard

## Env (backend)
`TELNYX_*`, `LIVEKIT_*`, `DEEPGRAM_API_KEY`, `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `SUPABASE_*`, Stripe, Square. Template: `.env.example`. Never commit `.env`.

## Deploy
Railway: `backend/railway.toml`. Frontend restaurant routes on same Next app or split later.

## Individuality
Tenant-scoped. One restaurant at a time. No fleet-wide admin. Operator APIs stay in `operator-backend`.
