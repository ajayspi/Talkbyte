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

export const supabaseBrowser = () => createBrowserClient();
export { createBrowserClient as createClient };
export default createBrowserClient;
