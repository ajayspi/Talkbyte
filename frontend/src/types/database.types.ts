export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Restaurant {
  id: string;
  name: string;
  phone_number: string | null;
  telnyx_number: string | null;
  plan_id: 'starter' | 'growth' | 'enterprise' | string;
  active: boolean;
  ai_instructions: string | null;
  timezone: string;
  health_score?: number;
  pos_provider?: 'square' | 'lightspeed' | 'kounta' | string;
  pos_status?: 'connected' | 'syncing' | 'error' | 'disconnected' | string;
  status?: 'active' | 'at_risk' | 'churning' | 'trial' | 'suspended' | string;
  mrr?: number;
  calls_month?: number;
  orders_month?: number;
  completion_rate?: number;
  created_at: string;
}

export interface RestaurantUser {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'readonly' | string;
  created_at: string;
  email?: string;
  name?: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  price?: number; // In AUD dollars
  category: string | null;
  available: boolean;
  embedding?: number[] | null;
  created_at: string;
}

export interface CallTranscriptEntry {
  role: 'ai' | 'customer' | 'system';
  text: string;
  time?: string;
}

export type CallState =
  | 'GREETING'
  | 'TAKING_ORDER'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'PAYMENT_SENT'
  | 'COMPLETE'
  | 'TRANSFER_TO_HUMAN'
  | 'CALL_DROPPED'
  | 'POS_FAILED'
  | 'PAYMENT_EXPIRED'
  | string;

export interface Call {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  caller_number: string;
  caller_phone?: string;
  state: CallState;
  started_at: string;
  ended_at: string | null;
  duration_seconds?: number;
  transcript: CallTranscriptEntry[] | Json;
  stt_confidence: number | null;
  livekit_room: string | null;
  sentiment?: 'positive' | 'neutral' | 'negative' | string;
  order_items_preview?: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  price_cents: number;
  modifiers?: string[];
}

export type OrderState =
  | 'PLACED'
  | 'LINK_SENT'
  | 'PAID'
  | 'SYNCED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'Placed'
  | 'Link Sent'
  | 'Paid'
  | 'Synced'
  | 'Expired'
  | string;

export interface Order {
  id: string;
  call_id: string | null;
  restaurant_id: string;
  items: OrderItem[] | Json;
  total_cents: number;
  total_amount?: number; // In AUD dollars
  state: OrderState;
  pos_order_id: string | null;
  customer_phone?: string;
  customer_name?: string;
  created_at: string;
}

export interface PaymentEvent {
  id: string;
  order_id: string;
  stripe_payment_link?: string | null;
  stripe_session_id: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
  status?: 'pending' | 'completed' | 'expired' | 'failed' | 'paid' | string;
  amount_cents?: number;
  created_at?: string;
}

export interface Plan {
  id: 'starter' | 'growth' | 'enterprise' | string;
  name: string;
  monthly_cents: number;
  monthly_price?: number;
  call_limit: number;
  call_minutes_included?: number;
  features?: string[];
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  plan_id: string;
  plan_name?: string;
  stripe_subscription_id: string | null;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing' | string;
  current_period_end: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event_type: 'ORDER' | 'ESCALATION' | 'BILLING' | 'SYSTEM' | 'POS' | 'AUTH' | 'RESTAURANT' | 'ONBOARD' | string;
  actor: string;
  resource: string;
  details: string;
  ip_address: string;
  status?: 'success' | 'warning' | 'error' | 'info' | string;
}

export interface PlatformStats {
  activeCallsCount: number;
  totalVenues: number;
  todayCallsCount: number;
  todayOrdersCount: number;
  todayRevenueCents: number;
  mrrCents: number;
  grossMarginPercent: number;
  avgCallDurationSeconds: number;
  cogsPerMinuteAud: number;
  sttAccuracyPercent: number;
  uptimePercent: number;
}

export interface InfraService {
  name: string;
  category: 'voice' | 'ai' | 'infra' | 'payment' | 'pos';
  status: 'operational' | 'degraded' | 'outage';
  latencyMs: number;
  uptimePercent: number;
  errorRatePercent: number;
  metricLabel: string;
  metricValue: string;
}

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant;
        Insert: Partial<Restaurant>;
        Update: Partial<Restaurant>;
      };
      restaurant_users: {
        Row: RestaurantUser;
        Insert: Partial<RestaurantUser>;
        Update: Partial<RestaurantUser>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Partial<MenuItem>;
        Update: Partial<MenuItem>;
      };
      calls: {
        Row: Call;
        Insert: Partial<Call>;
        Update: Partial<Call>;
      };
      orders: {
        Row: Order;
        Insert: Partial<Order>;
        Update: Partial<Order>;
      };
      payment_events: {
        Row: PaymentEvent;
        Insert: Partial<PaymentEvent>;
        Update: Partial<PaymentEvent>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription>;
        Update: Partial<Subscription>;
      };
      plans: {
        Row: Plan;
        Insert: Partial<Plan>;
        Update: Partial<Plan>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_menu: {
        Args: {
          p_restaurant_id: string;
          query_embedding: number[];
          match_count?: number;
        };
        Returns: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          category: string | null;
          similarity: number;
        }[];
      };
    };
  };
}
