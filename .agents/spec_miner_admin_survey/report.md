# TalkByte AI — Operator Admin Panel Specification Report

**Document Source:** `talkbyte-admin-panel.html` (Authoritative Prototype)  
**Related Specs & Code:** `CLAUDE.md`, `ORIGINAL_REQUEST.md`, `backend/supabase_schema.sql`, `backend/app/api/admin.py`, `docs/superpowers/specs/2026-08-29-talkbyte-foundation-design.md`  
**Target Implementation:** Next.js 16 (App Router) in `frontend/src/app/(admin)/`, Tailwind CSS v4, shadcn/ui, Supabase (Postgres 16 + pgvector + Realtime + Auth), FastAPI backend.

---

## 1. Executive Summary & Architecture Overview

The TalkByte AI Operator Admin Panel provides platform-level observability, operational control, multi-tenant fleet administration, financial tracking, infrastructure monitoring, and security audit logging for the TalkByte telephony ordering system.

### Key Operational Context:
- **Tenancy:** 487 active restaurants (and growing across Australia: VIC, NSW, QLD, etc.).
- **Live Voice Traffic:** Real-time telephony sessions bridged via Telnyx SIP into LiveKit Agents with Deepgram Flux STT, OpenAI GPT-4.1, and ElevenLabs TTS.
- **Transactions & POS:** SMS payment link generation via Stripe, followed by automated POS push (Square / Lightspeed / email fallback).
- **Target User Role:** Platform Super-Operators / System Administrators (`role: operator` / `superadmin`).

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Shell / Layout | Fixed Sidebar Navigation | 9-item sidebar grouped into Platform, Management, Finance, System with brand badge and operational status footer | Nav click, route change | Active tab highlight, page view switch, dynamic topbar title | Fallback to 'overview' if unknown view requested | `talkbyte-admin-panel.html:38-52, 188-217, 857-878` |
| 2 | Shell / Topbar | Platform Status Indicator & Topbar | Sticky header displaying active page title, pulsing live calls counter, current AEST timestamp, operator avatar | System time, live WebSocket call count, operator profile | Formatted header, live pulse badge, avatar initials ('AJ') | Displays disconnected badge if WebSocket drops | `talkbyte-admin-panel.html:54-64, 220-227` |
| 3 | Shell / Footer | Global Operational Pulse Footer | Fixed footer displaying system health dot ("All systems operational") and version/region ("v2.2 · AU-EAST-1") | Health check ping from infra services | Green status dot + text | Changes to yellow/red if critical subsystem reports downtime | `talkbyte-admin-panel.html:50-52, 211-216` |
| 4 | Overview | System Alert Banners | High-priority dismissible/actionable warning strips for platform anomalies (e.g. expiring payment links) | Platform telemetry / threshold monitor | Colored alert box with direct navigation link | Stays persistent until issue resolves | `talkbyte-admin-panel.html:158-160, 231` |
| 5 | Overview | Platform Health & Growth KPIs | 8 high-level KPI cards (Active Restaurants, MRR, Calls Today, Churn Rate, Order Completion %, Payment Conv %, Avg Latency, Escalation %) | Aggregated metrics from DB / Redis | Formatted metric values with MoM/WoW deltas and trend indicators | Shows loading skeleton / placeholder on query failure | `talkbyte-admin-panel.html:70-78, 233-285` |
| 6 | Overview | Hourly Call Volume Chart | Bar chart tracking call volume across 18 time buckets (6am to 11pm) for the current day | Hourly call count aggregations | Rendered Chart.js / Recharts Bar chart with purple fills | Renders empty state if zero calls | `talkbyte-admin-panel.html:883-898, 288-291` |
| 7 | Overview | 6-Month MRR Growth Trend | Area/Line chart tracking recurring revenue trajectory from March through August | Monthly billing totals ($K) | Spline curve with green translucent gradient fill | Renders zero baseline if new platform | `talkbyte-admin-panel.html:900-917, 292-295` |
| 8 | Overview | Top Restaurants by Orders Leaderboard | Data table ranking top 5 performing restaurants by daily volume, completed orders, and generated GMV | Daily order & revenue rollups | Ranked table with suburb tags and bold revenue text | Renders empty table message if no orders today | `talkbyte-admin-panel.html:299-308` |
| 9 | Overview | At-Risk Restaurants Radar | Intervention table highlighting churn-risk venues with risk signals (low usage, POS errors, unpaid bills, high escalation) | Usage drop algorithms, POS error tallies, invoice status | Action buttons: 'Contact', 'Debug', 'Invoice', 'Review AI' | Badges trigger specific intervention dialogs | `talkbyte-admin-panel.html:311-336` |
| 10 | Live Monitor | Real-Time Call Fleet Filter | Dropdown selectors for geographic state (All, VIC, NSW, QLD) and Call State (All, TAKING_ORDER, CONFIRMING, ESCALATED) | Dropdown selection | Filtered card grid and KPI counts | Shows "No active calls match filter" | `talkbyte-admin-panel.html:347-350` |
| 11 | Live Monitor | Live Call KPI Counter Strip | 5 real-time counters: Active Calls (23), In Ordering (18), Confirming (3), Escalating (2), Avg Call Duration (2m 41s) | Upstash Redis active session keys | Auto-updating counters with color-coded badges | Reconnects Redis subscription on drop | `talkbyte-admin-panel.html:353-359` |
| 12 | Live Monitor | Live Call Cards Grid | Real-time interactive cards for each ongoing phone call displaying caller ID, location, STT confidence, order items, live timer | WebRTC / LiveKit room state, transcript deltas | Colored border cards (green=active, yellow=escalating, blue=sms) with live ticking timer | Visual pulse animation on escalating calls | `talkbyte-admin-panel.html:121-137, 361-417, 960-968` |
| 13 | Live Monitor | Escalation & Anomaly Highlighting | Special card styling for calls with ≥3 STT mishears or caller distress, indicating countdown to human transfer | STT confidence <80%, error count ≥3 | Blinking yellow dot, pulsing yellow border, countdown banner | Triggers automated SIP transfer to restaurant staff phone | `talkbyte-admin-panel.html:124, 390-398` |
| 14 | Live Monitor | Recent Completed Calls Grid | Table of last 30 minutes calls displaying timestamp, restaurant, duration, outcome, order value, payment, POS sync | Call completion events in DB | Chip-coded table (`Ordered`, `Abandoned`, `Escalated`, `Paid`, `Synced`) | Gracefully handles missing order/payment fields | `talkbyte-admin-panel.html:419-433` |
| 15 | Restaurants | Restaurant Fleet Directory | Comprehensive table of 487 tenants with search by name/suburb and filter by plan and status | Search query, plan filter, status filter | Multi-column tabular view with health bars and action buttons | Shows "No restaurants found" with clear search | `talkbyte-admin-panel.html:437-550` |
| 16 | Restaurants | Health Score & Completion Meter | Composite health index (0-100) and completion rate progress bar with green/yellow/red color thresholds | Order completion %, STT accuracy, POS sync rate | Visual progress bar and health badge (`● 98`, `● 61`, `● 34`) | Flags sub-50 scores as critical | `talkbyte-admin-panel.html:113-118, 461-466` |
| 17 | Restaurants | POS Integration Status Indicator | Status chip indicating POS integration health: `Square ✓`, `Lightspeed ✓`, `Email only`, `None`, `Square ✗ errors` | POS webhook and sync telemetry | Color-coded chip (teal, gray, red) | Red chip switches action button from "View" to "Debug" | `talkbyte-admin-panel.html:467, 542, 545` |
| 18 | Restaurants | Add Restaurant Workflow | Primary action button opening tenant creation modal/wizard | Form inputs: Name, Address, Real Phone, Telnyx Number, Plan, Timezone | New restaurant record in DB + Telnyx SIP routing setup | Validates Australian phone formats and unique Telnyx DID | `talkbyte-admin-panel.html:444` |
| 19 | Revenue | Financial & Unit Economics KPIs | 4 executive financial cards: MRR ($125.4K), ARR ($1.51M), Avg Revenue/Restaurant ($257), LTV/Restaurant ($5,940) | Stripe billing totals & historical churn calculations | Metric displays with MoM delta indicators | Fallback to cached figures if Stripe webhook delayed | `talkbyte-admin-panel.html:556-561` |
| 20 | Revenue | Plan Tier Distribution Breakdown | Visual progress bars comparing Enterprise ($499/mo), Pro ($249/mo), Starter ($149/mo) counts and MRR contribution | Subscription table groupings | Horizontal stacked/individual comparison bars + summary text | Automatically recalculates tier percentages | `talkbyte-admin-panel.html:149-156, 564-591` |
| 21 | Revenue | COGS & Unit Cost Breakdown | Tabular financial breakdown of telephony & AI cost per minute (Telnyx, Deepgram, GPT-4.1, ElevenLabs, SMS, Railway) | Cloud billing APIs & token counts | Itemized cost table with % share, total cost ($0.062/min), margin (31%) | Highlights margin compression if API costs spike | `talkbyte-admin-panel.html:593-608` |
| 22 | Revenue | Revenue & Call Volume Trend Chart | Dual-axis bar chart comparing monthly MRR ($K) against call volume (thousands of calls) across 6 months | Monthly aggregate logs | Visualized dual-series chart (purple bars for MRR, teal bars for calls) | Supports responsive redraw on window resize | `talkbyte-admin-panel.html:611-614, 919-930` |
| 23 | Infrastructure | Subsystem Health Matrix | 9 dedicated cards monitoring critical cloud components (Telnyx, Deepgram, GPT-4.1, ElevenLabs, Stripe, Supabase, Redis, Square, LiveKit) | Health probes, latency metrics, error rates, daily spends | Status indicators (`● Operational`, `⚠️ Elevated Latency`), 4 metrics/card, health fill bar | Automatically shifts card theme to yellow/red on degradation | `talkbyte-admin-panel.html:138-148, 623-723` |
| 24 | Infrastructure | Incident Warning & Failover Alerts | Red alert strip detailing specific component degradation (e.g. Deepgram TTFT 94ms vs 70ms baseline) and automated failover action | Health probe threshold violations | High-visibility red alert banner with incident details | Auto-dismisses when metric stabilizes below threshold | `talkbyte-admin-panel.html:621` |
| 25 | Audit Log | Multi-Category System Audit Log | Tabular chronological ledger of all platform events (ORDER, ESCALATION, BILLING, RESTAURANT, SYSTEM, POS, AUTH, ONBOARD) | Real-time event stream from audit table | Searchable/filterable table with timestamp, type, actor, resource, detail, IP | Paginated or virtualized infinite scroll for >10k rows | `talkbyte-admin-panel.html:165-168, 726-798` |
| 26 | Audit Log | Audit Filter & Search Toolbar | Search box and dual select filters (by Event Category and Time Window: 24h, 7d, 30d) | Keyword search, event category enum, timeframe enum | Filtered audit event records | Shows zero-state message if filter matches nothing | `talkbyte-admin-panel.html:728-734` |
| 27 | Analytics | Platform Analytics KPI Suite | 4 aggregate performance metrics over selectable window: Total Calls, Orders Completed, GMV, Avg Order Value | Time-windowed call and order aggregations | Formatted KPI numbers with week-over-week deltas | Updates all downstream analytics charts on range change | `talkbyte-admin-panel.html:806-811` |
| 28 | Analytics | Daily Orders vs Calls Correlation | Multi-line spline chart plotting daily inbound calls against completed orders over a 7-day period | Daily time-series call and order counts | Dual line chart (purple for calls, green for orders) with fill areas | Handles incomplete current-day data gracefully | `talkbyte-admin-panel.html:813-816, 932-943` |
| 29 | Analytics | Cuisine Performance Benchmarking | Horizontal bar chart ranking order completion rates across cuisine categories (Pizza, Thai, Burgers, Chinese, Sushi, Indian, Italian) | Order completion % grouped by cuisine tag | Multi-colored horizontal bar chart (0-100% scale) | Normalizes categories with low sample counts | `talkbyte-admin-panel.html:817-820, 945-958` |
| 30 | Analytics | Call Drop & Abandonment Diagnostics | Root-cause distribution table categorizing why calls terminate without orders (Network drops, Hang-ups, STT errors, Out of stock, Closed) | Call termination state machine codes | Ranked count and % share table | Alerts operator if network drop % exceeds 15% | `talkbyte-admin-panel.html:823-833` |
| 31 | Analytics | Full-Funnel Conversion Waterfall | 6-stage end-to-end checkout funnel table: Calls Received → Orders Confirmed → SMS Sent → Link Opened → Paid → POS Synced | Order lifecycle and payment event logs | Stage count, conversion % from top, and step drop-off | Identifies payment link drop-off bottlenecks | `talkbyte-admin-panel.html:834-846` |
| 32 | Users (RBAC) | Multi-Tenant User Directory | User directory managing owners, staff, and readonly operator users across all restaurants with Supabase Auth & RLS | User query with join on `restaurant_users` & `restaurants` | Data grid with Name, Email, Tenant, Role, Status, Last Login | Enforces strict role boundary (only operators can alter roles) | `talkbyte-admin-panel.html:850` |
| 33 | Billing | Stripe Subscription & Invoice Console | Subscription management console tracking active subscriptions, billing cycles, payment failures, and plan upgrades | Stripe API / Webhooks & `subscriptions` table | Subscription list, MRR metrics, invoice download, plan change action | Flags past-due subscriptions with immediate retry option | `talkbyte-admin-panel.html:851` |

