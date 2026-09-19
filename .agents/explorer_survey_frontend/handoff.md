# Handoff Report: Frontend Configuration Interfaces Survey (R1, R2, R3)

**Agent**: `explorer_survey_frontend`  
**Milestone**: survey_frontend  
**Target Recipient**: Parent Orchestrator (`b87ce451-d3cf-4526-818f-49b010cd25db`)  
**Date**: 2026-09-19  

---

## 1. Observation

1. **Staff Management Mock in `SettingsTab.tsx`**:
   - `frontend/src/components/restaurant/SettingsTab.tsx:15-20`:
     ```typescript
     interface StaffMember {
       id: string;
       name: string;
       role: 'Owner' | 'Manager' | 'Staff';
       lastLogin: string;
     }
     ```
   - `frontend/src/components/restaurant/SettingsTab.tsx:83-86`:
     ```typescript
     const [staffList, setStaffList] = useState<StaffMember[]>([
       { id: '1', name: 'John Rossi', role: 'Owner', lastLogin: 'Now' },
       { id: '2', name: 'Sarah M.', role: 'Manager', lastLogin: '2h ago' },
     ]);
     ```
   - `frontend/src/components/restaurant/SettingsTab.tsx:121-137`:
     `handleInviteStaff` appends an in-memory object `{ id: 'staff-${Date.now()}', name: newStaffName, role: newStaffRole, lastLogin: 'Pending Invite' }` to `staffList` without any HTTP call or database query.
   - `backend/supabase_schema.sql:38-45`: Defines `restaurant_users` table with `id`, `restaurant_id`, `user_id`, `role`, `created_at`.
   - `frontend/src/types/database.types.ts:31-39`: Defines `RestaurantUser` interface.

2. **Integrations Section in `SettingsTab.tsx`**:
   - `frontend/src/components/restaurant/SettingsTab.tsx:211-304`:
     - Square POS (lines 217-230): Hardcoded green badge `<span className="badge badge-green"><span className="status-dot green" />Connected</span>` with description `Mama's Pizzeria — Newtown`. No configuration trigger or modal.
     - Stripe Checkout (lines 232-245): Hardcoded green badge `<span className="badge badge-green"><span className="status-dot green" />Active</span>`. No configuration trigger.
     - Twilio SMS (lines 247-260): Hardcoded green badge `<span className="badge badge-green"><span className="status-dot green" />Active</span>`. No configuration trigger.
     - Shopify POS (lines 262-303): Has boolean state `shopifyConnected` (line 80). If false, button "Connect" calls `setShopifyConnected(true)` with no credential inputs.
   - `backend/app/services/pos/square.py:16-26`: Requires `access_token`, `location_id`, and `environment` ('sandbox' | 'production').
   - `backend/app/api/payments.py:16-24`: Requires `publishable_key`, `secret_key`, and `webhook_secret`.
   - `backend/app/services/sms.py:30-49`: Requires sender credentials (Twilio Account SID, Auth Token, From Phone Number or Telnyx API key).

3. **AI Greeting Script Generator in `SettingsTab.tsx`**:
   - `frontend/src/components/restaurant/SettingsTab.tsx:328-354`:
     - Button at line 340-347:
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
     - Uses synchronous template string interpolation. No API call, no LLM integration, no `isGeneratingScript` loading state.

4. **Types & API Clients**:
   - `frontend/src/types/database.types.ts`: Has `RestaurantUser` and 10 tables, but is missing `RestaurantIntegration` interface and `restaurant_integrations` table entry.
   - `frontend/src/lib/api.ts`: Only contains `getOrders` and `createOrder`; missing helpers for greeting script generation, staff invitations, and integrations.
   - `frontend/src/lib/supabase.ts`: Has `getUsers()`, but lacks dedicated `getStaffMembers(restaurantId)` and `getRestaurantIntegrations(restaurantId)`.

5. **Build Configuration & Tests**:
   - `frontend/package.json:5-14`: Scripts include `"build": "next build"`, `"test": "jest"`, `"test:e2e": "playwright test"`.
   - `frontend/next.config.mjs:7-9`: `typescript: { ignoreBuildErrors: false }` enforces strict type checking.
   - `frontend/__tests__/restaurant-dashboard.test.tsx:184-231`: Unit test checks that `SettingsTab` renders labels "Business Details", "Square POS", "Stripe Checkout", "Twilio SMS", "Shopify POS", "AI Voice Settings", "Save Voice Configuration", "Staff Access", "John Rossi", "Sarah M.", and tests the Invite Modal flow.

