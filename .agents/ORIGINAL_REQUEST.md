# Original User Request

## Initial Request — 2026-09-03T06:30:45Z

Develop all pending frontend screens (Restaurant Dashboard, Operator Admin Panel) in Next.js 16 based on the existing HTML prototypes, wire them fully to the Supabase backend, update all documentation, and push to GitHub. Use a full team of agents for this heavy lifting.

Working directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989
Integrity mode: development

## Requirements

### R1. Next.js Restaurant Dashboard
Implement the Restaurant Dashboard in the `frontend` Next.js application based on the `talkbyte-restaurant-dashboard.html` prototype. It must integrate with the existing Supabase database.

### R2. Next.js Admin Panel
Implement the Admin Panel in the `frontend` Next.js application based on the `talkbyte-admin-panel.html` prototype. It must integrate with the existing Supabase database.

### R3. Documentation Update
Update `CLAUDE.md` and any relevant documentation to reflect that the frontend application is complete.

### R4. Version Control
Commit all changes and push them directly to the current remote branch (`origin`).

## Acceptance Criteria

### Build & Integration
- [ ] Running `npm install` and `npm run build` in the `frontend` directory succeeds with exit code 0.

### Documentation
- [ ] `CLAUDE.md` has been updated to mark Sprint 3 and Sprint 4 as complete.

### Version Control
- [ ] Running `git status` shows a clean working tree.
- [ ] Running `git diff origin/claude/talkbyte-project-integration-fad989` shows no differences (changes are successfully pushed).

## Follow-up — 2026-09-13T23:08:52Z

Implement three production-ready features for TalkByte, an AI voice ordering SaaS platform for restaurants, built on FastAPI (Python backend) + Next.js 16 App Router (React frontend) with Supabase as the database. All changes must be committed and pushed to the current remote branch.

Working directory: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989`
Integrity mode: demo

---

## Requirements

### R1. WhatsApp Business API Integration
After a restaurant customer completes an AI voice order, the system currently sends a Stripe Payment Link via Telnyx SMS. Extend the messaging layer so that if a phone number is detected to be registered on WhatsApp, the payment link is sent as a WhatsApp Business message instead of a plain SMS. If WhatsApp delivery fails or the number is not on WhatsApp, fall back to plain SMS. The backend integration must use the official Meta WhatsApp Business Cloud API.

### R2. SaaS Subscription Billing for Restaurants
Restaurant owners currently have no way to subscribe to a TalkByte plan inside the app. Build a billing screen within the restaurant owner portal (`/dashboard`) that lets owners view their current plan (Starter / Growth / Pro), upgrade via a Stripe Checkout session, and see their billing history. Supabase's `restaurants.plan_id` column must be updated automatically via a Stripe Webhook when a subscription is created or changed. Access to premium dashboard features must be gated based on `plan_id`.

### R3. Playwright End-to-End Testing Suite
Add an automated Playwright end-to-end test suite covering the critical user journeys for both the Restaurant Dashboard and the Operator Admin Panel. At minimum, tests must cover: (1) restaurant owner login → dashboard loads, (2) menu item availability toggle updates correctly, and (3) operator admin login → restaurants list loads. Tests must be runnable with a single command from the `frontend` directory.

### R4. Restore Missing Auth Pages
The frontend is currently missing its authentication pages (`/login`, `/signup`, `/admin/login`, etc.) which were accidentally deleted in a `git filter-branch` operation on the `jules-talkbyte-analysis` branch before it was merged. These pages existed in commit `0cb9c98` and `f211cdf` but were wiped in `6f87dd2`. Restore all deleted files from those commits: `frontend/src/app/(auth)/`, `frontend/src/lib/supabase-browser.ts`, `frontend/src/lib/supabase-server.ts`, `frontend/src/lib/supabase-middleware.ts`, `frontend/src/app/auth/callback/route.ts`, and `frontend/src/proxy.ts`.

---

## Acceptance Criteria

### Build & Type Safety
- [ ] Running `npm run build` in the `frontend` directory succeeds with exit code 0, no TypeScript errors.
- [ ] Running `pip install -r requirements.txt` in `backend` succeeds with exit code 0.

### WhatsApp Messaging (R1)
- [ ] A POST to the backend's internal messaging endpoint with an AU mobile number routes to WhatsApp delivery logic (verifiable by inspecting the code path and the Meta API call).
- [ ] If WhatsApp delivery raises an exception, the code falls back to SMS via the existing Telnyx integration.

### SaaS Billing (R2)
- [ ] `/dashboard/billing` route returns HTTP 200.
- [ ] The Stripe Webhook handler updates `restaurants.plan_id` in Supabase when a `customer.subscription.updated` event is received (verifiable via unit test or integration test).

### Auth Pages Restored (R4)
- [ ] HTTP GET to `/login`, `/signup`, `/admin/login`, and `/admin/signup` on the built Next.js app return HTTP 200 (not 404).

### Playwright Tests (R3)
- [ ] Running `npx playwright test` from the `frontend` directory exits with code 0, with all 3 required journeys passing.

### Version Control
- [ ] `git status` shows a clean working tree.
- [ ] All changes are pushed to `origin/claude/talkbyte-project-integration-fad989`.