---

## 3. Edge Cases & Boundary Behaviors

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---------|-------------------|------------------------------|
| 1 | Live Call Timer | Call duration exceeds 60 seconds / minutes | Formatted as `M:SS` (e.g. `2:14`, `5:12`); timer increments smoothly every second without drifting or freezing UI. |
| 2 | Live Call Escalation | STT mishears occur 3 consecutive times or customer asks for human | Call card border turns yellow with pulsating animation (`pulse-border`), state changes to `ESCALATING — 3rd misunderstanding`, and countdown triggers auto-transfer. |
| 3 | POS Sync Failure | Square / Lightspeed API returns 4xx/5xx or timeouts after 3 retries | Audit event `POS` logged with fallback email notification; Restaurant table displays red chip `Square ✗ errors`; Action button switches to `Debug`. |
| 4 | Unredeemed Payment Link | Customer fails to click Stripe link within 30-minute window | System alert banner fires on Overview page (`⚠️ 3 restaurants have payment links expiring unredeemed`); order state shifts to `PAYMENT_EXPIRED`. |
| 5 | Telephony Network Drop | WebSocket or SIP trunk disconnects abruptly mid-call | Call classified under `Call dropped (network)` (top abandonment reason 34%); order discarded or saved as draft; call state marked `CALL_DROPPED`. |
| 6 | Deepgram / AI Provider Spike | STT TTFT exceeds baseline threshold (e.g. >90ms vs 70ms) | Infrastructure card updates to `⚠️ Elevated Latency` (yellow); Red alert strip displays at top of Infrastructure page with automated failover notice. |
| 7 | Zero Live Calls | No callers currently connected to any restaurant line | Live Monitor grid displays empty state card ("No active calls right now"); Topbar live badge text updates to "0 Live Calls" and stops pulsing. |
| 8 | Multi-Tenant Data Leakage | Operator logs in vs Restaurant Owner logs in | Admin panel routes under `/(admin)` are strictly protected by middleware/RLS requiring `role = 'operator'` or `role = 'superadmin'`. Restaurant owners are redirected to `/(restaurant)`. |
| 9 | Large Fleet Pagination | Restaurant count grows from 487 to 5,000+ | Client-side search is replaced with server-side Supabase `.ilike()` and `.range(start, end)` pagination with 25/50 items per page. |
| 10 | Currency & Timezone Formatting | Amounts stored in cents; dates across Australian timezones | Total cents divided by 100 and formatted with AUD currency symbols (`$47.50`); timestamps displayed in Australian Eastern Time (`AEST`/`AEDT`) using `date-fns-tz`. |

