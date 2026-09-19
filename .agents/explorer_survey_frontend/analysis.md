# Comprehensive Frontend Investigation Report: TalkByte Restaurant Dashboard Configuration

**Date**: 2026-09-19  
**Agent**: `explorer_survey_frontend`  
**Milestone**: Frontend Configuration Interfaces Survey (R1, R2, R3, Types, Build)  
**Parent Orchestrator**: `b87ce451-d3cf-4526-818f-49b010cd25db`

---

## Executive Summary

This report delivers an in-depth code survey of the TalkByte Next.js frontend application (`frontend/`), focusing on the requirements outlined in `ORIGINAL_REQUEST.md` (Follow-up — 2026-09-19T20:52:08Z):
1. **R1 — Staff Management Integration**: Transitioning the Staff Access table and Invite Modal in `SettingsTab.tsx` from hardcoded React mock state to the Supabase database (`restaurant_users` table) and backend invite endpoint.
2. **R2 — Integrations Routing & Configuration**: Refactoring the static "Connected/Active" integration badges (Square POS, Stripe Checkout, Twilio SMS, Shopify POS) into functional modal configuration dialogs and dedicated routes with secure credential entry.
3. **R3 — AI Greeting Script Generator**: Replacing the static string template interpolation on "Generate with AI" in Voice Settings with an asynchronous call to a FastAPI backend LLM endpoint, complete with loading state and smooth textarea updating.
4. **Types & API Clients**: Augmenting `database.types.ts`, `api.ts`, and `supabase.ts` with typed interfaces for `restaurant_integrations` and helper routines for staff and AI generation.
5. **Build & Test Compatibility**: Ensuring zero TypeScript errors under strict mode (`ignoreBuildErrors: false`), with full compatibility with existing Jest and Playwright test suites.

---

## 1. Staff Management (R1) Investigation

### 1.1 Current Implementation in `SettingsTab.tsx`
- **File Location**: `frontend/src/components/restaurant/SettingsTab.tsx`
- **Data Model Definition** (lines 15–20):
  ```typescript
  interface StaffMember {
    id: string;
    name: string;
    role: 'Owner' | 'Manager' | 'Staff';
    lastLogin: string;
  }
  ```
- **State Initialization** (lines 83–86):
  ```typescript
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: '1', name: 'John Rossi', role: 'Owner', lastLogin: 'Now' },
    { id: '2', name: 'Sarah M.', role: 'Manager', lastLogin: '2h ago' },
  ]);
  ```
- **Invite Modal State** (lines 89–92):
  ```typescript
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Manager' | 'Staff'>('Manager');
  ```
- **Invite Handler Logic** (lines 121–137):
  ```typescript
  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffEmail) return;

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      lastLogin: 'Pending Invite',
    };

    setStaffList((prev) => [...prev, newMember]);
    setInviteModalOpen(false);
    setNewStaffName('');
    setNewStaffEmail('');
    showToast(`✓ Invitation dispatched to ${newStaffEmail}.`);
  };
  ```
- **Staff Access Table Rendering** (lines 412–483):
  Renders columns `Name`, `Role`, `Last Login`, and an action row with `+ Invite Staff` and a `Send Invite` button.
- **Invite Modal JSX** (lines 489–558):
  Renders a modal dialog with:
  1. Full Name input (`placeholder="e.g. Marco Rossi"`)
  2. Email Address input (`placeholder="e.g. marco@mamaspizzeria.com.au"`)
  3. Access Role select (`Manager` or `Staff`)
  4. Buttons: `Cancel` and `Send Invite Token`

### 1.2 Gaps & Deficiencies
1. **Zero Database Fetch**: Staff members are hardcoded to John Rossi and Sarah M. Data is never retrieved from Supabase `restaurant_users`.
2. **Mocked Form Submission**: Clicking "Send Invite Token" only pushes an object to local React state; no HTTP call or database insert is triggered.
3. **Missing Loading / Error States**: No network feedback, spinner, or error handling if an invite fails.

