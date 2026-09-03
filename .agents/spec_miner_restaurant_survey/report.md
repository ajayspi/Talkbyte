# TalkByte Restaurant Dashboard — Comprehensive Specification Report

**Document Version**: 1.0.0  
**Source Analyzed**: `talkbyte-restaurant-dashboard.html` (771 lines)  
**Target Platform**: Next.js 16 (App Router) + Supabase + Tailwind CSS / shadcn/ui  
**Date**: 2026-09-03  

---

## Executive Summary
`talkbyte-restaurant-dashboard.html` is the operational portal for restaurant owners and managers using TalkByte's AI Voice Platform. The interface manages real-time voice call monitoring, live call interception, order intake pipeline with SMS payment links, POS synchronization, menu catalog management with instant AI RAG sync, business and AI voice persona configuration, monthly quota tracking, and multi-tenant staff permissions.

---

## 1. Features, Pages/Tabs & Layout Architecture

### 1.1 Layout Shell Structure
- **Fixed Sidebar Navigation (`width: 240px`, `#1a0a1e` dark theme)**:
  - **Logo & Branding**: `🎙️` gradient badge, "TalkByte", subtitle "AI Voice Platform".
  - **Venue Selector / Identity Pill (`.venue-picker`)**: Shows current restaurant name ("Mama's Pizzeria") and location/plan ("Newtown, Sydney · Pro Plan"). Supports multi-restaurant switching for multi-unit operators.
  - **Grouped Navigation Links**:
    - **Operations**:
      - `Dashboard` (`⚡` icon): Executive real-time summary, onboarding checklist, alerts, daily KPIs, mini-active call widget, recent orders table, hourly call volume chart, customer sentiment feed.
      - `Live Calls` (`📞` icon): Real-time WebRTC audio monitor, live call transcripts, confidence scores, staff takeover/monitor controls, and historical call log table. Pulsing green dot badge (`.live-pulse`) signifies ongoing live calls.
      - `Orders` (`🛒` icon): Live order pipeline, payment status progression timeline, POS sync status, link resend/retry actions, status filter, CSV export. Badge counter (`.nav-badge`) displays pending attention count ("3").
    - **Management**:
      - `Menu` (`🍽️` icon): Menu catalog management, category filtering pills, real-time availability switches (30-second AI RAG update guarantee), item creation, CSV/web import.
      - `Analytics` (`📊` icon): Time-range selector (7d, 30d, custom), KPI performance cards, 7-day call volume line chart, 7-day revenue line chart, 14-hour x 7-day peak hours heatmap, top ordered items table.
    - **Account**:
      - `Billing & Plan` (`💳` icon): Active plan indicator, tier cards (Starter, Pro, Enterprise), monthly usage gauges (Calls, AI Minutes, SMS), billing history & invoice table.
      - `Settings` (`⚙️` icon): Business profile, TalkByte DID phone number, timezone, holiday closure toggle, integration status (Square, Stripe, Twilio/Telnyx, Shopify), AI persona configuration (name, greeting script, takeover switch, confidence transfer threshold), and staff RBAC table.
  - **Sidebar Footer (`.sidebar-footer`)**:
    - User Profile Pill (`.profile-pill`): Avatar circle ("JR"), user name ("John Rossi"), role ("Owner").
- **Sticky Topbar (`height: 58px`, `#fff` light theme)**:
  - **Dynamic Title & Subtitle**: `#page-title` and `#page-sub` updating dynamically per active tab.
  - **Header Actions**:
    - Global notification bell (`🔔`) with unread orange indicator dot (`.notif-dot`). Deep-links to Live Calls view.
    - Secondary Action Button (`Export` ghost button).
    - Primary Action Button (`+ Add Item` purple button).
- **Scrollable Main Content Area (`margin-left: 240px; padding: 24px 28px`)**:
  - Responsive grid layouts: `.kpi-grid` (4 columns), `.two-col` (50/50 split), `.three-col` (33/33/33 split).

---

## 2. Interactive Components Catalog

