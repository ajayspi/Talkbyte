# Handoff Report: Middleware Cookie Sync & Auth Pages Error State Handling

**Subagent**: `explorer_m1_it2_middleware_ui`  
**Milestone**: M1 Iteration 2  
**Date**: 2026-09-14  
**Handoff Type**: Hard (Investigation complete, full recommendations formulated)

---

## 1. Observation

### 1.1 `frontend/src/lib/supabase-middleware.ts`
- **File Location**: `frontend/src/lib/supabase-middleware.ts`
- **Lines 15–63**: `createMiddlewareClient` implementation:
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
  ```
- **Lines 69–85**: `updateSession` implementation:
  ```typescript
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
- **Direct Observation**:
  1. In line 62, `return { supabase, response: res };` returns immediately when `createMiddlewareClient` is called, holding a reference to the initial `res` object created at lines 19–23.
  2. In line 36 and line 51, `res = NextResponse.next(...)` reassigns the local variable `res` inside `storage.setItem` and `storage.removeItem`.
  3. When `updateSession` executes line 79 (`await supabase.auth.getUser()`), any call to `setItem` reassigns `res` locally, but `response` held by `updateSession` (line 76) still points to the initial instance. Line 84 returns `response`, which contains none of the cookies set in `setItem`.
  4. Each successive call to `setItem` creates a new `NextResponse.next(...)`, discarding any cookies set during preceding `setItem` invocations.

### 1.2 Auth Pages Error State Handling
- **File Locations**:
  1. `frontend/src/app/(auth)/login/page.tsx` (lines 19–42)
  2. `frontend/src/app/(auth)/signup/page.tsx` (lines 20–47)
  3. `frontend/src/app/(auth)/admin/login/page.tsx` (lines 19–41)
  4. `frontend/src/app/(auth)/admin/signup/page.tsx` (lines 21–50)
- **Direct Code Observation in `login/page.tsx` (lines 19–42)**:
  ```typescript
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
  ```
- **Direct Observation Across All 4 Pages**:
  1. Each page defines `const [error, setError] = useState<string | null>(null);` and conditionally renders `{error && (<div className="...">{error}</div>)}`.
  2. On submission, if `signInError` or `signUpError` is returned by Supabase, `setError(...)` is never called.
  3. On exception in the `catch` block, `setError(...)` is never called.
  4. `router.push('/dashboard')` or `router.push('/admin')` is unconditionally executed in both error paths, redirecting the user despite failure.

### 1.3 Test Suite State (`frontend/__tests__/auth-routes.test.tsx`)
- Lines 23–24 mock `signInWithPassword` and `signUp` with `{ data: {}, error: null }`.
- No existing tests assert behavior when `error` is returned or when an exception is thrown. Consequently, existing tests pass even though error handling is completely absent.

---

## 2. Logic Chain

1. **Premise 1**: Next.js `NextResponse` uses an internal `ResponseCookies` collection to manage outgoing `Set-Cookie` HTTP headers. When `res.cookies.set()` or `res.cookies.delete()` is called on a `NextResponse` instance, it modifies that instance directly.
2. **Premise 2**: JavaScript objects are passed and returned by reference. In `createMiddlewareClient`, `return { supabase, response: res }` binds `response` to the specific object reference held by `res` at that moment in time.
3. **Inference from 1.1**: When `setItem` executes `res = NextResponse.next(...)`, it assigns a new reference to the local variable `res`. This does not update the `response` property of the object previously returned to `updateSession`. Therefore, `updateSession` returns the original `res` reference (`response`), which has no cookies.
4. **Conclusion 1 for Middleware**: Removing the reassignment `res = NextResponse.next(...)` and performing in-place mutation `res.cookies.set(...)` and `res.cookies.delete(...)` ensures that:
   - The returned `response` in `updateSession` retains all cookies added or removed during `supabase.auth.getUser()`.
   - Multiple cookies (access token, refresh token) accumulate without wiping each other.
   - Any custom `response` passed into `createMiddlewareClient` (such as a redirect) preserves its status code and headers.
