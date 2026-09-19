# Analysis Report: Middleware Cookie Synchronization & Auth Error State Handling

**Agent**: `explorer_m1_it2_middleware_ui`  
**Milestone**: M1 Iteration 2  
**Date**: 2026-09-14  
**Target Files**:
1. `frontend/src/lib/supabase-middleware.ts`
2. `frontend/src/app/(auth)/login/page.tsx`
3. `frontend/src/app/(auth)/signup/page.tsx`
4. `frontend/src/app/(auth)/admin/login/page.tsx`
5. `frontend/src/app/(auth)/admin/signup/page.tsx`

---

## 1. Executive Summary

During Milestone M1 Iteration 1, two critical issues were identified:
1. **Middleware Cookie Dropping**: In `frontend/src/lib/supabase-middleware.ts`, `storage.setItem` and `storage.removeItem` reassign the local variable `res = NextResponse.next(...)`. Because `createMiddlewareClient` immediately returns `{ supabase, response: res }` before `supabase.auth.getUser()` runs, this variable reassignment severs the reference connection. The caller's `response` object reference remains bound to the original unmodified response, completely dropping refreshed cookies and tokens.
2. **Auth Pages Silent Error Swallowing**: Across all four restored auth pages (`/login`, `/signup`, `/admin/login`, `/admin/signup`), the form submission handler logs a warning or ignores `signInError`/`signUpError` and unhandled exceptions, never invokes `setError(...)`, and unconditionally executes `router.push('/dashboard')` or `router.push('/admin')`. Consequently, invalid credentials silently redirect the user as if authentication succeeded, and the rendered red error alert banner is never displayed.

This document details the exact root causes, traces the logic chains, and formulates precise drop-in code fixes with comprehensive verification tests.

---

## 2. Deep Root Cause Analysis

### 2.1 Problem 1: Cookie Dropping in `frontend/src/lib/supabase-middleware.ts`

#### Current Code Trace (lines 15–85):
```typescript
export function createMiddlewareClient(
  request: NextRequest,
  response?: NextResponse
): { supabase: SupabaseClient<Database>; response: NextResponse } {
  let res = response || NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          return request.cookies.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          request.cookies.set({ name: key, value });
          res = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          res.cookies.set({
            name: key,
            value,
            path: '/',
            maxAge: 2592000,
            sameSite: 'lax',
          });
        },
        removeItem: (key: string) => {
          request.cookies.delete(key);
          res = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          res.cookies.delete(key);
        },
      },
    },
  });

  return { supabase, response: res };
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let res = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { supabase, response } = createMiddlewareClient(request, res);

  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase offline or unreachable - allow request to proceed without interruption
  }

  return response;
}
```

#### The Mechanism of Failure:
1. **Premature Return of Reference**:
   In `updateSession`, `const { supabase, response } = createMiddlewareClient(request, res);` executes. `createMiddlewareClient` returns `{ supabase, response: res }`, where `response` holds a reference to the initial `NextResponse` instance (`Instance A`).
2. **Severed Binding in `setItem`**:
   When `await supabase.auth.getUser()` runs, Supabase detects a need to write an auth token or refresh cookie, invoking `storage.setItem(key, value)`. Inside `setItem`:
   ```typescript
   res = NextResponse.next({ ... });
   ```
   This statement reassigns the local variable `res` inside `createMiddlewareClient`'s scope to a new instance (`Instance B`). The cookies are attached to `Instance B`.
   However, the caller's variable `response` in `updateSession` still points to `Instance A`!
3. **Loss Across Multiple Storage Operations**:
   Even if the caller had a reference to `res`, if `setItem` is called multiple times (e.g. access token + refresh token, or chunked cookies), each call executes `res = NextResponse.next(...)`, which instantiates a fresh response, discarding all cookies set by prior `setItem` calls.
4. **Discarding Caller's Custom Response**:
   If a caller passes a custom response (such as a redirect `NextResponse.redirect(...)` or a response with custom headers), executing `res = NextResponse.next(...)` obliterates the redirect status and headers, replacing it with a standard 200 `next` response.
5. **Caller Returns Unmodified `response`**:
   `updateSession` executes `return response;`. Because `response` is `Instance A`, it has zero `Set-Cookie` headers. The browser never receives updated session cookies, causing subsequent server-side requests to fail authentication.

#### Architectural Fix:
Do NOT instantiate a new `NextResponse` inside `setItem` or `removeItem`. Instead, mutate cookies directly in-place on the existing `res` instance via `res.cookies.set(...)` and `res.cookies.delete(...)`. Because `res` is an object reference, `response` returned to the caller retains all mutations.

---

### 2.2 Problem 2: Error State Swallowing in Auth Pages

The 4 auth pages are:
1. `frontend/src/app/(auth)/login/page.tsx`
2. `frontend/src/app/(auth)/signup/page.tsx`
3. `frontend/src/app/(auth)/admin/login/page.tsx`
4. `frontend/src/app/(auth)/admin/signup/page.tsx`

All 4 pages contain the error state variable and alert UI:
```tsx
const [error, setError] = useState<string | null>(null);
...
{error && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
    {error}
  </div>
)}
```