---

## 4. Detailed UI Component Breakdown

### 4.1 Layout & Navigation Hierarchy
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Topbar: [Page Title]                 [🔴 23 Live Calls] [Sat 29 Aug 2026 · 7:42 PM] [AJ]│
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ Sidebar      │ Main Content Canvas:                                                    │
│  TalkByte    │  ┌───────────────────────────────────────────────────────────────────┐  │
│  Operator    │  │ Page Header / Filter Bar                                          │  │
│  ──────────  │  ├───────────────────────────────────────────────────────────────────┤  │
│  PLATFORM    │  │ Alert Banners (if any active)                                     │  │
│   Overview   │  ├───────────────────────────────────────────────────────────────────┤  │
│   Live Mon.  │  │ KPI Metric Grid (4 or 5 cards)                                    │  │
│  MANAGEMENT  │  ├───────────────────────────────────────────────────────────────────┤  │
│   Restaurant │  │ Charts Grid (Bar / Line / Dual Axis)                              │  │
│   Users      │  ├───────────────────────────────────────────────────────────────────┤  │
│  FINANCE     │  │ Data Tables & Operational Lists                                   │  │
│   Revenue    │  └───────────────────────────────────────────────────────────────────┘  │
│   Billing    │                                                                         │
│  SYSTEM      │                                                                         │
│   Infra      │                                                                         │
│   Audit Log  │                                                                         │
│   Analytics  │                                                                         │
│  ──────────  │                                                                         │
│  [●] All Sys │                                                                         │
│  v2.2 AU-EAST│                                                                         │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Interactive Components & Controls
1. **Navigation Items (`.nav-item`):**
   - Click triggers view transition (`showPage`), updates URL route (e.g. `/admin/overview`, `/admin/live`, `/admin/restaurants`, etc.), and toggles `.active` CSS state.
