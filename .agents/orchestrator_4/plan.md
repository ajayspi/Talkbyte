# Execution Plan — TalkByte R1-R4 Features

## Objective
Deliver production-ready features R1 (WhatsApp), R2 (Billing), R3 (Playwright E2E), and R4 (Auth Restoration) adhering strictly to the Dispatch-Only Orchestrator pattern and all Acceptance Criteria.

## Phase 0: Survey & Technical Exploration
- Spawn 3 parallel Explorers:
  1. `explorer_git_auth`: Inspect git commit objects for `0cb9c98` and `f211cdf`, locating exact paths and file contents to be restored for R4 (`frontend/src/app/(auth)/`, `frontend/src/lib/supabase-browser.ts`, `frontend/src/lib/supabase-server.ts`, `frontend/src/lib/supabase-middleware.ts`, `frontend/src/app/auth/callback/route.ts`, `frontend/src/proxy.ts`).
  2. `explorer_backend_whatsapp`: Inspect backend messaging layer, Telnyx SMS integration, Stripe payment link generation, Meta WhatsApp Cloud API requirements, and AU mobile number routing logic for R1.
  3. `explorer_frontend_billing_playwright`: Inspect `/dashboard/billing` requirements, Stripe webhook endpoints and Supabase schema (`restaurants.plan_id`), plan gating, and current Playwright / frontend test configuration for R2 & R3.

## Phase 1: Milestone M1 — Restore Missing Auth Pages (R4)
- Worker restores deleted files from `0cb9c98` and `f211cdf`.
- Verifies Next.js App Router routing for `/login`, `/signup`, `/admin/login`, `/admin/signup`.
- Reviewer + Challenger + Auditor gate.

## Phase 2: Milestone M2 — WhatsApp Business API Integration & SMS Fallback (R1)
- Worker implements Meta WhatsApp Business Cloud API client, detection of WhatsApp registration, and fallback to Telnyx SMS in backend.
- Python backend requirements / dependencies verified (`pip install -r requirements.txt`).
- Unit / integration test suite for AU mobile routing and failure fallback.
- Reviewer + Challenger + Auditor gate.

## Phase 3: Milestone M3 — SaaS Subscription Billing for Restaurants (R2)
- Worker implements `/dashboard/billing` page with plan cards (Starter, Growth, Pro), Stripe Checkout upgrade session, and billing history.
- Worker implements / updates Stripe Webhook handler for `customer.subscription.updated` updating `restaurants.plan_id`.
- Worker implements plan gating across premium dashboard features.
- Reviewer + Challenger + Auditor gate.

## Phase 4: Milestone M4 — Playwright End-to-End Testing Suite (R3)
- Worker implements Playwright configuration and test specs in `frontend/` covering:
  1. Restaurant owner login -> dashboard loads.
  2. Menu item availability toggle updates.
  3. Operator admin login -> restaurants list loads.
- Worker executes `npx playwright test` and verifies all 3 journeys pass.
- Reviewer + Challenger + Auditor gate.

## Phase 5: Milestone M5 — Final Verification & Git Publication
- Worker runs full frontend build (`npm run build` exits with code 0).
- Worker runs backend dependency check (`pip install -r requirements.txt` exits with code 0).
- Worker commits all changes to branch `claude/talkbyte-project-integration-fad989` and pushes to `origin`.
- Final audit and user handoff.