However, their `handleSubmit` implementations follow this broken pattern:
```tsx
// Flawed implementation in LoginPage:
try {
  const supabase = createBrowserClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    // Fallback for offline demo mode
    console.warn('Supabase auth notice:', signInError.message);
  }
  router.push('/dashboard');
} catch {
  // Offline fallback: redirect to dashboard
  router.push('/dashboard');
} finally {
  setLoading(false);
}
```

#### The Mechanism of Failure:
1. When Supabase returns an authentication error (e.g. `Invalid login credentials`, `Email not confirmed`, `User not found`):
   - `signInError` is populated.
   - `setError(...)` is NOT called.
   - `router.push(...)` is executed anyway!
2. When Supabase throws an unexpected network error or exception:
   - The `catch` block catches the error.
   - `setError(...)` is NOT called.
   - `router.push(...)` is executed anyway!
3. The user is redirected to `/dashboard` or `/admin` despite failing authentication. If route middleware or server checks reject the unauthenticated session, the user is redirected back, resulting in a confusing flash or infinite loop.
4. The `{error && ...}` alert banner in the DOM is never rendered because `error` is never set.

#### Architectural Fix:
1. If `signInError` / `signUpError` is returned:
   - Set the error state: `setError(signInError.message || 'Authentication failed');` (or `'Registration failed'`).
   - Immediately `return;` so `router.push(...)` is bypassed.
2. In the `catch (err: any)` block:
   - Set the error state: `setError(err?.message || 'Authentication failed');`.
   - Do NOT redirect.
3. In the `finally` block:
   - `setLoading(false);` ensures the submit button is re-enabled so the user can correct their credentials.

---

## 3. Drop-in Implementation Recommendations

### 3.1 Fix for `frontend/src/lib/supabase-middleware.ts`

#### Proposed Changes:
1. Remove variable reassignments `res = NextResponse.next(...)` from `storage.setItem` and `storage.removeItem`.
2. Mutate cookies directly on `res.cookies.set(...)` and `res.cookies.delete(...)`.
3. In `updateSession`, return `response`, which directly references `res`.

#### Complete Drop-in Code for `frontend/src/lib/supabase-middleware.ts`:
```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database.types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_offline_build';

/**
 * Creates a Supabase client configured for Edge Runtime / Next.js Middleware.
 * Reads cookies from NextRequest and writes updated cookies directly to NextResponse.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response?: NextResponse
): { supabase: SupabaseClient<Database>; response: NextResponse } {
  const res =
    response ||
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          return request.cookies.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          request.cookies.set({ name: key, value });
          res.cookies.set({
            name: key,
            value,
            path: '/',
            maxAge: 2592000,
            sameSite: 'lax',
          });
        },
        removeItem: (key: string) => {
          request.cookies.delete(key);
          res.cookies.delete(key);
        },
      },
    },
  });

  return { supabase, response: res };
}

/**
 * Refreshes auth session and handles route protection.
 * Safe for offline development and builds: does not block on network failure.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { supabase, response } = createMiddlewareClient(request, res);

  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase offline or unreachable - allow request to proceed without interruption
  }

  return response;
}

export default updateSession;
```

---

### 3.2 Fix for `frontend/src/app/(auth)/login/page.tsx`

#### Target: `handleSubmit` method (lines 19–42)
```typescript
<<<< Before:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Fallback for offline demo mode
        console.warn('Supabase auth notice:', signInError.message);
      }
      router.push('/dashboard');
    } catch {
      // Offline fallback: redirect to dashboard
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

==== After:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Authentication failed');
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
>>>>
```

---

### 3.3 Fix for `frontend/src/app/(auth)/signup/page.tsx`

#### Target: `handleSubmit` method (lines 20–47)
```typescript
<<<< Before:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            restaurant_name: restaurantName,
          },
        },
      });

      if (signUpError) {
        console.warn('Supabase auth notice:', signUpError.message);
      }
      router.push('/dashboard');
    } catch {
      // Offline fallback
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

==== After:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            restaurant_name: restaurantName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Authentication failed');
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
>>>>
```

---

### 3.4 Fix for `frontend/src/app/(auth)/admin/login/page.tsx`

#### Target: `handleSubmit` method (lines 19–41)
```typescript
<<<< Before:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.warn('Supabase auth notice:', signInError.message);
      }
      router.push('/admin');
    } catch {
      // Offline fallback: redirect to admin
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

==== After:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Authentication failed');
        return;
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
>>>>
```

---

### 3.5 Fix for `frontend/src/app/(auth)/admin/signup/page.tsx`

#### Target: `handleSubmit` method (lines 21–50)
```typescript
<<<< Before:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'operator_admin',
            invite_code: inviteCode,
          },
        },
      });

      if (signUpError) {
        console.warn('Supabase auth notice:', signUpError.message);
      }
      router.push('/admin');
    } catch {
      // Offline fallback: redirect to admin
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

==== After:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'operator_admin',
            invite_code: inviteCode,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || 'Authentication failed');
        return;
      }
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
>>>>
```

---

## 4. Verification Suite & Unit Tests