2. **Search Inputs (`.search-box`):**
   - Instant or debounced (300ms) query against restaurant names, suburbs, or audit log event details.
3. **Filter Dropdowns (`select`):**
   - **Live Monitor:** State filter (`All`, `VIC`, `NSW`, `QLD`) and Call Status filter (`All`, `TAKING_ORDER`, `CONFIRMING`, `ESCALATED`).
   - **Restaurants:** Plan filter (`All Plans`, `Starter`, `Pro`, `Enterprise`) and Status filter (`All Status`, `Active`, `Trial`, `Suspended`).
   - **Audit Log:** Event Category (`All Events`, `Restaurant`, `Billing`, `System`, `Auth`) and Date Range (`Last 24h`, `Last 7d`, `Last 30d`).
   - **Analytics:** Time window (`Last 7 days`, `Last 30 days`, `Last 90 days`).
4. **Action Buttons:**
   - Primary: `+ Add Restaurant` (opens restaurant onboarding wizard).
   - Ghost Actions: `View` (opens tenant drawer/detail), `Debug` (opens diagnostic modal for POS error tracing), `Contact` (triggers outreach), `Invoice` (resends billing notice), `Review AI` (inspects failed STT logs).
5. **Status & Category Badges (`.chip` & `.badge`):**
   - Live state: `.badge-live` (red with pulse).
   - Health scores: `.fill-green` (80-100), `.fill-yellow` (50-79), `.fill-red` (<50).
   - POS integrations: `.chip-teal` (`Square ✓`, `Lightspeed ✓`), `.chip-gray` (`Email only`, `None`), `.chip-red` (`Square ✗ errors`).
   - Audit event categories: Green (`ORDER`), Yellow (`ESCALATION`), Blue (`BILLING`), Purple (`RESTAURANT`, `ONBOARD`), Red (`SYSTEM`), Teal (`POS`), Gray (`AUTH`).

