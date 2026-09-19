# Task Assignment: Milestone M1 — Restore Missing Auth Pages (R4)

**Role**: teamwork_preview_worker
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m1_auth
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## File Ownership
You exclusively own:
- `frontend/src/app/(auth)/**` (`layout.tsx`, `login/page.tsx`, `signup/page.tsx`, `admin/login/page.tsx`, `admin/signup/page.tsx`)
- `frontend/src/lib/supabase-browser.ts`
- `frontend/src/lib/supabase-server.ts`
- `frontend/src/lib/supabase-middleware.ts`
- `frontend/src/app/auth/callback/route.ts`
- `frontend/src/proxy.ts`
- `frontend/__tests__/auth-routes.test.tsx`
- Cleanup of conflicting directories: `frontend/src/app/login/` and `frontend/src/app/(admin)/admin/login/`

---

## Technical Context & Instructions
Carefully read the synthesized analyses from the 3 Explorers:
- `.agents/explorer_m1_git/analysis.md` & `handoff.md`
- `.agents/explorer_m1_auth_routes/analysis.md` & `handoff.md`
- `.agents/explorer_m1_supabase_auth/analysis.md` & `handoff.md`

### Implementation Steps:
1. **Restore or Checkout Files from Commit `f211cdf`**:
   The authoritative files exist in git commit `f211cdf`. Either run:
   ```bash
   git checkout f211cdf -- frontend/src/app/(auth)/ frontend/src/lib/supabase-browser.ts frontend/src/lib/supabase-server.ts frontend/src/lib/supabase-middleware.ts frontend/src/app/auth/callback/route.ts frontend/src/proxy.ts
   ```
   Or write the verified blueprints provided in `.agents/explorer_m1_git/analysis.md` and `.agents/explorer_m1_supabase_auth/analysis.md`.
2. **Remove Route Collisions**:
   Remove the conflicting directories:
   - `frontend/src/app/login/`
   - `frontend/src/app/(admin)/admin/login/`
   (They collide with `(auth)/login` and `(auth)/admin/login`, which will cause Next.js build errors).
3. **Verify Auth Client Implementation**:
   Ensure `supabase-browser.ts`, `supabase-server.ts`, and `supabase-middleware.ts` use `@supabase/supabase-js` without requiring `@supabase/ssr` (which is not installed in `package.json`).
   Ensure `supabase-server.ts` awaits `cookies()` if in Next.js 16.
4. **Create Auth Route Tests**:
   Create `frontend/__tests__/auth-routes.test.tsx` to verify:
   - `/login` renders email, password inputs, submit button.
   - `/signup` renders restaurant name, email, password inputs.
   - `/admin/login` renders operator email, password inputs.
   - `/admin/signup` renders operator name, corporate email, password, invite code inputs.
5. **Run Verification**:
   - `npm test -- frontend/__tests__/auth-routes.test.tsx` (all pass)
   - `npm test` (all 5 test suites pass)
   - `npm run build` in `frontend/` (exits with code 0, static pages `/login`, `/signup`, `/admin/login`, `/admin/signup` generated)

Write your full execution report to `handoff.md` in your working directory and notify the orchestrator via `send_message`.

## 2026-09-14T00:45:49Z
Task:
1. Restore all required files from commit f211cdf or write authentic implementations based on the blueprints in .agents/explorer_m1_git/analysis.md and .agents/explorer_m1_supabase_auth/analysis.md:
   - frontend/src/app/(auth)/layout.tsx
   - frontend/src/app/(auth)/login/page.tsx
   - frontend/src/app/(auth)/signup/page.tsx
   - frontend/src/app/(auth)/admin/login/page.tsx
   - frontend/src/app/(auth)/admin/signup/page.tsx
   - frontend/src/lib/supabase-browser.ts
   - frontend/src/lib/supabase-server.ts
   - frontend/src/lib/supabase-middleware.ts
   - frontend/src/app/auth/callback/route.ts
   - frontend/src/proxy.ts
2. Remove conflicting routes: frontend/src/app/login/ and frontend/src/app/(admin)/admin/login/ so that Next.js 16 does not have duplicate route errors.
3. Create frontend/__tests__/auth-routes.test.tsx covering all 4 auth pages.
4. Run npm test and npm run build in frontend/. Verify exit code 0.
5. Write your findings and test execution results to handoff.md in your working directory and notify the orchestrator via send_message.
