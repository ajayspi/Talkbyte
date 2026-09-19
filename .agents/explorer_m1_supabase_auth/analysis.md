# Comprehensive Technical Analysis: Supabase Auth Helpers & Proxy Architecture (R4)

**Agent**: explorer_m1_supabase_auth  
**Milestone**: M1 (Restore Missing Auth Pages)  
**Date**: 2026-09-14  
**Scope**:  
- `frontend/src/lib/supabase-browser.ts`  
- `frontend/src/lib/supabase-server.ts`  
- `frontend/src/lib/supabase-middleware.ts`  
- `frontend/src/proxy.ts`  
- Dependency & TypeScript verification with Next.js 16 & React 19  

---

## 1. Executive Summary

Requirement R4 mandates restoring deleted authentication helpers and proxy architecture:
1. `frontend/src/lib/supabase-browser.ts`
2. `frontend/src/lib/supabase-server.ts`
3. `frontend/src/lib/supabase-middleware.ts`
4. `frontend/src/proxy.ts`
5. Associated auth routes (`frontend/src/app/(auth)/` and `frontend/src/app/auth/callback/route.ts`).

Our investigation audits:
- **Package Dependencies**: `frontend/package.json` contains `@supabase/supabase-js: ^2.47.0`, but **does NOT contain** `@supabase/ssr` or `@supabase/auth-helpers-nextjs`. An inspection of `frontend/node_modules/@supabase/` confirms `@supabase/ssr` is absent.
- **Dependency Strategy**: Rather than introducing a hard dependency on `@supabase/ssr` which risks breaking offline builds or failing if `npm install` is not executed, the auth helper files can and should be authored with standard `@supabase/supabase-js` storage adapters that natively interface with browser cookies, Next.js 16 `next/headers` cookies, and `next/server` middleware cookies.
- **Next.js 16 & React 19 Compatibility**: In Next.js 16 (specifically 16.3.4 as logged in production), `cookies()` from `next/headers` is **asynchronous** and must be awaited (`await cookies()`). Synchronous cookie access throws an error. Furthermore, Server Component prerendering must not crash if cookies cannot be set during static builds (`try / catch` on cookie mutations).
- **Proxy Architecture**: `frontend/src/proxy.ts` acts as a unified reverse-proxy and API forwarder between the Next.js frontend and the FastAPI backend (`http://localhost:8000`), as well as Supabase. It eliminates CORS issues, strips unwanted client headers, and handles HTTP streaming and 502 error fallbacks.

---

## 2. Dependency Audit & Package Ecosystem

### 2.1 Audit of `frontend/package.json`

Inspection of `frontend/package.json` reveals:
```json
"dependencies": {
  "@gsap/react": "^2.1.2",
  "@supabase/supabase-js": "^2.47.0",
  "@tanstack/react-query": "^5.62.0",
  "@tsparticles/react": "^4.4.0",
  "@tsparticles/slim": "^4.4.0",
  "axios": "^1.7.9",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "framer-motion": "^13.2.0",
  "gsap": "^3.15.0",
  "lenis": "^1.3.26",
  "next": "^16.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "recharts": "^2.13.3",
  "tailwind-merge": "^3.6.0",
  "zustand": "^5.0.2"
}
```

### 2.2 Physical `node_modules/@supabase` Audit
An inspection of `frontend/node_modules/@supabase/` shows:
- `auth-js`
- `functions-js`
- `phoenix`
- `postgrest-js`
- `realtime-js`
- `storage-js`
- `supabase-js`

`@supabase/ssr` is **not installed** in `node_modules`.

### 2.3 Architectural Decision on Dependencies
Attempting to write `import { createBrowserClient, createServerClient } from '@supabase/ssr'` will trigger:
```
Cannot find module '@supabase/ssr' or its corresponding type declarations.
```
This would cause `npm run build` to fail immediately.

**Recommendation**:
Implement `supabase-browser.ts`, `supabase-server.ts`, and `supabase-middleware.ts` using `@supabase/supabase-js` (which is already installed, typed, and battle-tested). By implementing custom cookie storage handlers over `@supabase/supabase-js`, we gain:
1. Complete zero-dependency footprint beyond existing packages.
2. Full control over Next.js 16 async cookie handling.
3. Resilience against missing network connections during offline builds.
4. Export compatibility: Exporting functions named `createBrowserClient`, `createServerClient`, `createMiddlewareClient`, and `createClient` ensures full drop-in compatibility with code expecting either `@supabase/ssr` or `@supabase/supabase-js`.

---

## 3. Detailed Architecture of the 4 Target Files

### 3.1 `frontend/src/lib/supabase-browser.ts`

#### Role:
Client-side Supabase client singleton for React Client Components (`'use client'`).