### 4.3 Required Modals & Drawers (Implicit Operator Workflows)
1. **Modal: "Add Restaurant" (`#modal-add-restaurant`)**
   - **Fields:** Restaurant Name, Real Contact Phone, Telnyx Phone DID Assignment, Suburb, State (VIC/NSW/QLD/WA/SA/TAS/ACT), Timezone, Subscription Plan (Starter, Pro, Enterprise), POS Provider (Square, Lightspeed, Manual Email), Initial AI Persona/Instructions, Owner Email (sends Supabase Auth magic link).
2. **Drawer/Modal: "Restaurant Detail & Diagnostics" (`#drawer-restaurant-detail`)**
   - Header with active status, plan, and health score.
   - Tabs: Overview, Call History, Menu & Embeddings status, POS sync logs, Billing record.
   - Quick Actions: "Simulate Inbound Test Call", "Force Re-index Menu (pgvector)", "Resend POS Webhook", "Pause AI Assistant".
3. **Modal: "POS Error Diagnostic & Retry" (`#modal-pos-debug`)**
   - Displays failed Square/Lightspeed payload, HTTP error code, retry attempt timestamps.
   - Buttons: "Retry Push Now", "Switch to Email Fallback", "Mark Resolved".
4. **Modal: "Live Call Intercept / Transcript Inspector" (`#modal-live-call`)**
   - Live streaming transcript of turns between caller and GPT-4.1.
   - Telemetry: Deepgram STT TTFT, LLM latency, ElevenLabs audio packet latency.
   - Emergency controls: "Mute AI", "Force Transfer to Human Staff (+61 ...)", "Terminate Call".

---

## 5. Comprehensive Tables & Data Grids

### 5.1 Overview: Top Restaurants by Orders
| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `#` (Rank) | Integer | Ordinal rank based on daily completed orders | Derived from `orders` count |
| `Restaurant` | String + Subtitle | Business name and Suburb, State | `restaurants.name`, `restaurants.suburb`, `state` |
| `Calls` | Integer | Total inbound calls received today | `calls` count where `started_at >= today` |
| `Orders` | Integer | Total completed orders today | `orders` count where `state = 'CONFIRMED'` |
| `Revenue` | Currency ($ AUD) | Sum of order total cents today / 100 | `sum(orders.total_cents) / 100` |

### 5.2 Overview: At-Risk Restaurants Radar
| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `Restaurant` | String + Subtitle | Business name and location | `restaurants.name`, location |
| `Risk Signal` | Chips (Red/Yellow) | Diagnostic tag: `Low usage (3 wks)`, `POS errors`, `Overdue invoice`, `High escalation 34%` | Churn prediction rule engine |
| `Action` | Ghost Button | Context-sensitive intervention button (`Contact`, `Debug`, `Invoice`, `Review AI`) | Operator workflow trigger |

### 5.3 Live Monitor: Recent Completed Calls (Last 30 min)
| Field | Type | Description | Sample Values |
|-------|------|-------------|---------------|
| `Time` | Monospace Timestamp | Time of call completion (`HH:mm:ss`) | `19:38:22`, `19:36:11` |
| `Restaurant` | String | Restaurant handling the call | Mama's Pizzeria, Thai Express |
| `Duration` | Formatted String | Duration of call in minutes and seconds | `2m 14s`, `1m 58s`, `0m 45s` |
| `Outcome` | Status Chip | Terminal state of conversation | `Ordered` (green), `Abandoned` (gray), `Escalated` (blue) |
| `Order Value` | Currency ($) or dash | Total price of captured items | `$47.50`, `$38.00`, `—` |
| `Payment` | Status Chip | Stripe payment status | `Paid` (green), `Pending` (yellow), `—` |
| `POS` | Status Chip | POS sync state | `Synced` (green), `Waiting` (gray), `—` |

### 5.4 Restaurants: Fleet Management Directory (487 Tenants)
| Field | Type | Description | Sample Values |
|-------|------|-------------|---------------|
| `Restaurant` | String + Subtitle | Name, Suburb, State, Onboarding date | "Mama's Pizzeria" (Carlton VIC · Since Mar 2026) |
| `Plan` | Chip (Purple/Blue/Gray) | Subscription tier | `Enterprise`, `Pro`, `Starter` |
| `State` | Text (2-3 chars) | Australian state code | `VIC`, `NSW`, `QLD`, `WA` |
| `Calls/mo` | Integer | Monthly call volume | 2,847, 1,543, 512, 89 |
| `Orders/mo` | Integer | Monthly order volume | 2,115, 1,189, 287, 41 |
| `Completion%` | Percentage + Health Bar | Order capture success rate | 74% (fill-green), 56% (fill-yellow), 46% (fill-red) |
| `Health` | Composite Badge | 0-100 score combining uptime, accuracy, sync | `● 98`, `● 95`, `● 61`, `● 34` |
| `POS` | Chip | POS integration provider & health | `Square ✓`, `Lightspeed ✓`, `Email only`, `Square ✗ errors` |
| `Status` | Status Chip | Tenant account standing | `Active` (green), `At Risk` (yellow), `Churning` (red) |
| `MRR` | Currency ($ AUD) | Monthly subscription revenue | `$3,500`, `$1,500`, `$500` |
| `Actions` | Button | Detailed inspection action | `View` or `Debug` |

