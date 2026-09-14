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