#### Design Requirements:
- Read `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Fall back to offline defaults (`http://localhost:54321` and a dummy JWT anon key) if environment variables are unset.
- Persist session in `document.cookie` (in addition to memory) so that when a user logs in via browser, the session cookie is transmitted with subsequent SSR and API requests.
- Guard all DOM/document references (`typeof window !== 'undefined'`) to prevent SSR hydration errors.
- Export both `createBrowserClient` and `createClient` as named and default exports.

#### Blueprint:
```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_offline_build';

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Creates or returns a singleton Supabase client for client-side React components.
 * Configured with cookie storage for session synchronization with Next.js SSR.
 */
export function createBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? {
        getItem: (key: string) => {
          if (typeof document === 'undefined') return null;
          const match = document.cookie.match(new RegExp('(^|;\\s*)' + key + '=([^;]*)'));
          return match ? decodeURIComponent(match[2]) : null;
        },
        setItem: (key: string, value: string) => {
          if (typeof document === 'undefined') return;
          document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax`;
        },
        removeItem: (key: string) => {
          if (typeof document === 'undefined') return;
          document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
        },
      } : undefined,
    },
  });

  return browserClient;
}

export { createBrowserClient as createClient };
export default createBrowserClient;
```

---

### 3.2 `frontend/src/lib/supabase-server.ts`

#### Role:
Server-side Supabase client for Server Components, Server Actions, and Route Handlers (`app/api/...` or `app/auth/callback/route.ts`).

#### Next.js 16 & React 19 Critical Quirks:
1. **Asynchronous `cookies()`**: In Next.js 16, `cookies()` returns `Promise<ReadonlyRequestCookies>`. Calling `cookieStore = cookies()` synchronously and attempting `cookieStore.get(...)` throws a fatal runtime exception. It MUST be awaited: `const cookieStore = await cookies()`.
2. **Read-Only Server Components**: When Next.js statically analyzes or renders a Server Component during `next build`, calling `cookieStore.set()` or `cookieStore.delete()` throws an error (`Cookies can only be modified in a Server Action or Route Handler`). The storage adapter must wrap cookie mutations in a `try / catch` block so that Server Component reads execute cleanly without crashing prerenders.

#### Blueprint:
```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_offline_build';

/**
 * Creates a server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * In Next.js 16, cookies() is asynchronous and must be awaited.
 */
export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          try {
            cookieStore.set(key, value, {
              path: '/',
              maxAge: 2592000,
              sameSite: 'lax',
            });
          } catch {
            // Server Components cannot mutate cookies; ignore during read-only render phase
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.delete(key);
          } catch {
            // Server Components cannot delete cookies; ignore during read-only render phase
          }
        },
      },
    },
  });
}

export { createServerClient as createClient };
export default createServerClient;
```

---

### 3.3 `frontend/src/lib/supabase-middleware.ts`

#### Role:
Session synchronization and token refresh for Next.js Middleware (`middleware.ts`).

#### Design Requirements:
- Operates on `NextRequest` and `NextResponse` within the Next.js Edge Runtime.
- Reads incoming cookies from `request.cookies`.
- Updates refreshed session cookies on the outgoing `response.cookies` using the two-pass pattern (setting on both request and response).
- Offline tolerance: If Supabase cannot be reached during local offline development or CI, `updateSession` does not throw or hang; it allows the request to pass through cleanly.

#### Blueprint:
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
 * Reads cookies from NextRequest and writes updated cookies to NextResponse.
 */
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

/**
 * Refreshes auth session and handles route protection.
 * Safe for offline development and builds: does not block on network failure.
 */
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

export default updateSession;
```

---

### 3.4 `frontend/src/proxy.ts`

#### Role:
Reverse proxy and API dispatcher for Next.js to communicate with the FastAPI backend (`http://localhost:8000`) and Supabase.

#### Design Requirements:
- Handles `NextRequest` forwarding in Next.js Route Handlers.
- Strips hop-by-hop and host headers (`host`, `connection`, `content-length`).
- Supports JSON, multipart/form-data, and streaming blobs without corrupting payloads.
- Supplies server-side utility functions `proxyToBackend<T>` and `proxyToSupabase<T>` for programmatic invocation in Server Components or Actions.
- Responds with HTTP 502 and structured JSON error if the target service is down.