### 5.5 Audit Log: Platform Event Ledger
| Field | Type | Description | Sample Values |
|-------|------|-------------|---------------|
| `Timestamp` | ISO Monospace | Date and time of action (`YYYY-MM-DD HH:mm:ss`) | `2026-08-29 19:38:22` |
| `Event Type` | Chip (Caps) | Domain category of event | `ORDER`, `ESCALATION`, `BILLING`, `RESTAURANT`, `SYSTEM`, `POS`, `AUTH`, `ONBOARD` |
| `Actor` | String | Originating agent, user, or service | `AI Agent`, `Monitoring`, `System`, `aj@designjoom.in`, `owner@mamaspizza.com` |
| `Resource` | String | Target entity or restaurant | `Mama's Pizzeria`, `Deepgram Flux`, `The Greek Place` |
| `Detail` | String | Detailed event narrative | "Order #4821 confirmed · $47.50 · Paid · POS synced", "Square POS sync failed (3 retries)..." |
| `IP` | Monospace String | Source IP address or internal origin | `system`, `203.x.x.x`, `101.x.x.x` |

### 5.6 Analytics: Abandonment Diagnostics & Conversion Funnel
1. **Abandonment Breakdown Table:**
   - Columns: `Reason`, `Count`, `% of Abandoned`
   - Key Causes: Call dropped (network: 34%), Customer hung up voluntarily (25%), STT misunderstanding ×3 (20%), Item not available (13%), Restaurant closed / outside hours (8%).
2. **Payment Conversion Funnel Table:**
   - Stages: Calls received (100%) → Orders confirmed (74.2%) → SMS sent (100%) → Link opened (91.0%) → Payment completed (82.7%) → POS synced (98.0%).

---

## 6. System-Level Metrics & Platform Analytics

### 6.1 Platform Executive KPIs
- **Active Restaurants:** 487 (94% plan active, +12 weekly net adds).
- **MRR (Monthly Recurring Revenue):** $125.4K (+5.5% MoM, ARR run-rate $1.51M).
  - *Note on Model Divergence:* Revenue view calculates tier sum: Enterprise (43 × $3,500 avg = $150.5K) + Pro (184 × $1,500 avg = $276K) + Starter (260 × $500 avg = $130K) = $556.5K Gross GMV-based revenue, whereas core SaaS MRR is $125.4K. Both must be represented.
- **Calls Today:** 2,847 (+18% vs yesterday, 23 live concurrent).
- **Churn Rate:** 2.1% (+0.3% MoM, 10 restaurants flagged at risk).
- **Order Completion Rate:** 74.2% (Target: ≥70%).
- **Payment Conversion Rate:** 82.7% (Target: ≥80%).
- **Avg E2E Pipeline Latency:** 387ms (Target: <500ms; down 23ms vs yesterday).
- **Call Escalation Rate:** 11.4% (Target: ≤15%; down 0.8% WoW).

### 6.2 Unit Economics & Cost per Minute (COGS)
- **Telnyx SIP Inbound/Outbound:** $0.018/min (23% of total cost).
- **Deepgram Flux STT:** $0.007/min (9% of total cost).
- **OpenAI GPT-4.1 LLM:** $0.012/min (15% of total cost).
- **ElevenLabs TTS Audio Streaming:** $0.012/min (15% of total cost).
- **SMS Delivery + Payment Links:** $0.005/min (6% of total cost).
- **Railway Compute / Infrastructure:** $0.008/min (10% of total cost).
- **Total Pipeline Cost:** **$0.062 per minute**.
- **Average Call Revenue (3 min call):** **$0.30 per call**.
- **Platform Gross Margin:** **31%**.

### 6.3 Infrastructure Telemetry Spec
1. **Telnyx SIP:** 23 active calls, 180ms call setup time, 12ms AU PoP latency, 0.01% packet loss (Status: Operational).
2. **Deepgram Flux (STT):** TTFT 94ms (elevated vs 70ms baseline), 97.2% accuracy, 0.4% error rate (Status: Elevated Latency).
3. **OpenAI GPT-4.1:** 312ms avg response time, 4.2K tok/s throughput, 0.1% error rate, $187 spend today (Status: Operational).
4. **ElevenLabs TTS:** 180ms TTFA, 1.24M characters synthesized today, 0.0% error rate, $223 spend today (Status: Operational).
5. **Stripe:** 1,841 links sent, 82.7% conversion, 220ms webhook latency, $68,440 GMV today (Status: Operational).
6. **Supabase (Postgres):** 8ms P95 query time, 127/500 connections, 14.2 GB disk used, 84/s pgvector similarity queries (Status: Operational).
7. **Upstash Redis:** 23 active sessions, 99.4% cache hit rate, 2ms latency, 284MB RAM used (Status: Operational).
8. **Square POS API:** 1,842 orders synced, 98.1% success rate, 340ms sync time, 3 failed/retrying (Status: Operational).
9. **LiveKit Voice Agent:** 23 active rooms, 50/50 pool allocated, 387ms P95 latency, 4 Railway replicas active (Status: Operational).

