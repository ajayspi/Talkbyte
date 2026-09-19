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