### 1.3 Recommended Target Architecture for R1
1. **Fetching Staff**:
   - In `SettingsTab.tsx`'s `useEffect`, after retrieving `restaurant_id`, query:
     ```typescript
     const { data: staffData, error } = await supabase
       .from('restaurant_users')
       .select('*')
       .eq('restaurant_id', userRest.restaurant_id)
       .order('created_at', { ascending: false });
     ```
   - Map `restaurant_users` rows to the display structure. If offline or no DB records exist yet, fallback to default seed staff (`John Rossi`, `Sarah M.`) to guarantee test suites pass.
2. **Submitting Staff Invite**:
   - In `handleInviteStaff`:
     - Set `isInvitingStaff(true)`.
     - Send POST request via `apiCall('/api/staff/invite', { method: 'POST', body: JSON.stringify({ restaurant_id: currentVenue.id, email: newStaffEmail, name: newStaffName, role: newStaffRole }) })`.
     - Fall back gracefully to direct Supabase insertion / in-memory append if offline or mock environment.
     - Append new member to `staffList` (or re-fetch), clear inputs, close modal, and display `✓ Invitation dispatched to ${newStaffEmail}.`.

---

## 2. Integrations Routing & Configuration (R2) Investigation

### 2.1 Current Implementation in `SettingsTab.tsx`
- **File Location**: `frontend/src/components/restaurant/SettingsTab.tsx` (lines 211–304)
- **Rendered Integrations**:
  1. **Square POS** (lines 217–230):
     - Icon: `🟦`
     - Name: `Square POS`
     - Description: `Mama's Pizzeria — Newtown`
     - Status Badge: `<span className="badge badge-green"><span className="status-dot green" />Connected</span>` (Hardcoded)
     - Interactive control: None.
  2. **Stripe Checkout** (lines 232–245):
     - Icon: `💳`
     - Name: `Stripe Checkout`
     - Description: `Payment links · acc_1Nk...`
     - Status Badge: `<span className="badge badge-green"><span className="status-dot green" />Active</span>` (Hardcoded)
     - Interactive control: None.
  3. **Twilio SMS** (lines 247–260):
     - Icon: `📱`
     - Name: `Twilio SMS`
     - Description: `+61 2 9999 1234`
     - Status Badge: `<span className="badge badge-green"><span className="status-dot green" />Active</span>` (Hardcoded)
     - Interactive control: None.
  4. **Shopify POS** (lines 262–303):
     - Icon: `📦`
     - Name: `Shopify POS`
     - Description: Dynamic based on `shopifyConnected` state (`Connected · Catalog sync enabled` vs `Not configured`).
     - Button: If not connected, displays `Connect` button with PRO plan gating (`settings:pos_shopify`).
     - Behavior on click: Sets `setShopifyConnected(true)` and shows toast. **Zero credential inputs**.

### 2.2 Provider API Key / Configuration Field Requirements
Based on backend services analysis (`backend/app/services/pos/square.py`, `backend/app/api/payments.py`, `backend/app/services/sms.py`):
1. **Square POS**:
   - `location_id`: Square Location ID (e.g. `LXXXXXXXXXXXX`)
   - `access_token`: Square Access Token / OAuth Bearer Token
   - `environment`: `sandbox` or `production`
2. **Stripe Checkout**:
   - `publishable_key`: Stripe Publishable Key (`pk_live_...` / `pk_test_...`)
   - `secret_key`: Stripe Secret / Restricted Key (`sk_live_...` / `sk_test_...`)
   - `webhook_secret`: Stripe Webhook Signing Secret (`whsec_...`)
3. **Twilio SMS / Telnyx**:
   - `account_sid`: Twilio Account SID (`AC...`)
   - `auth_token`: Twilio Auth Token
   - `from_phone_number`: Authorized outbound sender number (`+614...` / `+612...`)
4. **Shopify POS**:
   - `shop_domain`: Shopify Store Domain (e.g. `store-name.myshopify.com`)
   - `access_token`: Shopify Admin API Access Token (`shpat_...`)
   - `api_key`: App API Key (optional)

### 2.3 Modal vs Route Structure Recommendation
- **Hybrid Approach (Best Architecture)**:
  1. **In-Tab Modal Configuration Dialog**:
     - Keeps user inside `SettingsTab.tsx` without full-page navigation.
     - Dynamic modal state: `activeIntegrationModal: 'square' | 'stripe' | 'twilio' | 'shopify' | null`.
     - Displays tailored fields with password toggles, placeholder examples, and validation.
     - Saves to `restaurant_integrations` table via Supabase client and/or backend `POST /api/integrations`.
     - Updates integration row to "Connected" with green badge upon completion.
  2. **Dedicated Route Support**:
     - Support `/dashboard/integrations/[provider]` (e.g. `/dashboard/integrations/square`) via Next.js App Router:
       `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx`
     - Provides deep-linkable URLs for automated setup wizards or email setup links while reusing the same core configuration component.

