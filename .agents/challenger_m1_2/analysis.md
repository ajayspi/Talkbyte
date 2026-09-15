# Adversarial Stress Test Analysis: Auth Pages & Route Logic

**Subagent**: `challenger_m1_2` (Empirical Challenger)  
**Milestone**: M1 (Restore Missing Auth Pages & Auth Route Logic)  
**Date**: 2026-09-14  
**Verdict**: **REJECT**

---

## 1. Executive Summary

As an Empirical Challenger, we conducted a rigorous adversarial challenge against the 4 restored authentication pages (`/login`, `/signup`, `/admin/login`, `/admin/signup`), the OAuth/PKCE callback route handler (`/auth/callback`), and the underlying Supabase authentication integration.

### Core Empirical Findings:
1. **FATAL BUILD FAILURE (Exit Code 1)**: Directly executing `npm.cmd run build` fails immediately under Next.js 16 / Turbopack with 2 parallel route collisions (`/(auth)/login` vs `/login`, and `/(auth)/admin/login` vs `/(admin)/admin/login`). The previous worker left duplicate placeholder directories intact, preventing production builds.
2. **SECURITY: Open Redirect Vulnerability in `/auth/callback` (CWE-601)**: The callback route handler unconditionally evaluates `new URL(next, origin)`. When `next` is an external absolute URL (e.g. `https://attacker.com`), the Web URL parser ignores `origin` and issues an HTTP 307 redirect to the external attacker site.
3. **CRASH RISK: Unhandled Exception on Malformed `next` in `/auth/callback` (HTTP 500)**: If `next` contains an invalid URL scheme (e.g. `http://` or malformed URI), `new URL(next, origin)` throws an unhandled `TypeError` outside of any `try/catch` block, causing a 500 crash.
4. **UX / SILENT ERROR SWALLOWING**: All 4 auth forms (`/login`, `/signup`, `/admin/login`, `/admin/signup`) catch Supabase auth errors (invalid credentials, rate limiting, duplicate accounts) and unconditionally redirect to `/dashboard` or `/admin` due to an aggressive offline demo fallback. The error display container (`{error && <div>{error}</div>}`) is dead code because `setError` is never invoked in any submit handler.
5. **MISSING RBAC ENFORCEMENT ON ADMIN LOGIN**: `/admin/login` calls `signInWithPassword` and unconditionally pushes to `/admin` without verifying whether the user has the `operator_admin` role. In addition, no Next.js `middleware.ts` exists to guard `/admin` routes.

---

## 2. Empirical Verification Results

### Test 1: Production Build Execution (`npm.cmd run build`)
- **Command Executed**: `npm.cmd run build` in `frontend/`
- **Tool**: `run_command` (Background task `3da2c667-0b39-4469-b1ea-4ff427844747/task-40`)
- **Exit Code**: `1` (FAILURE)
- **Verbatim Output**:
```text
> talkbyte-frontend@0.1.0 build
> next build

▲ Next.js 16.3.3 (Turbopack)
✓ Running next.config.mjs took 173ms

  Creating an optimized production build ...

> Build error occurred
Error: Turbopack build failed with 2 errors:
./src/app/(auth)
Error: You cannot have two parallel pages that resolve to the same path. Please check /(admin)/admin/login and /(auth).

./src/app/login
Error: You cannot have two parallel pages that resolve to the same path. Please check /(auth)/login and /login.

    at ignore-listed frames
```
- **Analysis**:
  Next.js App Router ignores route group parentheses `(auth)` when resolving URL paths. As a result:
  - `frontend/src/app/(auth)/login/page.tsx` resolves to `/login`.
  - `frontend/src/app/login/page.tsx` also resolves to `/login`.
  - `frontend/src/app/(auth)/admin/login/page.tsx` resolves to `/admin/login`.
  - `frontend/src/app/(admin)/admin/login/page.tsx` also resolves to `/admin/login`.
  Because Turbopack detects two conflicting route definitions for both `/login` and `/admin/login`, the build fails before any client bundles or route manifests can be emitted.
  This directly violates acceptance criteria R4 ("HTTP GET to /login, /signup, /admin/login, and /admin/signup on the built Next.js app return HTTP 200") and the general Build & Type Safety criterion ("Running `npm run build` in the `frontend` directory succeeds with exit code 0").

---

## 3. Route Handler Adversarial Stress Test: `/auth/callback/route.ts`

Source code under test:
```typescript
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';

  if (code) {
    try {
      const supabase = await createServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // Continue to redirect in demo/offline mode
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
```