---

## 7. Domain Models Implied by UI & Supabase Schema Mapping

### 7.1 Entity Relationship Diagram (ERD) Overview
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      plans      │       │   auth.users    │       │   audit_logs    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ email           │       │ timestamp       │
│ monthly_cents   │       └────────┬────────┘       │ event_type      │
│ call_limit      │                │                │ actor           │
└────────┬────────┘                │                │ resource        │
         │                         │                │ detail, ip      │
         │ 1:N                     │ 1:N            └─────────────────┘
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   restaurants   │◄──────┤restaurant_users │
├─────────────────┤ 1:N   ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ restaurant_id   │
│ phone_number    │       │ user_id         │
│ telnyx_number   │       │ role            │
│ plan_id (FK)    │       └─────────────────┘
│ active          │
│ suburb, state   │       ┌─────────────────┐
│ pos_provider    │       │   menu_items    │
│ health_score    │       ├─────────────────┤
│ ai_instructions │       │ id (PK)         │
└────────┬────────┘       │ restaurant_id   │
         │                │ name, price     │
         │ 1:N            │ embedding       │
         ├────────────────┴────────┐
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│      calls      │       │  subscriptions  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ restaurant_id   │       │ restaurant_id   │
│ caller_number   │       │ plan_id         │
│ state           │       │ stripe_sub_id   │
│ started_at      │       │ status          │
│ ended_at        │       └─────────────────┘
│ stt_confidence  │
│ abandonment_rsn │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐       ┌─────────────────┐
│     orders      │◄──────┤ payment_events  │
├─────────────────┤ 1:1   ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ call_id (FK)    │       │ order_id (FK)   │
│ items (jsonb)   │       │ stripe_link     │
│ total_cents     │       │ sent_at         │
│ state           │       │ opened_at       │
│ pos_order_id    │       │ paid_at         │
└─────────────────┘       └─────────────────┘
```

### 7.2 Database Model Alignment & Additions

#### 1. Table: `restaurants`
Existing columns in `backend/supabase_schema.sql`:
`id`, `name`, `phone_number`, `telnyx_number`, `plan_id`, `active`, `ai_instructions`, `timezone`, `created_at`.  
**Required UI Extensions:**
- `suburb` (text) — e.g. "Carlton", "Newtown", "South Bank".
- `state` (text) — Australian state code ("VIC", "NSW", "QLD").
- `pos_provider` (text default 'square') — 'square' | 'lightspeed' | 'email_only' | 'none'.
- `pos_status` (text default 'synced') — 'synced' | 'waiting' | 'error'.
- `health_score` (int default 100) — Composite score 0-100 calculated by background worker.
- `churn_risk` (text nullable) — 'low_usage' | 'pos_errors' | 'overdue_invoice' | 'high_escalation' | null.

#### 2. Table: `calls`
Existing columns in `backend/supabase_schema.sql`:
`id`, `restaurant_id`, `caller_number`, `state`, `started_at`, `ended_at`, `transcript`, `stt_confidence`, `livekit_room`.  
**Required UI Extensions:**
- `duration_seconds` (int generated or recorded upon hang-up).
- `outcome` (text default 'in_progress') — 'ordered' | 'abandoned' | 'escalated'.
- `abandonment_reason` (text nullable) — 'call_dropped_network' | 'customer_hung_up' | 'stt_misunderstanding_3x' | 'item_not_available' | 'outside_hours'.
- `escalation_reason` (text nullable) — 'stt_failure' | 'customer_requested_human'.
- `current_items` (jsonb default '[]') — Live cart items updated during `TAKING_ORDER`.

#### 3. Table: `orders`
Existing columns in `backend/supabase_schema.sql`:
`id`, `call_id`, `restaurant_id`, `items`, `total_cents`, `state`, `pos_order_id`, `created_at`.  
*Compatible as-is.*

#### 4. Table: `payment_events`
Existing columns in `backend/supabase_schema.sql`:
`id`, `order_id`, `stripe_payment_link`, `stripe_session_id`, `sent_at`, `paid_at`, `expires_at`.  
**Required UI Extensions:**
- `opened_at` (timestamptz nullable) — Timestamp when customer opened the SMS payment link (used in conversion funnel).

#### 5. Table: `subscriptions` & `plans`
Existing columns in `backend/supabase_schema.sql`:
`plans(id, name, monthly_cents, call_limit)`, `subscriptions(id, restaurant_id, plan_id, stripe_subscription_id, status, current_period_end)`.  
*Compatible as-is.*

#### 6. Table: `audit_logs` (New Table Required)
```sql
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  timestamp   timestamptz not null default now(),
  event_type  text not null, -- 'ORDER', 'ESCALATION', 'BILLING', 'RESTAURANT', 'SYSTEM', 'POS', 'AUTH', 'ONBOARD'
  actor       text not null, -- 'AI Agent', 'System', 'Monitoring', or user email
  resource    text not null, -- Entity affected (Restaurant name, system service, etc.)
  detail      text not null,
  ip_address  text default 'system',
  metadata    jsonb default '{}'
);
create index if not exists idx_audit_logs_event_type on audit_logs(event_type);
create index if not exists idx_audit_logs_timestamp on audit_logs(timestamp desc);
```

#### 7. Table: `platform_metrics_snapshots` (Optional/Synthetic Telemetry)
Table or Redis keys caching:
- `mrr_cents`, `calls_today`, `active_restaurants_count`, `avg_latency_ms`, `escalation_rate_float`.
- Subsystem health metrics (Telnyx, Deepgram, OpenAI, ElevenLabs, Stripe, Supabase, Redis, Square, LiveKit).

---

## 8. State Management & Operator Action Workflows

### 8.1 Client & Server State Architecture
1. **URL & Navigation Routing (Next.js 16 App Router):**
   - Routes structured under `frontend/src/app/(admin)/`:
     - `/admin` → redirects to `/admin/overview`
     - `/admin/overview` → Platform Overview & KPIs
     - `/admin/live` → Live Call Monitor
     - `/admin/restaurants` → Restaurant Fleet Management
     - `/admin/restaurants/[id]` → Deep-dive tenant configuration & telemetry
     - `/admin/users` → User & Role Management
     - `/admin/revenue` → Financials, Unit Economics & COGS
     - `/admin/billing` → Stripe Subscriptions & Invoicing
     - `/admin/infra` → Subsystem Health & Latency Monitor
     - `/admin/audit` → Audit Log
     - `/admin/analytics` → Platform Performance & Conversion Funnel
2. **Server State (TanStack Query v5):**
   - Query keys: `['admin', 'overview']`, `['admin', 'live-calls']`, `['admin', 'restaurants', { filter, search }]`, `['admin', 'audit-logs', { type, range }]`, `['admin', 'infra-health']`.
   - Polling / Stale Time: Live monitor polls every 3s (or Supabase Realtime WebSocket); audit log refreshes every 30s.
3. **Real-Time WebSockets (Supabase Realtime):**
   - Channel `realtime:calls`: listens to `INSERT` and `UPDATE` on table `calls` to update Live Call Cards and Topbar Live Badge.
   - Channel `realtime:audit_logs`: pushes new audit events directly to the table stream.
4. **Local / UI State (Zustand store: `useAdminStore`):**
   - Active filters (geographic state, call state, time window, search term).
   - Active modals / slide-over drawers.
   - Live call elapsed timers (client-side ticking interval).

### 8.2 Operator Actions State Machine
```
[Select Restaurant]
       │
       ├─► [View Details] ─────────► Inspect calls, menu embeddings, POS settings
       │
       ├─► [Debug POS Errors] ─────► Inspect payload failure → [Retry Sync] or [Switch to Email]
       │
       ├─► [Review AI / Escalation]► Inspect STT mishears → [Adjust Prompts] or [Re-index Menu]
       │
       ├─► [Invoice / Billing] ────► Check Stripe status → [Resend Payment Link]
       │
       └─► [Add New Restaurant] ───► Provision Telnyx DID → Create DB Record → Send Owner Invite