5. **Inference from 1.2**: In all 4 auth pages, `setError` is never invoked, and `router.push` is called even when `signInError` / `signUpError` is present or an exception is caught.
6. **Conclusion 2 for Auth Pages**:
   - Calling `setError(signInError.message || 'Authentication failed')` (or `'Registration failed'`) followed by an immediate `return;` halts execution before `router.push(...)` is reached.
   - In the `catch (err: any)` block, calling `setError(err?.message || 'Authentication failed')` prevents unhandled exceptions from silently redirecting.
   - The user stays on the page, the rendered `{error && ...}` alert banner displays the exact error message, and `setLoading(false)` in `finally` re-enables the submit button.

---

## 3. Caveats

1. **Legacy Route File Shadowing**:
   `frontend/src/app/login/page.tsx` and `frontend/src/app/(admin)/admin/login/page.tsx` exist outside `(auth)/`. In Next.js App Router, `(auth)/login` and `login/page.tsx` map to the same URL (`/login`). If Next.js raises a route conflict error during `npm run build`, the placeholder files outside `(auth)` may need to be deleted or cleaned up.
2. **Offline Fallback Behavior**:
   The previous code swallowed errors intentionally as a pseudo-demo fallback. The new behavior strictly enforces proper authentication error display. If testing with fake credentials, an error will now correctly be displayed instead of silently entering the dashboard.
3. **No External Network in Jest**:
   Jest tests run in a mock environment without a live Supabase daemon. Mocks in `auth-routes.test.tsx` must explicitly test both `{ data: {}, error: null }` and `{ data: null, error: { message: ... } }`.

---

## 4. Conclusion

The exact fixes required are:
1. **`frontend/src/lib/supabase-middleware.ts`**:
   - In `createMiddlewareClient`, replace `res = NextResponse.next(...)` with direct in-place mutation on `res.cookies.set(...)` and `res.cookies.delete(...)`.
   - Keep `const res = response || NextResponse.next({ request: { headers: request.headers } });` and return `{ supabase, response: res }`.
2. **Auth Pages (`LoginPage.tsx`, `SignupPage.tsx`, `AdminLoginPage.tsx`, `AdminSignupPage.tsx`)**:
   - When `signInError` / `signUpError` is truthy, execute `setError(err.message || 'Authentication failed'); return;`.
   - In `catch (err: any)`, execute `setError(err?.message || 'Authentication failed');`.
   - Ensure `router.push(...)` is only reached when no error occurs.
3. **Testing**:
   - Add negative test cases to `frontend/__tests__/auth-routes.test.tsx` verifying error banner rendering and redirect prevention.
   - Add a dedicated unit test suite `frontend/__tests__/supabase-middleware.test.ts` verifying cookie persistence across multiple `setItem` calls.

---

## 5. Verification Method

### 5.1 Unit Test Execution (Automated)
Run Jest in the `frontend` directory:
```bash
cd frontend
npm test -- __tests__/auth-routes.test.tsx
```
**Expected Result**: All suites pass. If error test cases are added, all pass with exit code 0.

### 5.2 Middleware Cookie Persistence Test
Run the dedicated middleware test:
```bash
cd frontend
npm test -- __tests__/supabase-middleware.test.ts
```
**Expected Result**: Test asserts `response.cookies.getAll()` contains all tokens set via `storage.setItem` and passes with exit code 0.

### 5.3 Production Build Verification
Execute Next.js production build:
```bash
cd frontend
npm run build
```
**Expected Result**: Build completes with exit code 0 and zero TypeScript errors.

### 5.4 Invalidation Conditions
- If calling `storage.setItem` creates a new `NextResponse` reference, the test asserting `response === res` will fail.
- If submitting an auth form with an error still triggers `router.push()`, the Jest spy expectation `expect(mockPush).not.toHaveBeenCalled()` will fail.
