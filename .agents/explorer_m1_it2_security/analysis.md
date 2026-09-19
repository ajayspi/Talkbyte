# Deep Security Analysis: Auth Callback Open Redirect (CWE-601) & TypeError Crash Prevention

**Target**: `frontend/src/app/auth/callback/route.ts`  
**Vulnerabilities**: CWE-601 (URL Redirection to Untrusted Site / Open Redirect), Unhandled `TypeError` Crash (Denial of Service / 500 Server Error)  
**Author**: `explorer_m1_it2_security`  
**Date**: 2026-09-14  

---

## 1. Executive Summary

In `frontend/src/app/auth/callback/route.ts`, line 22 unconditionally calls:
```typescript
return NextResponse.redirect(new URL(next, origin));
```
where `next` is obtained directly from user input via query parameter `searchParams.get('next') || '/dashboard'`.

Under the WHATWG URL Standard (implemented by Node.js and modern browsers):
1. **CWE-601 Open Redirect**: If `next` begins with an absolute scheme (`https://attacker.com`) or is scheme-relative (`//attacker.com`), the `origin` base parameter is completely ignored, and the client is redirected to an external arbitrary destination.
2. **Unhandled `TypeError` 500 Crash**: If `next` is malformed (e.g. `http://` or invalid surrogate characters), `new URL()` throws an unhandled `TypeError`, resulting in an HTTP 500 Internal Server Error in Next.js.
3. **Backslash Normalization Bypass**: Certain clients and URL parsers normalize `/\` to `//`, allowing attackers to bypass naive `!next.startsWith('//')` filters if backslashes are not explicitly forbidden.

This document analyzes the exact mechanisms, catalogs exploit vectors, and formulates a defense-in-depth remediation with drop-in code and full unit test coverage.

---

## 2. Vulnerability Breakdown

### 2.1 The Vulnerable Code
Current implementation in `frontend/src/app/auth/callback/route.ts`:
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

### 2.2 Mechanism of Failure

#### A. WHATWG URL Base Resolution Semantics
The constructor `new URL(input, base)` parses `input` using the WHATWG URL parser:
- If `input` has a scheme (e.g. `https://`), `input` is deemed absolute. The parser skips the `base` entirely.
  ```javascript
  new URL("https://attacker.com/harvest", "http://localhost:3000").toString()
  // => "https://attacker.com/harvest"
  ```
- If `input` starts with `//` (scheme-relative), the parser adopts the scheme from `base` but replaces the host, port, and credentials with `input`:
  ```javascript
  new URL("//attacker.com/harvest", "http://localhost:3000").toString()
  // => "http://attacker.com/harvest"
  ```
- Result: An attacker can send victims a legitimate verification or OAuth link with `next=https://attacker.com` or `next=//attacker.com`. Once the user authenticates, they are silently bounced to the attacker's phishing site, potentially leaking auth state or session tokens in Referer headers.