| Component Name | Screen / Section | Type | Props / Options / Values | Trigger & Event Handler | Expected Target State / API |
|----------------|------------------|------|--------------------------|-------------------------|-----------------------------|
| **Venue Selector** | Sidebar Header | Dropdown / Switcher | `restaurant_id`, `name`, `location`, `plan` | `onClick` | Switches active restaurant context and refreshes all metrics and tables |
| **Nav Item Links** | Sidebar Nav | Navigation Links | `dashboard`, `livecalls`, `orders`, `menu`, `analytics`, `billing`, `settings` | `onClick="show(id, this)"` | Changes active tab, updates topbar title/subtitle, triggers chart draws |
| **Notification Bell** | Topbar Right | Action Icon Button | Unread status badge | `onClick="show('livecalls', ...)"` | Switches directly to `livecalls` view to review active or flagged calls |
| **Global Export** | Topbar Right | Button | Primary context export | `onClick` | Exports currently visible view data (CSV/PDF) |
| **Global Add Item** | Topbar Right | Button | Quick Action | `onClick` | Opens "Add Menu Item" modal dialog |
| **Connect POS CTA** | Dashboard Onboarding | CTA Button | Next setup step | `onClick` | Opens POS integration setup wizard (Square/Lightspeed) |
| **Review Orders Link** | Dashboard Warning Alert | Text Action Link | Link to filtered orders | `onClick="show('orders', ...)"` | Switches to `orders` tab with filter set to 'Expired' |
| **Take Over Call** | Dashboard & Live Calls | Danger/Alert Button (`.call-btn-intercept`) | `call_id`, `livekit_room` | `onClick` | Mutes AI in LiveKit room, joins staff mic/audio, marks call `TRANSFER_TO_HUMAN` |
| **Monitor Only** | Dashboard & Live Calls | Secondary Button (`.call-btn-monitor`) | `call_id`, `livekit_room` | `onClick` | Subscribes staff audio track to LiveKit room in muted listening mode |
| **End Call** | Live Calls | Destructive Button | `call_id` | `onClick` | Sends hangup command to Telnyx/LiveKit agent session |
| **Status Filter Dropdown** | Orders Tab Header | Select Dropdown | `All Status`, `Paid`, `Link Sent`, `Expired`, `POS Synced` | `onChange` | Filters table rows client-side or queries `/api/orders?status=...` |
| **Export Orders CSV** | Orders Tab Header | Button | CSV export | `onClick` | Downloads CSV of current orders table matching filters |
| **Order Action: View** | Orders Table Row | Button (`.call-btn-monitor`) | `order_id` | `onClick` | Opens order detail modal (itemized list, customer info, transcript link) |
| **Order Action: Resend Link** | Orders Table Row | Action Button (`.call-btn-intercept`) | `order_id` | `onClick` | Calls `POST /api/payments/create-link/{order_id}` to generate & SMS new link |
| **Order Action: Retry** | Orders Table Row | Action Button (`.call-btn-intercept`) | `order_id` | `onClick` | Triggers Celery worker task `push_order_to_pos.delay(order_id, restaurant_id)` |
| **Import from Website** | Menu Tab Header | Ghost Button | URL scraper | `onClick` | Opens web import modal to ingest online menu URL |
| **Upload CSV** | Menu Tab Header | Ghost Button | CSV parser | `onClick` | Opens file picker for batch menu upload |
| **Category Filter Pills** | Menu Tab | Horizontal Filter Pills | `All Items (24)`, `Pizzas (10)`, `Sides (6)`, `Drinks (5)`, `Desserts (3)` | `onClick` | Filters menu grid items by `category` |
| **Item Availability Toggle** | Menu Item Card | Toggle Switch (`.toggle`) | `item_id`, `available: boolean` | `onClick="this.classList.toggle('on')"` | Updates `menu_items.available` in DB; invalidates RAG cache within 30s |
| **Add New Item Card** | Menu Grid (last item) | Dashed Card Button | Add item prompt | `onClick="alert('Add item coming soon')"` | Opens Item Creation Dialog form |
| **Analytics Date Range** | Analytics Tab Header | Button Group | `7 Days` (active), `30 Days`, `Custom` | `onClick` | Re-fetches analytics aggregation endpoint for specified date window |
| **Plan Selection Cards** | Billing Tab | Interactive Cards | `Starter ($500)`, `Pro ($1500)`, `Enterprise ($3500)` | `onClick` | Initiates Stripe Customer Portal or plan upgrade checkout session |
| **Business Name Input** | Settings Tab | Text Input | `restaurants.name` | `onChange` | Updates restaurant business name |
| **DID Phone Number** | Settings Tab | Read-only Text Input | `restaurants.telnyx_number` | Display only | Shows provisioned TalkByte inbound phone number |
| **Timezone Select** | Settings Tab | Select Dropdown | `AEST (UTC+10)`, `AEDT (UTC+11)` | `onChange` | Updates `restaurants.timezone` |
| **Holiday Closure Toggle** | Settings Tab | Toggle Switch (`.toggle`) | `holiday_closure_mode: boolean` | `onClick` | Enables automated holiday greeting and voicemail redirect |
| **Connect POS Integration** | Settings Tab | Action Button | Integration provider (e.g. Shopify) | `onClick` | Initiates OAuth flow for POS integration |
| **Voice Persona Name** | Settings Tab | Text Input | `persona_name` (e.g. "Aria") | `onChange` | Updates system prompt persona identity |
| **Greeting Script Textarea** | Settings Tab | Textarea | `restaurants.ai_instructions` | `onChange` | Updates initial inbound greeting prompt spoken by AI |
| **Allow Takeover Toggle** | Settings Tab | Toggle Switch (`.toggle.on`) | `allow_manual_takeover: boolean` | `onClick` | Toggles WebRTC interception permission |
| **Low Confidence Transfer** | Settings Tab | Toggle Switch (`.toggle.on`) | `transfer_low_confidence: boolean` | `onClick` | Sets auto-transfer when STT/LLM confidence < 70% |
| **Invite Staff Button** | Settings Tab | Ghost Button | Staff invitation | `onClick` | Opens modal to send invite email and assign role |

---

## 3. Tables and Lists Specification

### 3.1 Recent Orders Table (Dashboard Overview)
- **Container**: Card in left column of Dashboard.
- **Header**: Title "Recent Orders", action link "View all →".
- **Columns**:
  1. `Order`: Monospace/bold order identifier (e.g., `#1047`).
  2. `Items`: Summary line of ordered items (e.g., `Margherita L, Garlic ×2`).
  3. `Total`: Formatted currency total including GST (e.g., `<strong>$38.50</strong>`).
  4. `Status`: Colored pill badge.
- **Sample Rows**:
  - `#1047` | `Margherita L, Garlic ×2` | `$38.50` | `<span class="badge badge-green">✓ Paid</span>`
  - `#1046` | `Pepperoni XL, Coke ×3` | `$54.00` | `<span class="badge badge-yellow">⏳ Link Sent</span>`
  - `#1045` | `Veggie Special, Tiramisu` | `$42.80` | `<span class="badge badge-green">✓ POS Synced</span>`
  - `#1044` | `Quattro Stagioni` | `$28.00` | `<span class="badge badge-red">✗ Link Expired</span>`