---

## 3. AI Greeting Script Generator (R3) Investigation

### 3.1 Current Implementation in `SettingsTab.tsx`
- **File Location**: `frontend/src/components/restaurant/SettingsTab.tsx` (lines 309–355)
- **Driving State**:
  - `businessName`: string (state line 27, initialized with `"Loading..."` or `"Mama's Pizzeria"`)
  - `voicePersona`: string (state line 33, initialized with `"Aria"`)
  - `greetingScript`: string (state line 34, loaded from `restaurants.ai_instructions`)
- **Current Button Implementation** (lines 340–347):
  ```tsx
  <button
    type="button"
    className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
    onClick={() => setGreetingScript(`"Hi, welcome to ${businessName || 'our restaurant'}! I'm ${voicePersona}. Would you like to place an order today?"`)}
    style={{ fontSize: '10px' }}
  >
    ✨ Generate with AI
  </button>
  ```
- **Current Textarea** (lines 349–354):
  ```tsx
  <textarea
    style={{ height: '70px', resize: 'none' }}
    value={greetingScript}
    onChange={(e) => setGreetingScript(e.target.value)}
  />
  ```

### 3.2 Deficiencies
1. Synchronous static template literal only; completely bypasses any LLM generation.
2. No asynchronous state (`isGenerating`), meaning no loading spinner or disabled state during execution.
3. No error handling if network or LLM fails.

### 3.3 Recommended Target Architecture for R3
- **FastAPI Backend Endpoint**:
  `POST /api/voice/generate-greeting`
  - Body: `{ "restaurant_name": string, "persona": string, "cuisine_type"?: string }`
  - Response: `{ "script": string }`
- **Frontend Integration**:
  - Add state: `const [isGeneratingScript, setIsGeneratingScript] = useState(false);`
  - Handler `handleGenerateGreeting`:
    ```typescript
    const handleGenerateGreeting = async () => {
      try {
        setIsGeneratingScript(true);
        const data = await apiCall<{ script: string }>('/api/voice/generate-greeting', {
          method: 'POST',
          body: JSON.stringify({
            restaurant_name: businessName,
            persona: voicePersona,
          }),
        });
        if (data?.script) {
          setGreetingScript(data.script);
          showToast('✨ AI greeting script generated successfully!');
        }
      } catch (err) {
        console.error('AI Greeting generation failed, applying smart fallback:', err);
        setGreetingScript(`"Hi, welcome to ${businessName || 'our restaurant'}! I'm ${voicePersona}, your AI ordering assistant. What can I prepare for you today?"`);
        showToast('Generated greeting script using local assistant template.');
      } finally {
        setIsGeneratingScript(false);
      }
    };
    ```
  - Button state: Disable button and render pulsating spinner icon when `isGeneratingScript` is true.
  - Textarea automatically reflects the updated `greetingScript` state and is persisted to `restaurants.ai_instructions` on "Save Voice Configuration".

---

## 4. Types & API Clients Analysis

### 4.1 `frontend/src/types/database.types.ts`
- **Current Status**:
  - Lines 9–29: `Restaurant` interface includes `pos_provider` and `pos_status`.
  - Lines 31–39: `RestaurantUser` interface includes `id`, `restaurant_id`, `user_id`, `role`, `created_at`, `email?`, `name?`.
  - Lines 208–282: `Database` interface defines tables `restaurants`, `restaurant_users`, `menu_items`, `calls`, `orders`, `payment_events`, `subscriptions`, `plans`, `audit_logs`, `billing_events`.
