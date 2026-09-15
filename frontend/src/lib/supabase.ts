import { createClient } from '@supabase/supabase-js';
import type {
  Database,
  Restaurant,
  MenuItem,
  Call,
  Order,
  AuditLog,
  PlatformStats,
  InfraService,
  Subscription,
  RestaurantUser,
} from '@/types/database.types';
import {
  MOCK_RESTAURANT,
  MOCK_FLEET_RESTAURANTS,
  MOCK_MENU_ITEMS,
  MOCK_LIVE_CALLS,
  MOCK_RECENT_ORDERS,
  MOCK_PLATFORM_STATS,
  MOCK_INFRA_SERVICES,
  MOCK_AUDIT_LOGS,
  MOCK_SUBSCRIPTIONS,
  MOCK_USERS,
} from './mockData';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_offline_build';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Checks if Supabase client can reach the live backend.
 */
export async function isSupabaseConnected(): Promise<boolean> {
  try {
    // Add a short timeout so tests don't hang if Supabase is inaccessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const { error } = await supabase.from('restaurants').select('id').limit(1).abortSignal(controller.signal);
    clearTimeout(timeoutId);
    return !error;
  } catch {
    return false;
  }
}

// Add a helper wrapper for queries to have a timeout
async function withTimeout<T>(queryPromise: PromiseLike<T>, timeoutMs = 2000): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });
  return Promise.race([queryPromise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

// In-memory store for local updates when offline or during demo
let localMenuItems: MenuItem[] = [...MOCK_MENU_ITEMS];

export async function getRestaurant(id?: string): Promise<Restaurant> {
  try {
    if (id) {
      const { data, error } = await withTimeout(supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single());
      if (!error && data) return data as unknown as Restaurant;
    }
  } catch {
    // Fall back to mock
  }
  return MOCK_RESTAURANT;
}

export async function getFleetRestaurants(): Promise<Restaurant[]> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('restaurants')
      .select('*')
      .order('name'));
    if (!error && data && data.length > 0) return data as unknown as Restaurant[];
  } catch {
    // Fall back to mock
  }
  return MOCK_FLEET_RESTAURANTS;
}

export async function getMenuItems(restaurantId?: string): Promise<MenuItem[]> {
  try {
    const query = supabase.from('menu_items').select('*');
    if (restaurantId) query.eq('restaurant_id', restaurantId);
    const { data, error } = await withTimeout(query.order('category'));
    if (!error && data && data.length > 0) return data as unknown as MenuItem[];
  } catch {
    // Fall back to mock
  }
  return localMenuItems;
}

export async function toggleMenuItemAvailability(
  itemId: string,
  available: boolean
): Promise<boolean> {
  try {
    const { error } = await withTimeout((supabase.from('menu_items') as any)
      .update({ available })
      .eq('id', itemId)) as { error: unknown };
    if (!error) {
      localMenuItems = localMenuItems.map((item) =>
        item.id === itemId ? { ...item, available } : item
      );
      return true;
    }
  } catch {
    // Fall back to mock
  }
  localMenuItems = localMenuItems.map((item) =>
    item.id === itemId ? { ...item, available } : item
  );
  return true;
}

export async function getLiveCalls(restaurantId?: string): Promise<Call[]> {
  try {
    const query = supabase.from('calls').select('*');
    if (restaurantId) query.eq('restaurant_id', restaurantId);
    const { data, error } = await withTimeout(query.order('started_at', {
      ascending: false,
    }));
    if (!error && data && data.length > 0) return data as unknown as Call[];
  } catch {
    // Fall back to mock
  }
  return MOCK_LIVE_CALLS;
}

export async function getRecentOrders(
  restaurantId?: string,
  limit: number = 20
): Promise<Order[]> {
  try {
    const query = supabase.from('orders').select('*');
    if (restaurantId) query.eq('restaurant_id', restaurantId);
    const { data, error } = await withTimeout(query
      .order('created_at', { ascending: false })
      .limit(limit));
    if (!error && data && data.length > 0) return data as unknown as Order[];
  } catch {
    // Fall back to mock
  }
  return MOCK_RECENT_ORDERS;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  return MOCK_PLATFORM_STATS;
}

export async function getInfraServices(): Promise<InfraService[]> {
  return MOCK_INFRA_SERVICES;
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit));
    if (!error && data && data.length > 0) return data as unknown as AuditLog[];
  } catch {
    // Fall back to mock
  }
  return MOCK_AUDIT_LOGS;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false }));
    if (!error && data && data.length > 0) return data as unknown as Subscription[];
  } catch {
    // Fall back to mock
  }
  return MOCK_SUBSCRIPTIONS;
}

export async function getUsers(): Promise<RestaurantUser[]> {
  try {
    const { data, error } = await withTimeout(supabase
      .from('restaurant_users')
      .select('*')
      .order('created_at', { ascending: false }));
    if (!error && data && data.length > 0) return data as unknown as RestaurantUser[];
  } catch {
    // Fall back to mock
  }
  return MOCK_USERS;
}