### 3.2 Recent Calls Today Table (Live Calls Tab)
- **Container**: Card in Live Calls tab.
- **Header**: Title "Recent Calls — Today".
- **Columns**:
  1. `Time`: 24-hour timestamp (e.g., `14:22`, `14:08`).
  2. `Number`: Masked phone number (e.g., `+61 4•• ••• 211`).
  3. `Type`: Call classification tag (`Order`, `Inquiry`).
  4. `Duration`: mm:ss format (e.g., `1:54`, `3:12`, `0:38`, `4:30`).
  5. `Outcome`: Status badge:
     - `Order Placed` (`.badge-green`)
     - `Link Sent` (`.badge-yellow`)
     - `Answered` (`.badge-blue`)
     - `Link Expired` (`.badge-red`)
     - `Transferred` (`.badge-purple`)
  6. `Confidence`: Percentage STT confidence score (e.g., `98%`, `94%`, `91%`, `96%`, `62%`).
  7. `Sentiment`: Sentiment emoji + label (`😊 Positive`, `😐 Neutral`, `😞 Negative`).

### 3.3 All Orders — Today Table (Orders Tab)
- **Container**: Full-width card with filter header.
- **Header Controls**: Status Select Dropdown, "Export CSV" button, subtext "Payment flow: Order Placed → Link Sent → Paid → POS Synced".
- **Columns**:
  1. `Order #`: Order reference (e.g., `#1047`).
  2. `Time`: Time placed (e.g., `14:22`).
  3. `Items`: Full comma-separated order items and modifications.
  4. `Total (incl. GST)`: Bold dollar amount (e.g., `$38.50`).
  5. `Payment`: 3-stage visual timeline component (`.order-timeline`):
     - Stage 1: Order Placed
     - Stage 2: Link Sent
     - Stage 3: Paid
     - Dots: `.tl-dot.done` (✓ green), `.tl-dot.active` (→ purple pulsing), `.tl-dot.pending` (○ gray), `.tl-dot` (✗ red).
  6. `POS`: POS sync badge (`Synced` green, `Pending` gray, `Failed` red).
  7. `Action`: Contextual action button:
     - "View" for completed/synced orders.
     - "Resend Link" for pending/unpaid orders.
     - "Retry" for failed POS push orders.

### 3.4 Billing History Table (Billing Tab)
- **Container**: Card in Billing tab.
- **Columns**:
  1. `Month`: Billing cycle period (e.g., `Aug 2026`, `Jul 2026`, `Jun 2026`, `May 2026`).
  2. `Amount`: Fixed subscription charge (e.g., `$1,500`, `$500`).
  3. `Status`: Badge indicator (`Due 1 Sep` yellow, `✓ Paid` green).

### 3.5 Staff Access Table (Settings Tab)
- **Container**: Card in Settings tab.
- **Columns**:
  1. `Name`: Staff member full name (e.g., `John Rossi`, `Sarah M.`, `+ Invite Staff`).
  2. `Role`: Role pill (`Owner` purple, `Manager` blue, `Staff` gray).
  3. `Last Login`: Relative login time (e.g., `Now`, `2h ago`).
  4. `Actions`: Action button ("Send Invite" button for row 3).

### 3.6 Sentiment Feed List (Dashboard Overview)
- **Container**: Card "Customer Sentiment — Last 7 Days".
- **Elements**: 4 rows showing circular emoji avatar (`😊` green pos, `😐` gray neu, `😞` red neg), weekday + sentiment title, quoted transcript snippet, and satisfaction percentage badge.

### 3.7 Top Ordered Items List (Analytics Tab)
- **Container**: Card "Top Ordered Items".
- **Elements**: List of 5 items showing emoji + name, total order count, and total gross revenue:
  - 🍕 Margherita L: 78 orders, $1,443
  - 🍕 Pepperoni XL: 54 orders, $1,188
  - 🍞 Garlic Bread: 102 orders, $714
  - 🍕 Veggie Special M: 42 orders, $903
  - 🍰 Tiramisu: 31 orders, $217

### 3.8 Integrations List (Settings Tab)
- **Container**: Card "Integrations".
- **Elements**: List of 4 third-party connectors:
  - Square POS: Connected (green dot badge)
  - Stripe Checkout: Active (green dot badge)
  - Twilio SMS / Telnyx: Active (green dot badge)
  - Shopify POS: Not configured, "Connect" action button

---

## 4. Charts, Metrics Cards and Visual Indicators

### 4.1 KPI Metrics Cards Breakdown