### Scenario 1: Parameter Omission — Missing `code`
- **Input**: `GET /auth/callback` (or `GET /auth/callback?next=/dashboard/orders`)
- **Execution Trace**:
  - `code` is `null`.
  - `if (code)` evaluates to `false`.
  - `supabase.auth.exchangeCodeForSession` is skipped.
  - Redirects to `new URL(next, origin)`.
- **Verdict**: **PASS (Behavioral)**. Gracefully skips PKCE exchange and redirects to target.

### Scenario 2: Parameter Omission — Missing `next`
- **Input**: `GET /auth/callback?code=valid-auth-code`
- **Execution Trace**:
  - `next` evaluates to `null || '/dashboard'` -> `'/dashboard'`.
  - `new URL('/dashboard', origin)` constructs `${origin}/dashboard`.
- **Verdict**: **PASS (Behavioral)**. Correctly falls back to `/dashboard`.

### Scenario 3: Malformed `code` Parameter
- **Input**: `GET /auth/callback?code=malformed_or_expired_pkce_token`
- **Execution Trace**:
  - `if (code)` evaluates to `true`.
  - `exchangeCodeForSession(code)` is called and rejects with `AuthApiError`.
  - `try ... catch` absorbs the rejection.
  - Execution proceeds to redirect.
- **Verdict**: **PASS (Demo Resilience)**. Does not crash server during offline or invalid token flows.

### Scenario 4: Open Redirect Attack (CWE-601)
- **Input**: `GET /auth/callback?code=abc&next=https://malicious-phishing.com/steal-session`
- **Execution Trace**:
  - `next` is `'https://malicious-phishing.com/steal-session'`.
  - In WHATWG URL standard, when `input` is an absolute URL with a scheme, the `base` parameter (`origin`) is ignored:
    `new URL('https://malicious-phishing.com/steal-session', 'http://localhost:3000').href`
    -> `'https://malicious-phishing.com/steal-session'`
  - `NextResponse.redirect` outputs `Location: https://malicious-phishing.com/steal-session`.
- **Severity**: **HIGH / CRITICAL SECURITY RISK**.
- **Impact**: Any authenticated user clicking a phishing link or oauth redirect crafted with an external `next` parameter will be redirected to an external malicious domain.
- **Mitigation**:
  Enforce relative-only paths:
  ```typescript
  const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/dashboard';
  return NextResponse.redirect(new URL(safeNext, origin));
  ```

### Scenario 5: Malformed `next` Parameter (Crash to HTTP 500)
- **Input**: `GET /auth/callback?next=http://` or `GET /auth/callback?next=javascript:alert(1)`
- **Execution Trace**:
  - `new URL('http://', origin)` throws `TypeError: Invalid URL`.
  - Because line 22 (`return NextResponse.redirect(...)`) is outside the `try/catch` block, the uncaught exception results in a Next.js 500 Internal Server Error.
- **Severity**: **MEDIUM**.
- **Mitigation**: Wrap URL construction in `try/catch` or sanitize `next` before calling `new URL`.

---

## 4. Auth Pages Adversarial Stress Test

### Page 1: `/login` (`frontend/src/app/(auth)/login/page.tsx`)

| Stress Case | Input Scenario | Expected Behavior | Actual Behavior | Severity |
|-------------|----------------|-------------------|-----------------|----------|
| **Empty Inputs** | Submit empty form (`""`, `""`) | Browser validation blocks submit; if bypassed, show error | HTML5 `required` catches in standard browsers. If bypassed, Supabase returns error, but catch block redirects user to `/dashboard` anyway! | Medium |
| **Invalid Password** | `email: "owner@valid.com"`, `password: "wrong"` | Display error message "Invalid email or password", remain on `/login` | Console logs `signInError.message`, but `setError` is NOT called; router pushes to `/dashboard`! | High |
| **Rate Limiting** | HTTP 429 "Too many requests" | Display throttle message "Rate limit exceeded. Please wait.", keep user on `/login` | Logs console warning, redirects user to `/dashboard`. | Medium |
| **Offline Fallback** | Supabase unreachable (offline) | Seamless fallback to demo `/dashboard` | Gracefully catches network error and redirects to `/dashboard`. | Conforms to demo mode |
| **Dead Error UI** | Any auth error | Render `<div className="text-red-700">{error}</div>` | Dead code. Lines 56-60 are never reachable because `setError` is never invoked in `handleSubmit`. | Low |

### Page 2: `/signup` (`frontend/src/app/(auth)/signup/page.tsx`)

