# Task Assignment: Worker M4 (Playwright E2E Testing Suite Implementation)

**Role**: teamwork_preview_worker
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m4
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
**Playwright Blueprint**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_survey_frontend_billing_playwright\analysis.md
**Parent Conversation ID**: b49662ee-22a2-47ec-a9cb-7ce83bdfa26f

## Exclusive Write Ownership
You exclusively own:
- `frontend/package.json`
- `frontend/playwright.config.ts`
- `frontend/e2e/owner-login.spec.ts`
- `frontend/e2e/menu-availability.spec.ts`
- `frontend/e2e/admin-login.spec.ts`
- `frontend/e2e/billing.spec.ts` (bonus)
- `frontend/__tests__/restaurant-dashboard.test.tsx` (syncing legacy prototype assertions to official SaaS plans)

## Instructions
1. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
2. Read `.agents/explorer_survey_frontend_billing_playwright/analysis.md § 3` carefully.
3. In `frontend/package.json`:
   - Add `@playwright/test: "^1.50.0"` to `devDependencies`.
   - Add `"test:e2e": "playwright test"` to `scripts`.
   - Run `npm install` in `frontend/` using `run_command` if needed, or ensure Playwright dependencies are present.
4. Create `frontend/playwright.config.ts`:
   - Configure for single worker, baseURL `http://127.0.0.1:3000`, testDir `./e2e`, timeout 30s, expect timeout 5s.
   - Use webServer pointing to `npm run dev` on port 3000 (with `reuseExistingServer: true`).
5. Implement the 3 required journeys in `frontend/e2e/`:
   - `frontend/e2e/owner-login.spec.ts`:
     - Restaurant owner login (`/login`) -> navigates to `/dashboard`.
     - Verifies dashboard title, KPI cards ("Calls Today", "Revenue Today"), recent orders, active calls.
     - Uses mock auth session route interception for `**/auth/v1/**` so the test is 100% resilient offline and in CI.
   - `frontend/e2e/menu-availability.spec.ts`:
     - Navigates to `/dashboard?tab=menu`.
     - Selects first menu item, toggles availability switch.
     - Verifies badge updates between "Available" and "Unavailable" and verifies toast notification.
     - Toggles again to verify it flips back.
   - `frontend/e2e/admin-login.spec.ts`:
     - Operator admin login (`/admin/login`) -> navigates to `/admin`.
     - Navigates to Fleet / Restaurants view (`/admin?tab=restaurants` or clicks sidebar).
     - Verifies fleet table loads and displays rows ("Mama's Pizzeria", "Thai Express", "Burger Palace") with columns ("Calls/mo", "MRR", "Status").
   - (Optional bonus: `frontend/e2e/billing.spec.ts` verifying `/dashboard/billing` loads with HTTP 200).
6. In `frontend/__tests__/restaurant-dashboard.test.tsx`:
   - Synchronize lines 263–303: update assertions from old prototype copy ($1,500, Pro, 1 September 2026) to the new official SaaS plans ($149 Starter, $249 Growth, $499 Enterprise) so `npm test` passes cleanly.
7. Run the tests:
   - Run `npx playwright test` (or `npm run test:e2e`) in `frontend/` using `run_command`. All 3 journeys must pass with exit code 0!
   - Run `npm test` in `frontend/` using `run_command`.
8. Document all commands and results in `handoff.md` and send completion report back to parent.

## 2026-09-14T06:01:24Z
You are worker_m4. Your working directory is c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m4.
Read DISPATCH.md in your working directory, ORIGINAL_REQUEST.md, PROJECT.md, and .agents/explorer_survey_frontend_billing_playwright/analysis.md § 3.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement Milestone M4:
1. Configure frontend/package.json (@playwright/test, test:e2e script).
2. Configure frontend/playwright.config.ts.
3. Implement the 3 required journeys in frontend/e2e/:
   - owner-login.spec.ts (restaurant owner login -> dashboard loads)
   - menu-availability.spec.ts (menu item availability toggle updates correctly)
   - admin-login.spec.ts (operator admin login -> restaurants list loads)
4. Synchronize frontend/__tests__/restaurant-dashboard.test.tsx (lines 263-303) with new official SaaS plan copy ($149 Starter, $249 Growth, $499 Enterprise).
5. Run `npx playwright test` in frontend/ using run_command and verify exit code 0. Also run `npm test`.
6. Write your handoff.md and send completion report back to parent (b49662ee-22a2-47ec-a9cb-7ce83bdfa26f).