```

---

## 9. Implementation Roadmap for Frontend (Sprint 4)

1. **Shared Layout (`frontend/src/app/(admin)/layout.tsx`):**
   - Sidebar with collapsible mobile support, navigation links, and operational status widget.
   - Topbar with live call badge ticker and operator profile.
2. **Sub-Pages & Views:**
   - Implement `overview/page.tsx`, `live/page.tsx`, `restaurants/page.tsx`, `revenue/page.tsx`, `infra/page.tsx`, `audit/page.tsx`, `analytics/page.tsx`, `users/page.tsx`, `billing/page.tsx`.
3. **Component Library (`frontend/src/components/admin/`):**
   - `KpiCard.tsx` — Standard metric card with label, value, delta, and icon.
   - `LiveCallCard.tsx` — Dynamic card with border color styling, live timer, and state dot.
   - `RestaurantTable.tsx` — Searchable, filterable fleet table with health bars.
   - `InfraServiceCard.tsx` — Status badge, 4 metric rows, and fill progress bar.
   - `AuditLogTable.tsx` — Event category chip styling, actor metadata, IP tags.
   - `Charts/` — Recharts implementations of Hourly Calls, MRR Growth, Daily Orders vs Calls, Cuisine Performance.
   - `Modals/AddRestaurantModal.tsx` & `Modals/PosDebugModal.tsx`.
4. **Backend Integration & Supabase Wiring:**
   - Expand `backend/app/api/admin.py` to support `/stats`, `/restaurants`, `/calls/live`, `/calls/recent`, `/audit`, `/infra`.
   - Wire frontend components to call `/api/admin/*` or direct Supabase client with RLS superadmin token.
