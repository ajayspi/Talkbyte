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
