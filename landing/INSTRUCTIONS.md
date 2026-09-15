# Landing — public marketing site

Independent operating unit. Marketing pages only. No restaurant dashboard. No operator admin.

## What this is
Public TalkByte site: hero, how-it-works, pricing, contact, privacy, terms.

## Code (do not duplicate)
Lives in `frontend/` of this repo.

| Path | Role |
|------|------|
| `frontend/src/app/page.tsx` | Home / landing |
| `frontend/src/app/how-it-works/page.tsx` | How it works |
| `frontend/src/app/pricing/page.tsx` | Pricing |
| `frontend/src/app/contact/page.tsx` | Contact |
| `frontend/src/app/privacy/page.tsx` | Privacy |
| `frontend/src/app/terms/page.tsx` | Terms |
| `frontend/public/landing.html` | Static landing |
| `frontend/src/app/globals.css` | Brand tokens |
| `frontend/next.config.mjs` | Next config |

**Out of scope:** `frontend/src/app/(restaurant)/`, `frontend/src/app/(admin)/`.

## Run
```
cd frontend
npm install
npm run dev
```
Open http://localhost:3000

## Env
Copy `frontend/.env.local` from `.env.example`. Public keys only (`NEXT_PUBLIC_*`). Never commit `.env`.

## Deploy
Vercel, root `frontend/`. Production: marketing routes only.

## Individuality
Landing does not call restaurant APIs. Does not share operator auth. Isolated product surface.