| Screen | Card Label | Current Value | Trend Indicator | Trend Status | Accent Color | Icon |
|--------|------------|---------------|-----------------|--------------|--------------|------|
| **Dashboard** | Calls Today | `47` | `↑ 18% vs yesterday` | Positive (green) | Purple (`#7c3aed`) | `📞` |
| **Dashboard** | Revenue Today | `$1,284` | `↑ $320 vs yesterday` | Positive (green) | Teal (`#14b8a6`) | `💰` |
| **Dashboard** | AI Answer Rate | `96%` | `↑ 2% vs last week` | Positive (green) | Orange (`#FF6B35`) | `🤖` |
| **Dashboard** | Customer Satisfaction | `4.7` | `— Same as last week` | Neutral (gray) | Green (`#16a34a`) | `⭐` |
| **Live Calls** | Active Now | `2` | N/A (Live count) | Live | Purple (`#7c3aed`) | `📞` |
| **Live Calls** | Calls Today | `47` | N/A (Cumulative) | Static | Green (`#16a34a`) | `✅` |
| **Live Calls** | Avg Duration | `2:18` | N/A (Rolling avg) | Static | Teal (`#14b8a6`) | `⏱️` |
| **Live Calls** | Success Rate | `96%` | N/A (Conversion) | Static | Orange (`#FF6B35`) | `🎯` |
| **Orders** | Today's Revenue | `$1,284` | N/A (Daily total) | Static | Teal (`#14b8a6`) | `💰` |
| **Orders** | Orders Today | `47` | N/A (Daily count) | Static | Purple (`#7c3aed`) | `🛒` |
| **Orders** | Avg Order Value | `$27.30` | N/A (Calculated) | Static | Orange (`#FF6B35`) | `📊` |
| **Orders** | POS Sync Rate | `98%` | N/A (System health) | Static | Green (`#16a34a`) | `🔄` |
| **Analytics** | Total Calls | `312` | `↑ 24% vs prior week` | Positive (green) | Purple (`#7c3aed`) | `📞` |
| **Analytics** | Revenue | `$8,420` | `↑ 18%` | Positive (green) | Teal (`#14b8a6`) | `💰` |
| **Analytics** | Order Conversion | `82%` | `↑ 5%` | Positive (green) | Green (`#16a34a`) | `🎯` |
| **Analytics** | Avg Handle Time | `2:18` | `↓ 12s improvement` | Positive (green) | Orange (`#FF6B35`) | `⏱️` |

### 4.2 Data Visualizations & Charts Specification
1. **Calls Today by Hour (`#callsChart`)**:
   - **Type**: Bar chart (Chart.js / Recharts).
   - **X-Axis**: 14 hour buckets (`8am`, `9`, `10`, `11`, `12pm`, `1`, `2`, `3`, `4`, `5`, `6pm`, `7`, `8`, `9`).
   - **Data**: `[2, 3, 4, 5, 12, 15, 9, 6, 5, 7, 14, 18, 10, 4]`.
   - **Styling**: Rounded bar tops (`borderRadius: 6`), purple fill (`rgba(124, 58, 237, 0.7)`), hidden legend, subtle horizontal gridlines (`#f3f4f6`).