### 4.1 Additional Tests for `frontend/__tests__/auth-routes.test.tsx`

To ensure failure states are permanently tested and regression-proof, add test cases to each `describe` block in `auth-routes.test.tsx`:

```typescript
// Add inside describe('LoginPage (/login)')
it('displays error message and prevents redirect when authentication fails', async () => {
  mockSignInWithPassword.mockResolvedValueOnce({
    data: {},
    error: { message: 'Invalid credentials provided' },
  });

  render(<LoginPage />);
  const submitBtn = screen.getByRole('button', { name: /sign in/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText('Invalid credentials provided')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

it('handles unhandled exceptions gracefully by setting fallback error', async () => {
  mockSignInWithPassword.mockRejectedValueOnce(new Error('Network connection error'));

  render(<LoginPage />);
  const submitBtn = screen.getByRole('button', { name: /sign in/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText('Network connection error')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// Add inside describe('SignupPage (/signup)')
it('displays error message and prevents redirect when signup fails', async () => {
  mockSignUp.mockResolvedValueOnce({
    data: {},
    error: { message: 'Email already registered' },
  });

  render(<SignupPage />);
  const submitBtn = screen.getByRole('button', { name: /create restaurant account/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText('Email already registered')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// Add inside describe('AdminLoginPage (/admin/login)')
it('displays error message and prevents redirect on admin login failure', async () => {
  mockSignInWithPassword.mockResolvedValueOnce({
    data: {},
    error: { message: 'Unauthorized operator account' },
  });

  render(<AdminLoginPage />);
  const submitBtn = screen.getByRole('button', { name: /sign in as admin/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText('Unauthorized operator account')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// Add inside describe('AdminSignupPage (/admin/signup)')
it('displays error message and prevents redirect on invalid invite code', async () => {
  mockSignUp.mockResolvedValueOnce({
    data: {},
    error: { message: 'Invalid corporate invite code' },
  });

  render(<AdminSignupPage />);
  const submitBtn = screen.getByRole('button', { name: /register operator account/i });
  fireEvent.click(submitBtn);

  await waitFor(() => {
    expect(screen.getByText('Invalid corporate invite code')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
```

---

### 4.2 Proposed Test Suite: `frontend/__tests__/supabase-middleware.test.ts`

Create a dedicated unit test suite for middleware cookie management:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient, updateSession } from '@/lib/supabase-middleware';

describe('Supabase Middleware Client & Session Synchronization', () => {
  it('mutates cookies directly on response and retains all cookies across multiple setItem calls', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'sb-access-token=initial_token',
      },
    });

    const res = NextResponse.next();
    const { supabase, response } = createMiddlewareClient(req, res);

    // Verify response is identical reference to res
    expect(response).toBe(res);

    // Trigger storage setItem directly via supabase client auth storage
    const authConfig = (supabase as any).auth;
    authConfig.storage.setItem('sb-access-token', 'new_access_token');
    authConfig.storage.setItem('sb-refresh-token', 'new_refresh_token');

    // Verify both cookies are present on the response object
    const cookies = response.cookies.getAll();
    const accessTokenCookie = cookies.find((c) => c.name === 'sb-access-token');
    const refreshTokenCookie = cookies.find((c) => c.name === 'sb-refresh-token');

    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie?.value).toBe('new_access_token');
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie?.value).toBe('new_refresh_token');
  });

  it('deletes cookie from both request and response in removeItem', () => {
    const req = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: 'sb-access-token=old_token',
      },
    });

    const { supabase, response } = createMiddlewareClient(req);
    const authConfig = (supabase as any).auth;
    authConfig.storage.removeItem('sb-access-token');

    expect(req.cookies.get('sb-access-token')).toBeUndefined();
    expect(response.cookies.get('sb-access-token')?.maxAge).toBe(0);
  });

  it('updateSession catches network exceptions cleanly and returns response', async () => {
    const req = new NextRequest('http://localhost:3000/dashboard');
    const response = await updateSession(req);
    expect(response).toBeInstanceOf(NextResponse);
  });
});
```

---

## 5. Architectural Alignment & Considerations

1. **Next.js App Router Compatibility**:
   - `res.cookies.set()` and `res.cookies.delete()` are fully compliant with Next.js 16 Edge Runtime and middleware specification.
   - Using in-place mutation guarantees that custom response objects (such as `NextResponse.redirect()`) preserve their redirection target, status code (307/302), and headers.
2. **Offline Fallback Resilience**:
   - In `updateSession`, the `try/catch` wrapping `await supabase.auth.getUser()` continues to safeguard against unreachable local Supabase instances during build time and offline execution.
3. **Build & Route Collision Vigilance**:
   - Notice exists that `frontend/src/app/login/page.tsx` and `frontend/src/app/(admin)/admin/login/page.tsx` were legacy files prior to restoring `frontend/src/app/(auth)/`.
   - The authoritative auth routes are in `frontend/src/app/(auth)/`.
   - If Next.js raises route collision errors during `npm run build` between `(auth)/login` and `login/page.tsx`, the legacy placeholder files outside `(auth)` should be removed or verified.