#### Blueprint:
```typescript
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'http://localhost:54321';

export interface ProxyOptions {
  target?: string;
  stripPrefix?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Proxies an incoming Next.js request to a backend target service (FastAPI or Supabase).
 * Strips host headers and safely forwards streaming or buffered bodies.
 */
export async function proxyRequest(
  req: NextRequest,
  options?: ProxyOptions
): Promise<NextResponse> {
  const targetBase = options?.target || BACKEND_URL;
  let targetPath = req.nextUrl.pathname;

  if (options?.stripPrefix && targetPath.startsWith(options.stripPrefix)) {
    targetPath = targetPath.slice(options.stripPrefix.length) || '/';
  }

  const targetUrl = new URL(targetPath + req.nextUrl.search, targetBase);

  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  if (options?.customHeaders) {
    Object.entries(options.customHeaders).forEach(([k, v]) => {
      forwardHeaders.set(k, v);
    });
  }

  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.blob() : undefined;

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'PROXY_FORWARD_ERROR',
        message: error?.message || 'Failed to proxy request to backend service',
        target: targetUrl.toString(),
      },
      { status: 502 }
    );
  }
}

/**
 * Server-side helper to proxy direct API calls to FastAPI backend.
 */
export async function proxyToBackend<T = any>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Proxy backend error: ${res.status}`);
  }

  return res.json();
}

/**
 * Server-side helper to proxy requests to Supabase REST / Auth endpoints.
 */
export async function proxyToSupabase<T = any>(
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const url = `${SUPABASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Proxy Supabase error: ${res.status}`);
  }
  return res.json();
}

export default proxyRequest;
```

---

## 4. Integration with Existing Data Layer & Auth Pages

### 4.1 Interaction with `frontend/src/lib/supabase.ts` and `mockData.ts`
- `frontend/src/lib/supabase.ts` is the **application data layer**, exporting helper functions (`getRestaurant`, `getMenuItems`, `toggleMenuItemAvailability`, `getLiveCalls`, `getRecentOrders`, etc.) backed by `mockData.ts` fallbacks.
- The new `supabase-browser.ts`, `supabase-server.ts`, and `supabase-middleware.ts` form the **session and authentication layer**.
- They use identical configuration:
  - Database schema types: `import type { Database } from '@/types/database.types'`
  - Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Because the auth helpers mirror the graceful fallback pattern of `supabase.ts`, unauthenticated builds and offline tests never trigger uncaught network rejections.

### 4.2 Integration with Restored Auth Pages & Callback Route
The restored auth routes interact with these helpers as follows:

| Route / File | Helper Imported | Operation |
|---|---|---|
| `frontend/src/app/(auth)/login/page.tsx` | `createBrowserClient` from `@/lib/supabase-browser` | `supabase.auth.signInWithPassword({ email, password })` |
| `frontend/src/app/(auth)/signup/page.tsx` | `createBrowserClient` from `@/lib/supabase-browser` | `supabase.auth.signUp({ email, password })` |
| `frontend/src/app/(auth)/admin/login/page.tsx` | `createBrowserClient` from `@/lib/supabase-browser` | Admin role verification & sign-in |
| `frontend/src/app/(auth)/admin/signup/page.tsx` | `createBrowserClient` from `@/lib/supabase-browser` | Admin registration |
| `frontend/src/app/auth/callback/route.ts` | `createServerClient` from `@/lib/supabase-server` | `await supabase.auth.exchangeCodeForSession(code)` |

### 4.3 Route Conflict Prevention (Next.js 16 App Router)
Next.js App Router treats `(auth)` as a route group (it does not appear in the URL path).
- `src/app/(auth)/login/page.tsx` $\rightarrow$ `/login`
- `src/app/(auth)/admin/login/page.tsx` $\rightarrow$ `/admin/login`

**Critical Hazard**:
If untracked placeholder files exist at `frontend/src/app/login/page.tsx` or `frontend/src/app/(admin)/admin/login/page.tsx`, Next.js build will abort with duplicate route errors:
```
Error: You cannot define duplicate paths "/login"
```
**Resolution**:
When placing files in `(auth)/login/page.tsx` and `(auth)/admin/login/page.tsx`, any duplicate files at `src/app/login/page.tsx` or `src/app/(admin)/admin/login/page.tsx` must be removed or merged into the `(auth)` directory structure.

---

## 5. Verification & Build Strategy for Zero Errors

To guarantee that `npm run build` succeeds with exit code 0:
1. **File Locations**:
   - `frontend/src/lib/supabase-browser.ts`
   - `frontend/src/lib/supabase-server.ts`
   - `frontend/src/lib/supabase-middleware.ts`
   - `frontend/src/proxy.ts`
2. **TypeScript Type Checking**:
   - All 4 files must import `Database` from `@/types/database.types`.
   - `tsconfig.json` contains `"paths": { "@/*": ["./src/*"] }`, resolving all `@/` paths.
   - All function signatures have explicit return types.
3. **Prerender Safety**:
   - Every auth function must handle undefined `process.env` values gracefully with offline defaults.
   - Server-side cookie mutations must be wrapped in `try/catch`.
4. **Execution Command**:
   - `npm run build` in `frontend/` executes `next build`.
   - Output must produce all static/dynamic routes (`/login`, `/signup`, `/admin/login`, `/admin/signup`, `/dashboard`, `/admin`) without TypeScript or compilation errors.