2. **Call Volume — Last 7 Days (`#weekChart`)**:
   - **Type**: Filled Line / Area chart.
   - **X-Axis**: Days of the week (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`).
   - **Data**: `[38, 42, 35, 51, 48, 62, 36]`.
   - **Styling**: Line color purple (`#7c3aed`), fill purple with 10% opacity, cubic spline smoothing (`tension: 0.4`), circular point markers (`radius: 4`).
3. **Revenue — Last 7 Days (`#revenueChart`)**:
   - **Type**: Filled Line / Area chart.
   - **X-Axis**: Days of the week (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`).
   - **Data**: `[920, 1050, 870, 1380, 1240, 1620, 940]`.
   - **Styling**: Line color teal (`#14b8a6`), fill teal with 10% opacity, curve tension 0.4, Y-axis currency formatted (`$v`).
4. **Peak Hours Heatmap**:
   - **Type**: CSS Grid Heatmap (7 rows x 14 columns).
   - **Rows**: Mon, Tue, Wed, Thu, Fri, Sat, Sun.
   - **Columns**: 8am to 9pm.
   - **Intensity Function**: Dynamic background opacity `rgba(124, 58, 237, (value / 18) * 0.8 + 0.05)`.
5. **Usage Quota Meter Bars**:
   - **Type**: Progress gauge bar with dual-color gradient fill (`linear-gradient(90deg, #7c3aed, #14b8a6)`).
   - **Bars**:
     - Calls Used: `4,841 / 10,000` (48% width).
     - AI Minutes: `11,183 / 25,000` (45% width).
     - SMS Sent: `3,920 / 10,000` (39% width).

---

## 5. Domain Models & Supabase Schema Mapping

The prototype implies eight core domain models that directly map to the backend PostgreSQL / Supabase schema defined in `backend/supabase_schema.sql` and backend Pydantic models in `backend/app/models/`:

### 5.1 Model Mapping Reference

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   restaurants   │◀──────│restaurant_users │──────▶│   auth.users    │
└────────┬────────┘       └─────────────────┘       └─────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼              ▼
┌─────────────────┐ ┌────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   menu_items    │ │ calls  │ │   orders    │ │subscriptions│ │    plans    │
└─────────────────┘ └───┬────┘ └──────┬──────┘ └─────────────┘ └─────────────┘
                        │             │
                        └─────────────┼──────────────┐
                                      ▼              ▼
                               ┌─────────────┐ ┌─────────────┐
                               │payment_event│ │  pos_sync   │
                               └─────────────┘ └─────────────┘
```

### 5.2 Detailed Field Specifications

#### 1. `restaurants`
- `id` (UUID, PK): Unique restaurant identifier.
- `name` (text): Trading name ("Mama's Pizzeria").
- `phone_number` (text): Landline / transfer line.
- `telnyx_number` (text, unique): Dedicated TalkByte inbound voice DID (`+61 2 9999 1234`).
- `plan_id` (text, FK `plans.id`): Active tier ('starter', 'growth'/'pro', 'enterprise').
- `active` (boolean): Operational live status.
- `ai_instructions` (text): System prompt persona and instructions (e.g. greeting: *"Hi, welcome to Mama's Pizzeria! I'm Aria..."*).
- `timezone` (text): Venue timezone ("Australia/Sydney").
- *Implied Extensions*:
  - `holiday_closure_mode` (boolean): Whether closure IVR is engaged.
  - `allow_manual_takeover` (boolean): Permission for live audio interception.
  - `transfer_confidence_threshold` (float): Low confidence auto-transfer threshold (0.70).
  - `persona_name` (text): Virtual assistant name ("Aria").

#### 2. `calls`
- `id` (UUID, PK): Unique call session ID.
- `restaurant_id` (UUID, FK `restaurants.id`): Tenant foreign key.
- `caller_number` (text): E.164 formatted caller number (`+61400111222`), displayed masked (`+61 4•• ••• 847`).
- `state` (text): State machine status (`GREETING`, `TAKING_ORDER`, `CONFIRMING`, `CONFIRMED`, `PAYMENT_SENT`, `COMPLETE`, `TRANSFER_TO_HUMAN`, `CALL_DROPPED`, `POS_FAILED`, `PAYMENT_EXPIRED`).
- `started_at` (timestamptz): Call initiation timestamp.
- `ended_at` (timestamptz, nullable): Call termination timestamp.
- `transcript` (jsonb): Chronological array of dialog turns `[{speaker: 'ai'|'caller', text: str, timestamp: str}]`.
- `stt_confidence` (float): Speech recognition confidence score (0.0 to 1.0).
- `livekit_room` (text): LiveKit room identifier for real-time WebRTC audio listening and interception.
- *Implied Extensions*:
  - `call_type` (text): 'Order', 'Inquiry', 'Reservation'.
  - `sentiment` (text/float): 'Positive', 'Neutral', 'Negative' and satisfaction percentage.

#### 3. `orders`
- `id` (UUID, PK): Unique order ID.
- `order_number` (text): Human-readable sequential reference (e.g. `#1047`).
- `call_id` (UUID, FK `calls.id`, nullable): Inbound call origin.
- `restaurant_id` (UUID, FK `restaurants.id`): Tenant foreign key.
- `items` (jsonb): Array of item objects `[{name: str, qty: int, price_cents: int, notes: str}]`.
- `total_cents` (int): Total gross order amount in integer cents (e.g. 3850 = $38.50).
- `state` (text): Order lifecycle status (`CONFIRMED`, `POS_PUSHED`, `POS_FAILED`, `CANCELLED`).
- `pos_order_id` (text, nullable): External POS reference (Square / Lightspeed order ID).
- `created_at` (timestamptz): Creation timestamp.

#### 4. `payment_events`
- `id` (UUID, PK): Unique payment transaction record.
- `order_id` (UUID, FK `orders.id`): Associated order.
- `stripe_payment_link` (text): Hosted Stripe Checkout URL.
- `stripe_session_id` (text): Stripe Checkout Session reference.
- `sent_at` (timestamptz): SMS dispatch timestamp.
- `paid_at` (timestamptz, nullable): Webhook confirmation timestamp.
- `expires_at` (timestamptz): 30-minute expiration deadline.

#### 5. `menu_items`
- `id` (UUID, PK): Unique menu item ID.
- `restaurant_id` (UUID, FK `restaurants.id`): Tenant foreign key.
- `name` (text): Dish / item title ("Margherita", "Pepperoni Supreme").
- `description` (text): Item description, ingredients, sizing options.
- `price_cents` (int): Unit price in integer cents (e.g., 1850 for $18.50).
- `category` (text): Menu category ("Pizzas", "Sides", "Drinks", "Desserts").
- `available` (boolean): In-stock toggle for instant AI RAG inclusion/exclusion.
- `embedding` (vector(1536)): OpenAI `text-embedding-3-small` vector representation for pgvector semantic search.
- `created_at` (timestamptz): Item creation timestamp.

#### 6. `plans` & `subscriptions`
- `plans`:
  - `id` (text, PK): 'starter', 'growth'/'pro', 'enterprise'.
  - `name` (text): Display tier name.
  - `monthly_cents` (int): Cost in integer cents ($500 -> 50000 cents, $1500 -> 150000 cents).
  - `call_limit` (int): Included monthly inbound calls (3,000 / 10,000 / unlimited).
- `subscriptions`:
  - `id` (UUID, PK)
  - `restaurant_id` (UUID, FK `restaurants.id`)
  - `plan_id` (text, FK `plans.id`)
  - `stripe_subscription_id` (text, unique)
  - `status` (text): 'active', 'past_due', 'cancelled'
  - `current_period_end` (timestamptz)

#### 7. `restaurant_users`
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK `restaurants.id`)
- `user_id` (UUID, FK `auth.users.id`)
- `role` (text): 'owner', 'manager', 'staff'
- `created_at` (timestamptz)

---

## 6. Required State Management & User Actions

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Client State                            │
├────────────────────────────────────────────────────────────────────────┤
│ • activeTab: 'dashboard'|'livecalls'|'orders'|'menu'|'analytics'|...   │
│ • currentRestaurantId: string                                          │
│ • liveCalls: Record<callId, {duration, transcript, confidence, ...}>   │
│ • ordersFilter: 'All Status' | 'Paid' | 'Link Sent' | 'Expired' | ...  │
│ • menuCategoryFilter: 'All' | 'Pizzas' | 'Sides' | 'Drinks' | ...      │
│ • analyticsRange: '7d' | '30d' | 'custom'                              │
│ • modals: { addItemOpen, inviteStaffOpen, orderDetailsId, ... }        │
└────────────────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│   Supabase Realtime   │             │   Next.js Server /    │
│  (Postgres Changes)   │             │    FastAPI Backend    │
├───────────────────────┤             ├───────────────────────┤
│ • calls (INSERT/UPD)  │             │ • POST /api/payments/ │
│ • orders (INSERT/UPD) │             │   create-link/{id}    │
│ • payment_events      │             │ • PUT /api/menu_items │
│ • menu_items (toggle) │             │ • POST /api/takeover  │
└───────────────────────┘             └───────────────────────┘
```

1. **Tab & Routing State**:
   - In Next.js, tabs can either map to subroutes (`/dashboard`, `/dashboard/live-calls`, `/dashboard/orders`, `/dashboard/menu`, `/dashboard/analytics`, `/dashboard/billing`, `/dashboard/settings`) or client-side tab state preserving audio playback during navigation.
2. **Live Audio Intercept & Monitoring**:
   - WebRTC session connection via LiveKit SDK (`livekit-client`).
   - Monitor mode: Attaches audio track to hidden `<audio>` DOM element with muted microphone.
   - Takeover mode: Unmutes staff microphone, sends data channel command to pause AI agent loop.
3. **Menu Item Availability Real-time Sync**:
   - Optimistic UI toggle immediately flips switch visual state.
   - Async update sent to Supabase `menu_items`.
   - Backend triggers embedding refresh / cache eviction.
4. **Order Pipeline Status Transition**:
   - Supabase Realtime subscription on `orders` and `payment_events` pushes state changes to the UI without page reload:
     - `CONFIRMED` -> `PAYMENT_SENT` -> `PAID` -> `POS_PUSHED`.
5. **Analytics Data Fetching**:
   - React Query / SWR / Server Components re-aggregating on date range switch.

---

## 7. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Operations | Multi-tab Navigation | Sidebar switching across 7 application sections | Nav item click (`tabId`) | Active view changes, header updates, charts render | Fallback to 'dashboard' if tab ID invalid | `talkbyte-restaurant-dashboard.html:194-221, 743-755` |
| 2 | Operations | Multi-unit Venue Selector | Displays active restaurant location and plan tier | Click on venue pill | Venue switch dropdown / modal | Retains default venue if none selected | `talkbyte-restaurant-dashboard.html:22-24, 190-193` |
| 3 | Operations | Live Call Audio Pulse | Pulsating green dot indicating ongoing voice calls | Real-time call state | Animated visual beacon in sidebar | Hidden if active call count is 0 | `talkbyte-restaurant-dashboard.html:33-34, 201` |
| 4 | Operations | Orders Attention Badge | Counter showing orders requiring staff action | Count of expired/unpaid orders | Orange pill badge with count ("3") | Hidden if zero pending orders | `talkbyte-restaurant-dashboard.html:32, 205` |
| 5 | Operations | Onboarding Progress Strip | Setup progress checklist with 5 milestones | Setup step status flags | Progress bar (4/5 done) + "Connect POS" CTA | Directs user to incomplete integration | `talkbyte-restaurant-dashboard.html:152-158, 253-266` |
| 6 | Operations | Expiration Warning Alert | Global banner warning of expired payment links | Count of expired orders in last hour | Warning banner with "Review orders" link | Banner unmounts if expired count is 0 | `talkbyte-restaurant-dashboard.html:160-161, 268, 422` |
| 7 | Operations | Real-time Call Intercept | Staff takeover of ongoing AI phone conversation | Staff click "Take Over Call" | Mutes AI persona, connects staff mic via WebRTC | Alert if WebRTC room disconnected | `talkbyte-restaurant-dashboard.html:98, 318, 380, 393` |
| 8 | Operations | Silent Call Monitoring | Staff listen-in to ongoing AI phone conversation | Staff click "Monitor Only" | Subscribes staff audio track in muted mode | Shows reconnection banner on drop | `talkbyte-restaurant-dashboard.html:99, 319, 381, 394` |
| 9 | Operations | Immediate Call Termination | Staff force-disconnects active call | Staff click "End Call" | Signals SIP/LiveKit server to tear down call | Disabled if call already terminated | `talkbyte-restaurant-dashboard.html:382-383` |
| 10 | Operations | Live Transcript Feed | Streaming speech-to-text transcript display | Real-time STT chunk events | Formatted dialog bubble with teal border | Displays ellipses or placeholder if silent | `talkbyte-restaurant-dashboard.html:95, 314-316, 378, 391` |
| 11 | Operations | STT Confidence Badge | Displays AI recognition confidence percentage | Float value from Whisper/Deepgram (0-1) | Percentage badge (e.g. "97%", "88%") | Red highlight if confidence < 70% | `talkbyte-restaurant-dashboard.html:375, 388, 404-409` |
| 12 | Operations | Sentiment Feedback Stream | Customer sentiment score and quote preview | Post-call sentiment analysis | Sentiment icon (😊/😐/😞) + quote + % badge | Neutral placeholder if analysis pending | `talkbyte-restaurant-dashboard.html:145-150, 349-356` |
| 13 | Orders | Payment Stage Visual Timeline | 3-step dot-and-line pipeline tracker | Order & payment event timestamps | Green ✓, pulsing purple →, gray ○, or red ✗ | Displays red ✗ at failed stage with retry | `talkbyte-restaurant-dashboard.html:106-113, 439-444, 452-457, 471` |
| 14 | Orders | Payment Link Resend | Generates and sends new Stripe SMS link | Click "Resend Link" | Calls backend API, sends Telnyx SMS | Toast error if phone number invalid | `talkbyte-restaurant-dashboard.html:459` |
| 15 | Orders | POS Sync Retry | Retries pushing confirmed order to POS | Click "Retry" on failed POS row | Enqueues background push task | Shows "Retry Failed" if POS unreachable | `talkbyte-restaurant-dashboard.html:473` |
| 16 | Orders | Order Status Filter | Dropdown to filter orders by completion state | Select status option | Re-renders table matching selected status | Shows empty table state if 0 matches | `talkbyte-restaurant-dashboard.html:427` |
| 17 | Orders | Orders CSV Export | Downloads tabular order log as CSV file | Click "Export CSV" | Triggers browser CSV file download | Alert if no data within range | `talkbyte-restaurant-dashboard.html:428` |
| 18 | Menu | Instant Item Availability Toggle | Toggles item in/out of stock for AI ordering | Click toggle switch on item card | Flips UI switch, updates DB, evicts RAG cache | Rolls back toggle state on API failure | `talkbyte-restaurant-dashboard.html:120-124, 510-513, 530-533` |
| 19 | Menu | Menu Category Filtering | Horizontal pill bar filtering by dish type | Click category pill | Displays only items matching selected category | Highlights "All" if category emptied | `talkbyte-restaurant-dashboard.html:496-502` |
| 20 | Menu | Add New Menu Item | Form to add dish title, price, desc, category | Click "+ Add Item" card/button | Appends new item card, sends to DB & embeddings | Form validation error on missing fields | `talkbyte-restaurant-dashboard.html:246, 491, 555-558` |
| 21 | Menu | Website Menu Scraper Import | Ingests menu items from existing website URL | Click "Import from Website", input URL | Scrapes & parses dishes, populates catalog | Error on unparseable website structure | `talkbyte-restaurant-dashboard.html:489` |
| 22 | Menu | Batch CSV Menu Import | Uploads spreadsheet of menu catalog | File input selection | Parses CSV, bulk upserts `menu_items` | Displays row errors for invalid syntax | `talkbyte-restaurant-dashboard.html:490` |
| 23 | Menu | RAG Sync Time Beacon | Banner showing freshness of AI knowledgebase | System timestamp of last menu sync | Green banner: "✓ Menu synced 4 min ago" | Yellow warning if sync lagged > 5m | `talkbyte-restaurant-dashboard.html:494` |
| 24 | Analytics | Timeframe Scope Switcher | Switches reporting period (7d, 30d, custom) | Click timeframe button | Re-aggregates charts and metric cards | Defaults to 7 Days if invalid range | `talkbyte-restaurant-dashboard.html:564-568` |
| 25 | Analytics | Hourly Call Distribution Chart | Bar chart displaying call count per hour | Aggregated call count by hour | Chart.js bar chart with rounded bars | Renders empty baseline if 0 calls | `talkbyte-restaurant-dashboard.html:758-760` |
| 26 | Analytics | 7-Day Call Volume Trend | Line chart of daily call totals over past week | Daily call count series | Smoothed line chart with shaded area | Straight zero line if no calls | `talkbyte-restaurant-dashboard.html:762-764` |
| 27 | Analytics | 7-Day Revenue Trend | Line chart of daily revenue over past week | Daily order revenue totals | Teal smoothed line chart with currency axis | Straight zero line if no revenue | `talkbyte-restaurant-dashboard.html:765-767` |
| 28 | Analytics | 14x7 Peak Hours Heatmap | Intensity matrix of calls across hours and days | Matrix of call counts per day & hour | Colored grid blocks with opacity weighting | Transparent blocks for zero call intervals | `talkbyte-restaurant-dashboard.html:586-601` |
| 29 | Analytics | Top Ordered Items Ranking | Ranked leaderboard of popular dishes & revenue | Sales volume per menu item | Sorted table with dish, count, and revenue | Shows "No sales recorded" if empty | `talkbyte-restaurant-dashboard.html:603-614` |
| 30 | Billing | Plan Tier Comparison & Selection | Displays Starter, Pro, Enterprise tiers & perks | Click on plan card | Selects tier, opens checkout/upgrade modal | Alerts if downgrading below current usage | `talkbyte-restaurant-dashboard.html:136-141, 621-637` |
| 31 | Billing | Usage Quota Gauges | Visual percentage bars for Calls, Minutes, SMS | Consumed units vs limit | Dual-gradient fill bar + numerical fraction | Red warning bar if usage > 90% | `talkbyte-restaurant-dashboard.html:142-143, 640-655` |
| 32 | Billing | Billing History Log | Log of historical monthly invoices and status | Subscription invoice records | Table with billing month, amount, paid badge | "Payment Failed" badge with update card CTA | `talkbyte-restaurant-dashboard.html:657-668` |
| 33 | Settings | Business Profile Configuration | Updates restaurant name, timezone, DID phone | Input changes in form | Persists to `restaurants` table | Validation error on invalid timezone | `talkbyte-restaurant-dashboard.html:677-681` |
| 34 | Settings | Holiday Closure Mode Toggle | Redirects callers to holiday message & voicemail | Click toggle switch | Flips `holiday_closure_mode` boolean | Immediate notification if toggled on | `talkbyte-restaurant-dashboard.html:682-685` |
| 35 | Settings | Third-Party Integrations List | Status of Square POS, Stripe, Twilio, Shopify | Click "Connect" on unconfigured service | Starts OAuth connection flow | Shows red dot badge if webhook disconnected | `talkbyte-restaurant-dashboard.html:167-176, 688-707` |
| 36 | Settings | AI Persona Configuration | Sets AI name and custom greeting script | Text input + Textarea | Updates `ai_instructions` in restaurant profile | Disallows empty greeting script | `talkbyte-restaurant-dashboard.html:711-715` |
| 37 | Settings | Manual Takeover Permission | Enables/disables dashboard staff call takeover | Click toggle switch | Toggles takeover capability across system | Disables "Take Over" buttons if turned off | `talkbyte-restaurant-dashboard.html:716-719` |
| 38 | Settings | Low Confidence Auto-Transfer | Automatically transfers callers if AI uncertain | Click toggle switch | Enables threshold check (<70% confidence) | Falls back to voicemail if transfer fails | `talkbyte-restaurant-dashboard.html:720-723` |
| 39 | Settings | Staff Access & Invitations | Lists authorized users and sends invite emails | Input email and select role | Appends user row, dispatches invite token | Error if email already registered | `talkbyte-restaurant-dashboard.html:726-735` |

---

## 8. Edge Cases & Boundary Conditions

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---------|-------------------|------------------------------|
| 1 | Call Audio Monitoring | Network drops or WebRTC peer connection fails mid-call | UI displays "Reconnecting..." badge; if unrecoverable within 10s, tears down audio session and flags call state as `CALL_DROPPED`. |
| 2 | Speech-to-Text Confidence | Background kitchen noise causes STT confidence < 70% | If "Transfer on Low Confidence" is ON, system initiates SIP transfer to staff landline and logs `TRANSFER_TO_HUMAN`. |
| 3 | Order Payment Link | Customer fails to open or pay SMS link within 30 minutes | Stripe Checkout session expires, `payment_events.expires_at` passes, order marked `Link Expired` (red badge), dashboard warning banner increments. |
| 4 | POS Push Outage | Square / POS API returns HTTP 500 or timeout | Order state set to `POS_FAILED`, visual timeline shows red ✗ at POS step, row action displays "Retry" button, background worker executes exponential backoff. |
| 5 | Menu Item Depletion Mid-Call | Staff toggles item to "Unavailable" while a caller is ordering | Supabase Realtime updates DB; RAG query immediately excludes item; AI politely informs caller the dish just sold out and suggests alternatives. |
| 6 | Usage Quota Saturation | Restaurant reaches 10,000 call limit on Pro plan | Inbound calls continue without interruption, but warning banner alerts owner of per-call overage billing ($0.15/call) with one-click upgrade to Enterprise. |
| 7 | Caller Privacy / Masking | E.164 phone number stored in database (`+61412345678`) | Frontend masks intermediate digits (`+61 4•• ••• 847`) to comply with Australian Privacy Principles (APP) unless staff explicitly clicks unmask. |
| 8 | Multiple Concurrent Calls | 5 calls arrive simultaneously during Friday dinner rush | Dashboard lists all concurrent calls in Active Calls card; badge pulse continues; queue counter reflects waiting callers. |
| 9 | Rapid Menu Availability Toggles | Staff rapidly toggles switch multiple times in 2 seconds | UI debounce of 300ms prevents spamming Supabase; optimistic toggle shows pending indicator until settled. |
| 10 | Non-GST or Zero-Item Orders | Caller disconnects after greeting without ordering items | Order is not generated; call record saved as `call_type = 'Inquiry'` or `call_state = 'COMPLETE'` without creating a ghost `$0.00` order. |

---

## 9. Next.js 16 Implementation Blueprint

### 9.1 Component Hierarchy in `src/app/(restaurant)`
```
src/app/(restaurant)/
├── layout.tsx                    # Shared Sidebar, Sticky Topbar, Multi-Tenant Provider
├── page.tsx                      # Default redirect to /dashboard
├── dashboard/
│   └── page.tsx                  # Dashboard Overview (KPIs, Onboarding, Sentiment, Charts)
├── live-calls/
│   ├── page.tsx                  # Active Calls List & Live Audio Player
│   └── components/
│       ├── live-call-card.tsx    # Live transcript, takeover/monitor controls
│       └── call-log-table.tsx    # Historical call log table
├── orders/
│   ├── page.tsx                  # Order Pipeline with status filter & CSV export
│   └── components/
│       ├── order-timeline.tsx    # 3-step status dot pipeline
│       └── order-details-modal.tsx # Itemized order inspection modal
├── menu/
│   ├── page.tsx                  # Menu Catalog Grid with category pills
│   └── components/
│       ├── menu-item-card.tsx    # Card with availability switch
│       └── add-item-dialog.tsx   # Dialog form for item creation
├── analytics/
│   ├── page.tsx                  # Timeframe selector, KPIs, Recharts charts
│   └── components/
│       ├── peak-heatmap.tsx      # 14x7 CSS Grid Heatmap
│       └── top-items-list.tsx    # Ranked revenue items
├── billing/
│   ├── page.tsx                  # Plan cards, usage meters, invoice history
│   └── components/
│       └── usage-bar.tsx         # Dual-gradient quota gauge
└── settings/
    ├── page.tsx                  # Business info, AI voice persona, integrations
    └── components/
        ├── ai-settings-form.tsx  # Voice persona & greeting script editor
        └── staff-table.tsx       # RBAC permissions table
```

### 9.2 Supabase Realtime Subscriptions
To achieve parity with the prototype's real-time features:
1. `supabase.channel('restaurant-calls')`: Subscribes to `INSERT` and `UPDATE` on `calls` where `restaurant_id = :current_restaurant_id`. Updates active calls feed and live transcripts.
2. `supabase.channel('restaurant-orders')`: Subscribes to `INSERT` and `UPDATE` on `orders` and `payment_events`. Updates payment timeline and order status indicators in real time.
3. `supabase.channel('restaurant-menu')`: Keeps catalog synced across multiple open tabs/staff terminals.
