import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  isSupabaseConnected,
  getRestaurant,
  getFleetRestaurants,
  getMenuItems,
  toggleMenuItemAvailability,
  getLiveCalls,
  getRecentOrders,
  getPlatformStats,
  getInfraServices,
  getAuditLogs,
  getSubscriptions,
  getUsers,
} from '@/lib/supabase';

describe('Supabase Integration & Mock Fallback Layer', () => {
  it('should return connection status boolean', async () => {
    const connected = await isSupabaseConnected();
    expect(typeof connected).toBe('boolean');
  });

  describe('getRestaurant', () => {
    it('should return default restaurant details when no id is passed', async () => {
      const restaurant = await getRestaurant();
      expect(restaurant).toBeDefined();
      expect(restaurant.id).toBe('rest-mamas-pizzeria-001');
      expect(restaurant.name).toBe("Mama's Pizzeria");
      expect(restaurant.health_score).toBeGreaterThanOrEqual(90);
      expect(restaurant.pos_provider).toBe('Square POS');
    });

    it('should return restaurant with matching properties when queried', async () => {
      const restaurant = await getRestaurant('rest-mamas-pizzeria-001');
      expect(restaurant).toBeDefined();
      expect(restaurant.name).toBe("Mama's Pizzeria");
    });
  });

  describe('getFleetRestaurants', () => {
    it('should return a list of fleet restaurants', async () => {
      const fleet = await getFleetRestaurants();
      expect(Array.isArray(fleet)).toBe(true);
      expect(fleet.length).toBeGreaterThan(0);
      expect(fleet[0]).toHaveProperty('id');
      expect(fleet[0]).toHaveProperty('name');
      expect(fleet[0]).toHaveProperty('health_score');
      expect(fleet[0]).toHaveProperty('pos_status');
    });
  });

  describe('getMenuItems & toggleMenuItemAvailability', () => {
    it('should return menu items with category, price, and availability', async () => {
      const items = await getMenuItems('rest-mamas-pizzeria-001');
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      const firstItem = items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('price_cents');
      expect(firstItem).toHaveProperty('available');
    });

    it.skip('should toggle item availability successfully', async () => {
      const items = await getMenuItems('rest-mamas-pizzeria-001');
      const targetItem = items[0];
      const initialStatus = targetItem.available;

      const success = await toggleMenuItemAvailability(targetItem.id, !initialStatus);
      expect(success).toBe(true);

      const updatedItems = await getMenuItems('rest-mamas-pizzeria-001');
      const updated = updatedItems.find((i) => i.id === targetItem.id);
      expect(updated?.available).toBe(!initialStatus);

      // Revert back
      await toggleMenuItemAvailability(targetItem.id, initialStatus);
    });
  });

  describe('getLiveCalls', () => {
    it('should return active calls with caller, duration, and state', async () => {
      const calls = await getLiveCalls();
      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBeGreaterThan(0);
      const call = calls[0];
      expect(call).toHaveProperty('id');
      expect(call).toHaveProperty('restaurant_id');
      expect(call).toHaveProperty('state');
      expect(call).toHaveProperty('transcript');
      expect(call.transcript).toBeDefined();
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with items and total amounts', async () => {
      const orders = await getRecentOrders('rest-mamas-pizzeria-001');
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      const order = orders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('total_cents');
      expect(order).toHaveProperty('state');
      expect(order).toHaveProperty('items');
    });
  });

  describe('getPlatformStats', () => {
    it('should return platform operator statistics', async () => {
      const stats = await getPlatformStats();
      expect(stats).toBeDefined();
      expect(stats.totalVenues).toBe(487);
      expect(stats.activeCallsCount).toBe(23);
      expect(stats.cogsPerMinuteAud).toBe(0.062);
      expect(stats.uptimePercent).toBeGreaterThan(99);
    });
  });

  describe('getInfraServices', () => {
    it('should return 9 infrastructure service cards', async () => {
      const services = await getInfraServices();
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBe(9);
      const telnyx = services.find((s) => s.name.includes('Telnyx'));
      expect(telnyx).toBeDefined();
      expect(telnyx?.status).toBe('operational');
      const deepgram = services.find((s) => s.name.includes('Deepgram'));
      expect(deepgram).toBeDefined();
      const livekit = services.find((s) => s.name.includes('LiveKit'));
      expect(livekit).toBeDefined();
    });
  });

  describe('getAuditLogs', () => {
    it('should return security audit logs with timestamps and actors', async () => {
      const logs = await getAuditLogs();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      const log = logs[0];
      expect(log).toHaveProperty('event_type');
      expect(log).toHaveProperty('actor');
      expect(log).toHaveProperty('resource');
      expect(log).toHaveProperty('details');
    });
  });

  describe('getSubscriptions & getUsers', () => {
    it('should return subscriptions list', async () => {
      const subs = await getSubscriptions();
      expect(Array.isArray(subs)).toBe(true);
      expect(subs.length).toBeGreaterThan(0);
      expect(subs[0]).toHaveProperty('plan_id');
      expect(subs[0]).toHaveProperty('status');
    });

    it('should return users list with RBAC roles', async () => {
      const users = await getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('role');
      expect(users[0]).toHaveProperty('email');
    });
  });
});
