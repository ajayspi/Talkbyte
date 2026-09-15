# Task Assignment: Milestone M1 Iteration 2 Worker (Remediation & Build Verification)

**Role**: teamwork_preview_worker
**Working Directory**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\worker_m1_it2
**Scope Document**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\PROJECT.md
**Original Request**: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

---

## File Ownership
You exclusively own:
- `frontend/next.config.mjs`
- `frontend/src/app/auth/callback/route.ts`
- `frontend/src/lib/supabase-middleware.ts`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/signup/page.tsx`
- `frontend/src/app/(auth)/admin/login/page.tsx`
- `frontend/src/app/(auth)/admin/signup/page.tsx`
- `frontend/__tests__/auth-callback.test.ts`
- `frontend/__tests__/auth-routes.test.tsx`
- Removal of conflicting directories: `frontend/src/app/login/` and `frontend/src/app/(admin)/admin/login/`

---

## Tasks & Instructions
Read the three Iteration 2 Explorer reports:
- `.agents/explorer_m1_it2_cleanup/handoff.md`
- `.agents/explorer_m1_it2_security/handoff.md`
- `.agents/explorer_m1_it2_middleware_ui/handoff.md`

### 1. Remove Route Collisions
In `frontend/next.config.mjs`, add the automatic cleanup hook at the top before configuration export:
```js
import fs from 'node:fs';
import path from 'node:path';

// Clean legacy conflicting route stubs before Turbopack constructs route graph
['src/app/login', 'src/app/(admin)/admin/login'].forEach((dir) => {
  try {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  } catch {}
});
```
Also, delete the file `frontend/src/app/login/page.tsx` and `frontend/src/app/(admin)/admin/login/page.tsx` directly if possible, ensuring neither exists on disk.

### 2. Harden `frontend/src/app/auth/callback/route.ts`
Apply the secure drop-in code from `.agents/explorer_m1_it2_security/handoff.md`:
- Validate `next` starts with `/`, does NOT start with `//`, and contains no backslashes.
- Support role/type-based fallback to `/admin` or `/dashboard`.
- Enforce `redirectUrl.origin === origin`.
- Protect with nested `try/catch` so malformed URLs never throw unhandled 500 errors.

### 3. Fix Middleware Cookie Sync & Auth Form Error UI
- In `frontend/src/lib/supabase-middleware.ts`: mutate cookies directly on `res.cookies.set(...)` and `res.cookies.delete(...)` without reassigning `res = NextResponse.next(...)`.
- In `frontend/src/app/(auth)/login/page.tsx`, `signup/page.tsx`, `admin/login/page.tsx`, and `admin/signup/page.tsx`:
  - Invoke `setError(err?.message || 'Authentication failed')` in error handlers so users see feedback when credentials are invalid.

### 4. Create Security & Callback Unit Tests
Create `frontend/__tests__/auth-callback.test.ts` covering:
- Safe relative redirects (`/dashboard`, `/admin`).
- Open redirect rejection (`https://attacker.com` -> falls back safely to `/dashboard`).
- Protocol-relative bypass rejection (`//attacker.com`).
- Malformed URL handling (`http://`, whitespace, control characters).

### 5. Build and Test Verification
Run in `frontend/`:
- `npm test` (all test suites pass).
- `npm run build` (Next.js build succeeds with exit code 0, prerendering `/login`, `/signup`, `/admin/login`, `/admin/signup`, `/auth/callback`).

Write your findings to `handoff.md` in your working directory and notify orchestrator via `send_message`.

## 2026-09-14T01:04:08Z
Tasks:
1. In frontend/next.config.mjs, add the pre-route-graph cleanup hook to purge src/app/login and src/app/(admin)/admin/login on build, and directly delete those two legacy placeholder files/dirs.
2. In frontend/src/app/auth/callback/route.ts, implement strict URL validation against Open Redirect (CWE-601) and TypeError crashes per .agents/explorer_m1_it2_security/handoff.md.
3. In frontend/src/lib/supabase-middleware.ts, mutate cookies on the existing response object without reassigning res.
4. In all 4 auth pages (login, signup, admin/login, admin/signup), invoke setError on error.
5. Create frontend/__tests__/auth-callback.test.ts testing the callback security and routing.
6. Run npm test and npm run build in frontend/. Confirm exit code 0.
7. Write your execution report and verification results to handoff.md in your working directory and notify the orchestrator via send_message.