| Stress Case | Input Scenario | Expected Behavior | Actual Behavior | Severity |
|-------------|----------------|-------------------|-----------------|----------|
| **Missing Restaurant Name** | Whitespace-only name `"   "` | Reject with "Please enter a valid restaurant name" | Passes HTML5 `required`, submits `"   "` to Supabase metadata `restaurant_name`. | Medium |
| **Short Password** | `password: "123"` | HTML5 `minLength={8}` blocks; if bypassed, show error | HTML5 blocks in browser. If bypassed, Supabase rejects with error, but catch block redirects to `/dashboard`. | Medium |
| **Duplicate Email** | Email already registered | Display "An account with this email already exists" | Logs console warning; redirects to `/dashboard`. User receives zero feedback. | Medium |
| **Dead Error UI** | Any auth error | Render error banner | Dead code. `setError` is never called. | Low |

### Page 3: `/admin/login` (`frontend/src/app/(auth)/admin/login/page.tsx`)

| Stress Case | Input Scenario | Expected Behavior | Actual Behavior | Severity |
|-------------|----------------|-------------------|-----------------|----------|
| **Non-Operator Credentials** | Restaurant owner credentials on `/admin/login` | Verify operator role: reject if not admin, redirect to `/login` | Only calls `signInWithPassword`. Zero role verification (`role === 'operator_admin'`). Pushes to `/admin`. | High |
| **Invalid Token / Credentials** | Invalid password / malformed email | Show "Invalid operator credentials" | Logs console warning; redirects to `/admin`! | High |
| **Missing Middleware** | Direct GET to `/admin` | Middleware redirects unauthenticated requests to `/admin/login` | No `middleware.ts` exists in project root or `src/`. Anyone can access `/admin` directly. | High |

### Page 4: `/admin/signup` (`frontend/src/app/(auth)/admin/signup/page.tsx`)

| Stress Case | Input Scenario | Expected Behavior | Actual Behavior | Severity |
|-------------|----------------|-------------------|-----------------|----------|
| **Malformed Invite Code** | `inviteCode: "garbage123"` | Reject invalid invite code format; verify against corporate invite list | No regex or pattern validation (`placeholder="TB-OP-XXXX"` has no `pattern` constraint). Sends raw string in metadata. Redirects to `/admin`. | Medium |
| **Missing Invite Code** | Empty or whitespace | Require valid corporate invite code | HTML5 `required` prevents empty submit, but whitespace bypasses. | Medium |

---

## 5. Summary of Challenges & Blast Radii

| # | Challenge Area | Blast Radius | Likelihood | Impact |
|---|----------------|--------------|------------|--------|
| 1 | Duplicate route collision blocking `next build` | Complete failure of production build and deployment pipeline | 100% (Confirmed) | CRITICAL |
| 2 | Open redirect in `/auth/callback` via `next` param | Phishing attacks against authenticated restaurant owners & operators | High | HIGH |
| 3 | Unhandled crash on malformed `next` in `/auth/callback` | HTTP 500 error in auth callback flow | Medium | MEDIUM |
| 4 | Dead error state & unconditional redirect on auth failure | Users entering wrong credentials never see error messages; silent routing | 100% | HIGH |
| 5 | Lack of RBAC check on `/admin/login` & missing `middleware.ts` | Any authenticated user or offline demo visitor can access operator tools | High | HIGH |

---

## 6. Gate Verdict & Mandatory Remediations

### Gate Verdict: **REJECT**

Milestone M1 cannot be approved in its current state. The following remediations must be executed by a worker agent:

1. **Delete Duplicate Route Stubs**:
   Remove the conflicting stub directories:
   - `frontend/src/app/login/`
   - `frontend/src/app/(admin)/admin/login/`
   Then re-run `npm.cmd run build` to verify exit code 0.

2. **Patch Open Redirect & Crash Risk in `frontend/src/app/auth/callback/route.ts`**:
   Sanitize `next` to ensure it only permits local relative paths:
   ```typescript
   export async function GET(request: NextRequest) {
     const { searchParams, origin } = new URL(request.url);
     const code = searchParams.get('code');
     const rawNext = searchParams.get('next') || '/dashboard';
     
     // Prevent open redirect: only allow relative paths that do not start with //
     const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/dashboard';

     if (code) {
       try {
         const supabase = await createServerClient();
         await supabase.auth.exchangeCodeForSession(code);
       } catch {
         // Continue to redirect in demo/offline mode
       }
     }

     try {
       return NextResponse.redirect(new URL(next, origin));
     } catch {
       return NextResponse.redirect(new URL('/dashboard', origin));
     }
   }
   ```

3. **Wire Error Feedback or Explicit Demo Mode Gating**:
   In `/login`, `/signup`, `/admin/login`, `/admin/signup`:
   If `signInError` or `signUpError` occurs:
   Either call `setError(signInError.message)` when in production mode, OR explicitly document that offline demo mode intentionally auto-redirects reviewers without credentials.