#### B. Backslash Normalization Vector (`/\` and `/\\`)
In the WHATWG URL standard (special scheme path state):
- For special schemes (`http`, `https`), backslashes (`\`) are normalized to forward slashes (`/`).
- If a naive check only tests `next.startsWith('//')`, an attacker can pass:
  ```
  next=/\attacker.com
  or
  next=/\\attacker.com
  ```
- Many browsers and proxy layers interpret `/\attacker.com` as `//attacker.com`, leading to an open redirect bypass.

#### C. Scheme / Pseudo-Protocol Injection
If `next` begins with `javascript:` or `data:`, `new URL('javascript:alert(1)', origin)` will produce a URL with the `javascript:` scheme. While modern browsers restrict top-level navigation to `javascript:` via 307 redirects, webviews, native wrappers, or older browser engines may trigger Cross-Site Scripting (XSS).

#### D. Unhandled `TypeError` Crash (DoS)
Calling `new URL('http://', 'http://localhost:3000')` or `new URL('https://', 'http://localhost:3000')` fails WHATWG validation and throws:
```
TypeError: Invalid URL
```
Because line 22 is outside of any `try / catch` block:
- The exception terminates handler execution.
- Next.js returns `500 Internal Server Error`.
- An attacker can weaponize this to trigger DoS or disrupt auth callback flows.

---

## 3. Exploit Payloads & Test Vectors

| Attack / Test Vector | Input `next` | Vulnerable Behavior | Intended Secure Behavior |
|---|---|---|---|
| **Absolute URL** | `https://evil.com/phish` | Redirects to `https://evil.com/phish` (CWE-601) | Sanitized; fallback redirect to `/dashboard` |
| **Protocol-Relative** | `//evil.com/phish` | Redirects to `http://evil.com/phish` (CWE-601) | Sanitized; fallback redirect to `/dashboard` |
| **Backslash Bypass** | `/\evil.com` or `/\\evil.com` | Parser normalization to `//evil.com` (CWE-601) | Sanitized; fallback redirect to `/dashboard` |
| **In-Path Backslash** | `/dashboard\evil.com` | Path traversal / backslash injection | Sanitized; fallback redirect to `/dashboard` |
| **CRLF Injection** | `/dashboard\r\nSet-Cookie:x=1` | HTTP Header Injection risk | Sanitized; fallback redirect to `/dashboard` |
| **Pseudo-Protocol** | `javascript:alert(1)` | URI scheme hijack | Sanitized; fallback redirect to `/dashboard` |
| **Malformed URL** | `http://` or `https://` | Throws unhandled `TypeError` (HTTP 500 DoS) | Caught; fallback redirect to `/dashboard` |
| **Empty / Whitespace** | `""` or `"   "` | Fallback or invalid URL | Sanitized; fallback redirect to `/dashboard` |
| **Valid Relative Path** | `/dashboard/orders` | Safe relative redirection | Redirects to `/dashboard/orders` |
| **Valid Admin Path** | `/admin/fleet` | Safe relative redirection | Redirects to `/admin/fleet` |
| **Designated Admin Fallback** | `https://evil.com` with `role=operator_admin` | Redirects to `https://evil.com` | Sanitized; fallback redirect to `/admin` |

---

## 4. Remediation Architecture

To achieve defense-in-depth:

### 4.1 Strict Relative Path Validator (`isSafeRelativePath`)
A candidate path must fulfill:
1. **Type & Non-Empty**: Must be a non-empty string.
2. **Single Leading Slash**: `trimmed.startsWith('/')`. This immediately filters out absolute schemes (`https:`, `http:`, `javascript:`), hostnames without slashes, and empty strings.
3. **No Scheme-Relative Prefix**: `!trimmed.startsWith('//')`. Disallows `//evil.com`, `///evil.com`, etc.
4. **No Backslashes**: `!trimmed.startsWith('/\\') && !trimmed.includes('\\')`. Disallows backslash normalization bypasses.
5. **No Control Characters or Null Bytes**: Loop through characters checking `code <= 31 || code === 127`. Prevents CRLF injection and null byte poisoning without incurring regex lint warnings (`no-control-regex`).

### 4.2 Contextual Designated Fallback (`getDesignatedFallback`)
If `next` is omitted, invalid, or external:
- If `searchParams.get('fallback')` is provided and is a safe relative path, use it.
- If `searchParams.get('role') === 'operator_admin'`, `role === 'admin'`, or `type === 'admin'`, designate `/admin`.
- Otherwise, designate `/dashboard`.

### 4.3 Defense-in-Depth Origin Verification
Even if a string passes initial validation, when constructing `targetUrl = new URL(targetPath, origin)`:
- Explicitly check `targetUrl.origin === origin`.
- If there is any discrepancy, discard `targetUrl` and substitute the safe fallback.

### 4.4 Exception Boundary
Wrap both request URL parsing and redirect URL construction in `try / catch` blocks. If any `TypeError` occurs:
- Catch the error.
- Return a safe redirect to `new URL(fallbackPath, origin)`.
- If origin itself is corrupted, redirect to `new URL('/dashboard', 'http://localhost:3000')`.
- Ensures **zero unhandled exceptions** can escape the route.

---

## 5. Drop-In Replacement Implementation

File: `frontend/src/app/auth/callback/route.ts`

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * Validates that a redirect path is a safe relative path on the same origin.
 * Prevents CWE-601 Open Redirect vulnerabilities and protocol-relative bypasses.
 *
 * Validation Criteria:
 * 1. Must be a non-empty string starting with a single '/'
 * 2. Must NOT start with '//' (prevents protocol-relative URLs e.g. //attacker.com)
 * 3. Must NOT start with '/\' or contain '\' (prevents backslash normalization bypasses)
 * 4. Must NOT contain ASCII control characters, newlines, tabs, or null bytes
 */
function isSafeRelativePath(path: string | null | undefined): path is string {
  if (!path || typeof path !== 'string') {
    return false;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return false;
  }

  // Must start with '/'
  if (!trimmed.startsWith('/')) {
    return false;
  }

  // Must NOT start with '//' (protocol-relative URL)
  if (trimmed.startsWith('//')) {
    return false;
  }

  // Must NOT start with '/\' or contain any backslashes
  if (trimmed.startsWith('/\\') || trimmed.includes('\\')) {
    return false;
  }

  // Must NOT contain ASCII control characters (0-31) or DEL (127)
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      return false;
    }
  }

  return true;
}

/**
 * Resolves the designated fallback path based on search parameters.
 * Defaults to '/dashboard' for restaurant portal or '/admin' when designated.
 */
function getDesignatedFallback(searchParams: URLSearchParams): string {
  const fallback = searchParams.get('fallback');
  if (fallback && isSafeRelativePath(fallback)) {
    return fallback.trim();
  }

  const role = searchParams.get('role');
  const type = searchParams.get('type');
  if (role === 'operator_admin' || role === 'admin' || type === 'admin') {
    return '/admin';
  }

  return '/dashboard';
}

