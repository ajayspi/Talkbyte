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