---

## 2. Logic Chain

1. **Staff Management (R1)**:
   - Observation 1 proves `staffList` is purely in-memory React state with hardcoded items ("John Rossi", "Sarah M.").
   - Connecting to real data requires querying `supabase.from('restaurant_users').select('*').eq('restaurant_id', venueId)` on mount.
   - Submitting the invite form must call `POST /api/staff/invite` via `apiCall` with `{ restaurant_id, email, name, role }`, while maintaining optimistic/fallback state so offline environments and unit tests pass.

2. **Integrations Configuration (R2)**:
   - Observation 2 proves all 4 integrations currently display static badges or a dummy toggle without key inputs.
   - Requirement R2 mandates opening a modal or navigating to a dedicated route (e.g. `/dashboard/integrations/square`) to securely collect and save keys.
   - A hybrid architecture is ideal:
     - An `IntegrationConfigModal` in `SettingsTab.tsx` providing quick in-place configuration with inputs tailored per provider (Square: Location ID & Access Token; Stripe: Publishable Key & Secret Key; Twilio: Account SID & Auth Token; Shopify: Shop Domain & Access Token).
     - Dedicated Next.js App Router route at `frontend/src/app/(restaurant)/dashboard/integrations/[provider]/page.tsx` for direct URL access.
     - Saving writes to `restaurant_integrations` via Supabase and/or backend `POST /api/integrations`.

3. **AI Greeting Script Generator (R3)**:
   - Observation 3 shows "Generate with AI" merely evaluates an inline template string.
   - To satisfy R3, the button must trigger an asynchronous POST request to FastAPI (`POST /api/voice/generate-greeting`) with `{ restaurant_name, persona }`.
   - Adding `isGeneratingScript` state enables disabling the button, showing a loading indicator, updating the textarea with the generated text, and falling back gracefully on network errors.

4. **Build & Test Compatibility**:
   - Observation 5 shows strict TypeScript checking and Jest unit tests verifying specific text in `SettingsTab.tsx`.
   - Any refactoring must preserve initial UI element text and test IDs while adding new types to `database.types.ts`.

---

## 3. Caveats

1. **Backend Endpoint Availability**: The backend endpoints (`POST /api/voice/generate-greeting`, `POST /api/staff/invite`, `POST /api/integrations`) are concurrently being explored/designed by `explorer_survey_backend`. The frontend implementation should include resilient fallbacks (mock seed data & local generation fallback) to prevent offline development and build breaks.
2. **Profiles Table vs Auth Join**: In Supabase, client-side queries cannot directly join `auth.users` unless exposed via a database view, public `profiles` table, or backend service-role endpoint. Adding `name` and `email` columns to `restaurant_users` (or using the backend invite endpoint) solves this cleanly.

---

## 4. Conclusion

The frontend requirements are clearly defined, scoped, and architecturally straightforward to implement:
1. `SettingsTab.tsx` can be enhanced to load staff from `restaurant_users` and POST invites to the backend.
2. An `IntegrationConfigModal` and `/dashboard/integrations/[provider]` route can be introduced to configure Square, Stripe, Twilio, and Shopify credentials.
3. The "Generate with AI" button can be wired to `POST /api/voice/generate-greeting` with a clear loading spinner and textarea update.
4. `database.types.ts`, `api.ts`, and `supabase.ts` need minor type and helper additions.
5. All updates can be made 100% type-safe without breaking existing Jest or Playwright test suites.

Detailed documentation is available in `analysis.md`.

---

## 5. Verification Method

1. **Type Safety & Build Verification**:
   - Command: `npm run build` from `frontend/` directory.
   - Invalidation Condition: Any TypeScript errors or export mismatches.
2. **Unit Test Verification**:
   - Command: `npm test` or `npx jest __tests__/restaurant-dashboard.test.tsx` from `frontend/` directory.
   - Invalidation Condition: SettingsTab test failures on business details, integration badges, or invite modal submission.
3. **E2E Test Verification**:
   - Command: `npx playwright test` from `frontend/` directory.
   - Invalidation Condition: Any broken routes or hydration mismatches.