/**
 * Supabase Auth PKCE code exchange handler.
 * Handles redirects from email verification links and OAuth providers.
 * Robustly hardened against CWE-601 Open Redirect and invalid URL TypeError crashes.
 */
export async function GET(request: NextRequest) {
  let origin = 'http://localhost:3000';
  let searchParams: URLSearchParams;

  try {
    const requestUrl = new URL(request.url);
    origin = requestUrl.origin && requestUrl.origin !== 'null' ? requestUrl.origin : origin;
    searchParams = requestUrl.searchParams;
  } catch {
    // Fallback if request.url cannot be parsed
    origin = request.nextUrl?.origin || origin;
    searchParams = request.nextUrl?.searchParams || new URLSearchParams();
  }

  const code = searchParams.get('code');
  const rawNext = searchParams.get('next');
  const fallbackPath = getDesignatedFallback(searchParams);

  if (code) {
    try {
      const supabase = await createServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // Continue to redirect in demo/offline mode
    }
  }

  // Determine target path: validate relative path or fallback safely
  const targetPath = isSafeRelativePath(rawNext) ? rawNext.trim() : fallbackPath;

  try {
    const redirectUrl = new URL(targetPath, origin);

    // Defense-in-depth: guarantee resolved origin strictly matches expected origin
    if (redirectUrl.origin === origin) {
      return NextResponse.redirect(redirectUrl);
    }

    // Origin mismatch detected - fallback safely
    return NextResponse.redirect(new URL(fallbackPath, origin));
  } catch {
    // Prevent unhandled TypeError crashes on malformed inputs
    try {
      return NextResponse.redirect(new URL(fallbackPath, origin));
    } catch {
      return NextResponse.redirect(new URL('/dashboard', 'http://localhost:3000'));
    }
  }
}
```

---

## 6. Unit Test Specification for Verification

File: `frontend/__tests__/auth-callback.test.ts`

```typescript
import { NextRequest } from 'next/server';
import { GET } from '@/app/auth/callback/route';

const mockExchangeCodeForSession = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn().mockImplementation(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    })
  ),
}));

describe('Auth Callback Route Handler (GET /auth/callback)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
  });

  describe('CWE-601 Open Redirect Prevention', () => {
    it('redirects to /dashboard by default when next param is omitted', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('allows safe relative paths such as /dashboard and /admin', async () => {
      const req1 = new NextRequest('http://localhost:3000/auth/callback?next=/dashboard');
      const res1 = await GET(req1);
      expect(res1.headers.get('location')).toBe('http://localhost:3000/dashboard');

      const req2 = new NextRequest('http://localhost:3000/auth/callback?next=/admin');
      const res2 = await GET(req2);
      expect(res2.headers.get('location')).toBe('http://localhost:3000/admin');
    });

    it('allows relative paths with query parameters and hash fragments', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=/dashboard/orders?tab=active#details'
      );
      const res = await GET(req);
      expect(res.headers.get('location')).toBe(
        'http://localhost:3000/dashboard/orders?tab=active#details'
      );
    });

    it('blocks absolute external URLs (https://attacker.com) and falls back to /dashboard', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://attacker.com/steal-token'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks protocol-relative URLs (//attacker.com) and falls back to /dashboard', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=//attacker.com/phish'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks backslash normalization bypasses (/\\attacker.com)', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=/\\attacker.com'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('blocks pseudo-protocols (javascript: and data:)', async () => {
      const req1 = new NextRequest(
        'http://localhost:3000/auth/callback?next=javascript:alert(1)'
      );
      const res1 = await GET(req1);
      expect(res1.headers.get('location')).toBe('http://localhost:3000/dashboard');

      const req2 = new NextRequest(
        'http://localhost:3000/auth/callback?next=data:text/html,<script>alert(1)</script>'
      );
      const res2 = await GET(req2);
      expect(res2.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('falls back to /admin when role=operator_admin and next is external', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?next=https://attacker.com&role=operator_admin'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/admin');
    });
  });

  describe('Invalid URL & TypeError Crash Protection', () => {
    it('handles malformed URL strings like http:// without throwing 500 error', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=http://');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('handles empty or whitespace next strings gracefully', async () => {
      const req = new NextRequest('http://localhost:3000/auth/callback?next=%20%20');
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Supabase PKCE Code Exchange', () => {
    it('exchanges code for session when code parameter is present', async () => {
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?code=valid-pkce-auth-code&next=/dashboard'
      );
      const res = await GET(req);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-pkce-auth-code');
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });

    it('catches session exchange errors gracefully in offline/demo mode and still redirects', async () => {
      mockExchangeCodeForSession.mockRejectedValueOnce(
        new Error('Supabase unreachable')
      );
      const req = new NextRequest(
        'http://localhost:3000/auth/callback?code=invalid-code&next=/dashboard'
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });
});
```