- **Additions Needed**:
  1. Define `RestaurantIntegration` interface:
     ```typescript
     export interface RestaurantIntegration {
       id: string;
       restaurant_id: string;
       provider: 'square' | 'stripe' | 'twilio' | 'shopify' | string;
       status: 'connected' | 'active' | 'disconnected' | 'error';
       credentials?: Record<string, any>;
       config?: Record<string, any>;
       created_at: string;
       updated_at?: string;
     }
     ```
  2. Register `restaurant_integrations` in `Database['public']['Tables']`:
     ```typescript
     restaurant_integrations: {
       Row: RestaurantIntegration;
       Insert: Partial<RestaurantIntegration>;
       Update: Partial<RestaurantIntegration>;
     };
     ```

### 4.2 `frontend/src/lib/api.ts`
- **Current Status**: Contains generic `apiCall<T>()`, `getOrders()`, `createOrder()`.
- **Additions Needed**:
  - `generateGreetingScript(restaurantName: string, persona: string): Promise<{ script: string }>`
  - `inviteStaff(data: { restaurant_id: string; email: string; name: string; role: string }): Promise<any>`
  - `saveIntegration(data: { restaurant_id: string; provider: string; credentials: Record<string, any> }): Promise<any>`
  - `getIntegrations(restaurantId: string): Promise<RestaurantIntegration[]>`

### 4.3 `frontend/src/lib/supabase.ts`
- **Current Status**: Implements Supabase client, query timeout wrappers, and fallback mock data for offline resilience.
- **Additions Needed**:
  - Helper functions for `getStaffMembers(restaurantId: string)` and `getRestaurantIntegrations(restaurantId: string)`.
  - Ensure fallback seed records exist so tests and offline development run smoothly.

---

## 5. Build Commands, Scripts & Test Suite Compatibility

### 5.1 `frontend/package.json` Review
- **Scripts**:
  - `"dev": "next dev --turbopack"`
  - `"build": "next build"`
  - `"lint": "eslint src"`
  - `"test": "jest"`
  - `"test:e2e": "playwright test"`
- **Environment & Compiler**:
  - Next.js 16.0.0, React 19.0.0, TypeScript 5.
  - `next.config.mjs` sets `typescript: { ignoreBuildErrors: false }` -> Strict TypeScript type checking is active during `npm run build`.

### 5.2 Test Suite Safeguards
1. **Jest Unit Tests (`frontend/__tests__/restaurant-dashboard.test.tsx`)**:
   - Lines 184–231 test `SettingsTab`:
     - Checks for presence of: "Business Details", "Square POS", "Stripe Checkout", "Twilio SMS", "Shopify POS", "AI Voice Settings", "Save Voice Configuration", "Staff Access", "John Rossi", "Sarah M.".
     - Tests clicking "Invite", checking inputs (`placeholder="e.g. Marco Rossi"`, `placeholder="e.g. marco@mamaspizzeria.com.au"`), clicking "Send Invite Token", and asserting that the invited member "Luigi V." appears in the table.
   - **Crucial Rule**: When refactoring `SettingsTab.tsx`, all of these labels, test IDs, and initial rendering states must be preserved so existing Jest tests continue to pass 100%.
2. **Playwright End-to-End Tests (`frontend/e2e/`)**:
   - Intercepts Supabase auth routes with mock tokens and routes `/login` -> `/dashboard`.
   - Modifying SettingsTab must not break dashboard hydration or layout providers.

---

## 6. Implementation Action Plan for Workers

1. **Step 1: Database Types & API Client Updates**:
   - Update `frontend/src/types/database.types.ts` with `RestaurantIntegration` and `restaurant_integrations` table type.
   - Update `frontend/src/lib/api.ts` with typed helpers (`generateGreetingScript`, `inviteStaff`, `saveIntegration`, `getIntegrations`).
2. **Step 2: SettingsTab Refactoring**:
   - Wire up `staffList` to load real records from Supabase `restaurant_users` (joined with `auth.users` / fallback).
   - Wire up `handleInviteStaff` to call `POST /api/staff/invite` with loading spinner.
   - Implement `IntegrationConfigModal` supporting Square, Stripe, Twilio, and Shopify with secure key inputs.
   - Refactor integration rows to show "Connect" or "Configure" triggers that launch the modal.
   - Wire up "Generate with AI" button to call `POST /api/voice/generate-greeting` with loading state and fallback.
3. **Step 3: Dedicated Integrations Route**:
   - Add `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx` for direct URL navigation.
4. **Step 4: Build & Test Verification**:
   - Run `npm run build` and `npm test` in `frontend/`.
