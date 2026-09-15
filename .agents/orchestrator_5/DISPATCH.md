## 2026-09-14T00:20:00Z

You are the Project Orchestrator (orchestrator_5) for TalkByte.
Previous orchestrator (orchestrator_4) was terminated due to a 429 rate limit error during the initial survey phase.
Comprehensive survey artifacts already exist in:
- .agents/explorer_survey_backend_whatsapp/analysis.md (complete survey of WhatsApp Business Cloud API & Telnyx SMS fallback)
- .agents/explorer_survey_frontend_billing_playwright/analysis.md (complete survey of /dashboard/billing, Stripe webhook updating restaurants.plan_id, plan feature gating, and Playwright E2E suite)

Workspace root: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989
Working directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\orchestrator_5
Authoritative request file: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md (and .agents/ORIGINAL_REQUEST.md)

User Request Summary & Acceptance Criteria:
1. R1. WhatsApp Business API Integration:
   - Extend messaging layer: if recipient phone number is registered on WhatsApp, send Stripe Payment Link via WhatsApp Business Cloud API.
   - If WhatsApp delivery fails or number is not on WhatsApp, fall back to plain SMS (Telnyx).
   - Backend endpoint POST with AU mobile routes to WhatsApp delivery logic and falls back on exception.
2. R2. SaaS Subscription Billing for Restaurants:
   - Build /dashboard/billing screen letting owners view current plan (Starter/Growth/Pro), upgrade via Stripe Checkout session, and see billing history.
   - Stripe Webhook handler updating restaurants.plan_id in Supabase when customer.subscription.updated event is received.
   - Gate premium dashboard features based on plan_id.
   - /dashboard/billing returns HTTP 200.
3. R3. Playwright End-to-End Testing Suite:
   - Automated suite in frontend/ covering: (1) restaurant owner login -> dashboard loads, (2) menu item availability toggle updates correctly, (3) operator admin login -> restaurants list loads. Single command runnable (npx playwright test) exiting with 0.
4. R4. Restore Missing Auth Pages:
   - Restore deleted files from commits 0cb9c98 and f211cdf:
     frontend/src/app/(auth)/, frontend/src/lib/supabase-browser.ts, frontend/src/lib/supabase-server.ts, frontend/src/lib/supabase-middleware.ts, frontend/src/app/auth/callback/route.ts, and frontend/src/proxy.ts.
   - Ensure /login, /signup, /admin/login, /admin/signup return HTTP 200 (not 404).
5. Build & Type Safety & Git:
   - npm run build in frontend/ succeeds with exit code 0.
   - pip install -r requirements.txt in backend/ succeeds with exit code 0.
   - Clean working tree, all changes committed and pushed to origin/claude/talkbyte-project-integration-fad989.
