export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Restaurant = {
  id: string;
  name: string;
  phone_number: string | null;
  telnyx_number: string | null;
  plan_id: 'starter' | 'growth' | 'enterprise' | string;
  active: boolean;
  ai_instructions: string | null;
  timezone: string;
  tts_provider?: 'elevenlabs' | 'cartesia' | string;
  voice_id?: string | null;
  health_score?: number;
  pos_provider?: 'square' | 'lightspeed' | 'kounta' | string;
  pos_status?: 'connected' | 'syncing' | 'error' | 'disconnected' | string;
  status?: 'active' | 'at_risk' | 'churning' | 'trial' | 'suspended' | string;
  mrr?: number;
  calls_month?: number;
  orders_month?: number;
  completion_rate?: number;
  holiday_closure_mode?: boolean;
  voice_persona?: string;
  allow_manual_takeover?: boolean;
  transfer_low_confidence?: boolean;
  created_at: string;
};

export type RestaurantUser = {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'readonly' | string;
  created_at: string;
  updated_at?: string;
  email?: string;
  name?: string;
};

export type RestaurantIntegration = {
  id: string;
  restaurant_id: string;
  provider: 'square' | 'stripe' | 'twilio' | 'shopify' | string;
  config: Json;
  credentials: Json;
  api_key?: string | null;
  metadata?: Json;
  status: 'active' | 'inactive' | 'error' | 'disconnected' | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RestaurantStaffView = {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'readonly' | string;
  created_at: string;
  updated_at: string;
  name: string | null;
  email: string | null;
  last_login: string | null;
};

export type MenuItem = {
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
};

export type CallTranscriptEntry = {
  role: 'ai' | 'customer' | 'system';
  text: string;
  time?: string;
};

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

export type Call = {
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
};

export type OrderItem = {
  name: string;
  qty: number;
  price_cents: number;
  modifiers?: string[];
};

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

export type Order = {
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
};

export type PaymentEvent = {
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
};

export type Plan = {
  id: 'starter' | 'growth' | 'enterprise' | string;
  name: string;
  monthly_cents: number;
  monthly_price?: number;
  call_limit: number;
  call_minutes_included?: number;
  features?: string[];
};

export type Subscription = {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  plan_id: string;
  plan_name?: string;
  stripe_subscription_id: string | null;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing' | string;
  current_period_end: string | null;
  created_at: string;
};

export type BillingEvent = {
  id: string;
  restaurant_id: string;
  event_type: string;
  amount_cents: number | null;
  plan_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  created_at: string;
};

export type AuditLog = {
  id: string;
  timestamp: string;
  event_type: 'ORDER' | 'ESCALATION' | 'BILLING' | 'SYSTEM' | 'POS' | 'AUTH' | 'RESTAURANT' | 'ONBOARD' | string;
  actor: string;
  resource: string;
  details: string;
  ip_address: string;
  status?: 'success' | 'warning' | 'error' | 'info' | string;
};

export type PlatformStats = {
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
};

export type InfraService = {
  name: string;
  category: 'voice' | 'ai' | 'infra' | 'payment' | 'pos';
  status: 'operational' | 'degraded' | 'outage';
  latencyMs: number;
  uptimePercent: number;
  errorRatePercent: number;
  metricLabel: string;
  metricValue: string;
};

export type Database = {
  __InternalSupabase?: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      restaurants: {
        Row: Restaurant;
        Insert: Partial<Restaurant>;
        Update: Partial<Restaurant>;
        Relationships: [];
      };
      restaurant_users: {
        Row: RestaurantUser;
        Insert: Partial<RestaurantUser>;
        Update: Partial<RestaurantUser>;
        Relationships: [];
      };
      menu_items: {
        Row: MenuItem;
        Insert: Partial<MenuItem>;
        Update: Partial<MenuItem>;
        Relationships: [];
      };
      calls: {
        Row: Call;
        Insert: Partial<Call>;
        Update: Partial<Call>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: Partial<Order>;
        Update: Partial<Order>;
        Relationships: [];
      };
      payment_events: {
        Row: PaymentEvent;
        Insert: Partial<PaymentEvent>;
        Update: Partial<PaymentEvent>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription>;
        Update: Partial<Subscription>;
        Relationships: [];
      };
      plans: {
        Row: Plan;
        Insert: Partial<Plan>;
        Update: Partial<Plan>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      billing_events: {
        Row: BillingEvent;
        Insert: Partial<BillingEvent>;
        Update: Partial<BillingEvent>;
        Relationships: [];
      };
      restaurant_integrations: {
        Row: RestaurantIntegration;
        Insert: Partial<RestaurantIntegration>;
        Update: Partial<RestaurantIntegration>;
        Relationships: [];
      };
      system_health_logs: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      admin_users: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: [];
      };
    };
    Views: {
      restaurant_staff_view: {
        Row: RestaurantStaffView;
        Relationships: [];
      };
    };
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
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
