# Operator backend + admin panel

Independent operating unit. Platform operator: fleet, revenue, infra, audit.

## What this is
TalkByte staff: all restaurants, live fleet, billing health, service telemetry.

## Backend code
`backend/app/api/admin.py` — `/api/admin`

Shared FastAPI process today (`backend/main.py` mounts admin router). Treat as separate product. Split process later if needed.

## Operator UI
`frontend/src/app/(admin)/`

| Path | Role |
|------|------|
| `(admin)/layout.tsx` | Admin shell, 9 views |
| `(admin)/admin/page.tsx` | Overview, live monitor, restaurants, users, revenue, billing, infra, audit, analytics |

Static prototype: `talkbyte-admin-panel.html` (root / docs). Do not treat as runtime.

## Run
Same API as restaurant (`uvicorn main:app --port 8000`).
Admin UI: http://localhost:3000/admin

Operator auth is not restaurant staff auth. Do not reuse restaurant session for admin.

## Env
Same backend secrets plus operator-only: service role, Stripe Connect platform keys. Never commit `.env`.

## Deploy
Same Railway backend until split. Admin routes: Vercel, protect with operator auth.

## Individuality
Cross-tenant. Fleet-wide. No menu editing for a single venue (that is restaurant-backend). Landing is unrelated.
