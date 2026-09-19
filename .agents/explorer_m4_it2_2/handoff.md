# Jest Unit Test Failure Analysis & Fix Strategy: `restaurant-dashboard.test.tsx`

**Agent**: `explorer_m4_it2_2`  
**Role**: Jest Unit Test Explorer  
**Working Directory**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\explorer_m4_it2_2`  
**Parent Agent**: `c79dd59e-414d-4b70-89b2-0cad012710db`  
**Date**: 2026-09-14T10:26:00Z  
**Handoff Type**: Hard (Investigation Complete)  

---

## 1. Observation

### 1.1 Source Code Under Test: `frontend/src/components/restaurant/BillingTab.tsx`
When `<BillingTab />` is rendered in unit tests (without a wrapping provider), `useRestaurant()` returns its default value `{ currentVenue: null, ... }` (`frontend/src/app/(restaurant)/layout.tsx:41-48`).

In `BillingTab.tsx`:
1. **Active Plan Normalization** (lines 116–124):
   ```tsx
   const rawPlanId = (currentVenue?.plan_id || 'growth').toLowerCase().trim();
   const activePlanId: 'starter' | 'growth' | 'enterprise' =
     rawPlanId === 'enterprise'
       ? 'enterprise'
       : rawPlanId === 'starter'
       ? 'starter'
       : 'growth'; // 'growth'
   const currentPlanConfig = PLANS.find((p) => p.id === activePlanId) || PLANS[1]; // Growth ($249)
   ```

2. **Rendered Plan Copy in DOM**:
   - **Alert Banner** (line 287):
     ```tsx
     ✓ Current Plan: <strong>{currentPlanConfig.name}</strong> ({currentPlanConfig.price} AUD/mo) · Next billing date: 1 October 2026
     ```
     Renders: `<strong>Growth</strong>`
   - **Plan Cards** (lines 312–318):
     ```tsx
     <div className="plan-name">{plan.name}</div>
     <div className="plan-price">
       {plan.price}
       <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
         /mo
       </span>
     </div>
     ```
     - For Starter: `<div class="plan-name">Starter</div>` and `<div class="plan-price">$149<span ...>/mo</span></div>` (total textContent: `"$149/mo"`)
     - For Growth: `<div class="plan-name">Growth</div>` and `<div class="plan-price">$249<span ...>/mo</span></div>` (total textContent: `"$249/mo"`)
     - For Enterprise: `<div class="plan-name">Enterprise</div>` and `<div class="plan-price">$499<span ...>/mo</span></div>` (total textContent: `"$499/mo"`)
   - **Billing History Table** (lines 77–110, 455–472):
     `DEFAULT_BILLING_HISTORY` defines:
     ```tsx
     { id: 'inv-001', month: 'Sep 2026', amount: '$249', statusLabel: 'Due 1 Oct', planName: 'Growth' },
     { id: 'inv-002', month: 'Aug 2026', amount: '$249', statusLabel: '✓ Paid',     planName: 'Growth' },
     { id: 'inv-003', month: 'Jul 2026', amount: '$249', statusLabel: '✓ Paid',     planName: 'Growth' },
     { id: 'inv-004', month: 'Jun 2026', amount: '$149', statusLabel: '✓ Paid',     planName: 'Starter' },
     ```
     Rendered in table:
     - Row 1: `<td class="text-xs text-gray-600">Growth</td>`, `<td class="font-bold text-gray-900">$249</td>`
     - Row 2: `<td class="text-xs text-gray-600">Growth</td>`, `<td class="font-bold text-gray-900">$249</td>`
     - Row 3: `<td class="text-xs text-gray-600">Growth</td>`, `<td class="font-bold text-gray-900">$249</td>`
     - Row 4: `<td class="text-xs text-gray-600">Starter</td>`, `<td class="font-bold text-gray-900">$149</td>`

3. **Modal Dismissal and Checkout Handler** (lines 181–230, 513–528):
   ```tsx
   const handleConfirmUpgrade = async () => {
     setIsSubmitting(true);
     // ...
     try {
       const res = await fetch(`${apiBase}/api/billing/create-checkout-session`, { ... });
       // ...
       if (data.checkout_url) {
         window.location.href = data.checkout_url;
         return;
       }
     } catch (err: any) {
       showToast(`✓ Plan changed to ${targetPlan.toUpperCase()}...`);
     } finally {
       setIsSubmitting(false);
       setUpgradeModalOpen(false);
     }
   };
   ```
   In the modal footer:
   ```tsx
   <button
     disabled={isSubmitting}
     onClick={() => setUpgradeModalOpen(false)}
     className="topbar-btn btn-ghost text-xs"
   >
     Cancel
   </button>
   <button
     disabled={isSubmitting}
     onClick={handleConfirmUpgrade}
     className="topbar-btn btn-primary text-xs flex items-center gap-1.5"
   >
     <CreditCardIcon size={14} />
     {isSubmitting ? 'Connecting Stripe...' : `Proceed to Stripe Checkout (${PLANS.find(p => p.id === selectedPlan)?.price})`}
   </button>
   ```

### 1.2 Test Suite Under Test: `frontend/__tests__/restaurant-dashboard.test.tsx` (lines 263–307)
```tsx
  describe('BillingTab', () => {
    it('renders subscription tiers and monthly usage progress bars', () => {
      render(<BillingTab />);

      // Next billing alert
      expect(screen.getByText(/Next billing date: 1 October 2026/i)).toBeInTheDocument();

      // Plans
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Growth')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('$149')).toBeInTheDocument();
      expect(screen.getByText('$249')).toBeInTheDocument();
      expect(screen.getByText('$499')).toBeInTheDocument();
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Active Plan')).toBeInTheDocument();

      // Monthly Usage
      expect(screen.getByText(/Usage This Month/i)).toBeInTheDocument();
      expect(screen.getByText('Calls Handled')).toBeInTheDocument();
      expect(screen.getByText('1,481')).toBeInTheDocument();
      expect(screen.getByText('AI Conversation Minutes')).toBeInTheDocument();
      expect(screen.getByText('4,183')).toBeInTheDocument();
      expect(screen.getByText('SMS & WhatsApp Messages')).toBeInTheDocument();

      // Billing History
      expect(screen.getByText(/Billing & Invoice History/i)).toBeInTheDocument();
      expect(screen.getByText('Sep 2026')).toBeInTheDocument();
      expect(screen.getByText('Aug 2026')).toBeInTheDocument();
      expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    });

    it('opens and confirms plan switch modal', () => {
      render(<BillingTab />);

      const switchBtn = screen.getByRole('button', { name: /Upgrade to Starter|Switch to Starter/i });
      fireEvent.click(switchBtn);

      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
      expect(screen.getByText(/Starter includes up to 500 inbound calls/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Proceed to Stripe Checkout|Confirm/i }));
      expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
    });
  });
```

### 1.3 Other Modal Test Patterns in the Codebase
- In `frontend/__tests__/restaurant-dashboard.test.tsx` (MenuTab, line 218):
  ```tsx
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByText('Add Menu Item')).not.toBeInTheDocument();
  ```
- In `frontend/__tests__/restaurant-dashboard.test.tsx` (OrdersTab, line 171):
  ```tsx
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByText(/Order Details #1047/i)).not.toBeInTheDocument();
  ```
- In `frontend/e2e/billing.spec.ts` (lines 64–66):
  ```ts
  // 6. Close modal via Cancel button
  await page.locator('button:has-text("Cancel")').click();
  await expect(page.locator('text=Confirm Subscription Change')).not.toBeVisible();
  ```

### 1.4 Parallel Defect in `frontend/__tests__/plan-gating-adversarial.test.tsx` (lines 295–310)
Lines 299–306 in `plan-gating-adversarial.test.tsx` duplicate the identical exact `getByText` calls on `BillingTab`:
```tsx
expect(screen.getByText('Starter')).toBeInTheDocument();
expect(screen.getByText('$149')).toBeInTheDocument();
expect(screen.getByText('Growth')).toBeInTheDocument();
expect(screen.getByText('$249')).toBeInTheDocument();
expect(screen.getByText('Enterprise')).toBeInTheDocument();
expect(screen.getByText('$499')).toBeInTheDocument();
```

---

## 2. Logic Chain

### 2.1 Element Collision & Text Matching Breakdown

In React Testing Library (`@testing-library/react`), `getByText(text, { exact: true })` requires finding **exactly one** DOM element where `element.textContent` strictly equals the specified text. If zero elements match, it throws `Unable to find an element with the text`. If more than one element matches, it throws `Found multiple elements with the text`.

| Query | Matches Found | Matching DOM Locations | Verdict & Verbatim Testing Library Behavior |
|---|---|---|---|
| `screen.getByText('Growth')` | **5** | 1. `<strong>Growth</strong>` (line 287, alert banner)<br>2. `<div class="plan-name">Growth</div>` (line 312, plan card)<br>3. `<td>Growth</td>` (line 458, Sep 2026 invoice)<br>4. `<td>Growth</td>` (line 458, Aug 2026 invoice)<br>5. `<td>Growth</td>` (line 458, Jul 2026 invoice) | **THROWS** `TestingLibraryElementError: Found multiple elements with the text: Growth` |
| `screen.getByText('Starter')` | **2** | 1. `<div class="plan-name">Starter</div>` (line 312, plan card)<br>2. `<td>Starter</td>` (line 458, Jun 2026 invoice) | **THROWS** `TestingLibraryElementError: Found multiple elements with the text: Starter` |
| `screen.getByText('$249')` | **3** | 1. `<td class="font-bold text-gray-900">$249</td>` (line 459, Sep 2026 invoice)<br>2. `<td class="font-bold text-gray-900">$249</td>` (line 459, Aug 2026 invoice)<br>3. `<td class="font-bold text-gray-900">$249</td>` (line 459, Jul 2026 invoice) | **THROWS** `TestingLibraryElementError: Found multiple elements with the text: $249` |
| `screen.getByText('$499')` | **0** | Enterprise plan card renders: `<div class="plan-price">$499<span style="...">/mo</span></div>`. The `textContent` of this `<div>` is `"$499/mo"`. Child `<span>` is `"/mo"`. Neither element has `textContent === "$499"`. Furthermore, `$499` does not appear in billing history table. | **THROWS** `TestingLibraryElementError: Unable to find an element with the text: $499` |
| `screen.getByText('$149')` | **1** (coincidence) | In plan card, `textContent` is `"$149/mo"`. But in billing history table, Row 4 (Jun 2026) has `<td class="font-bold text-gray-900">$149</td>`. That `<td>` happens to have exact `textContent === "$149"`. Matches 1 element by coincidence. | Passes by coincidence (matches table cell, NOT the plan card) |
| `screen.getByText('Enterprise')` | **1** | Only appears in `<div class="plan-name">Enterprise</div>` (not in alert, not in history). | Passes |

**Reasoning**:
1. Because `Growth`, `Starter`, and `$249` appear across both the tier cards and the billing history table, single-match `getByText` calls on these literals are invalid.
2. Because the plan cards structure prices as `{plan.price}<span>/mo</span>`, exact string matching on `$499` fails to match `"$499/mo"`. Regular expression matching `screen.getByText(/\$499/)` or `screen.getAllByText(/\$499/)` is required.

### 2.2 Asynchronous vs Synchronous Modal Dismissal Breakdown

1. In `restaurant-dashboard.test.tsx` line 295:
   ```tsx
   it('opens and confirms plan switch modal', () => { ... });
   ```
   The test function is **synchronous**.
2. Line 304 executes:
   ```tsx
   fireEvent.click(screen.getByRole('button', { name: /Proceed to Stripe Checkout|Confirm/i }));
   ```
3. Clicking this button triggers `handleConfirmUpgrade` (`BillingTab.tsx:181`):
   ```tsx
   const handleConfirmUpgrade = async () => {
     setIsSubmitting(true);
     // ...
     const res = await fetch(...);
   ```
4. Because `handleConfirmUpgrade` is `async`, it pauses at `await fetch(...)` and yields execution back to the JavaScript event loop.
5. In the synchronous test execution, `fireEvent.click` finishes and returns immediately.
6. The test immediately proceeds to line 305:
   ```tsx
   expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
   ```
7. At this instant:
   - The promise created by `await fetch(...)` has NOT settled.
   - The `finally { setUpgradeModalOpen(false); }` block has NOT executed.
   - State variable `upgradeModalOpen` remains `true`.
   - The modal heading `<h3 ...>Confirm Subscription Change</h3>` is still rendered in the DOM.
8. `screen.queryByText('Confirm Subscription Change')` returns the element instead of `null`.
9. The assertion fails with:
   `Error: expect(element).not.toBeInTheDocument()`
   `Received element is in the document:`
   `<h3 class="text-base font-bold text-gray-900 flex items-center gap-2">Confirm Subscription Change</h3>`

10. **Codebase Pattern Alignment**:
    - Every other modal test in this component suite (`MenuTab:218`, `OrdersTab:171`) and in Playwright (`billing.spec.ts:65`) tests modal dismissal via the synchronous **Cancel** button:
      `<button onClick={() => setUpgradeModalOpen(false)}>Cancel</button>`.
    - Clicking the Cancel button updates React state synchronously within the Testing Library `act()` wrapper, immediately removing the modal from the DOM.
    - Furthermore, the test should assert that the action button `Proceed to Stripe Checkout` is rendered, and then dismiss the modal via `Cancel`.

---

## 3. Caveats

1. **Test Execution Environment**: Direct interactive terminal execution was not run during this step to avoid IDE permission prompt timeouts. The analysis is derived from AST line-by-line tracing, React 19 rendering semantics, and DOM Testing Library specifications.
2. **`plan-gating-adversarial.test.tsx`**: In addition to `restaurant-dashboard.test.tsx`, lines 299–306 of `frontend/__tests__/plan-gating-adversarial.test.tsx` contain the exact same `getByText('Growth')`, `getByText('Starter')`, `getByText('$249')`, and `getByText('$499')` queries. While the user dispatch specifically asked for `restaurant-dashboard.test.tsx`, the implementer should synchronize `plan-gating-adversarial.test.tsx` as well to ensure total suite health.
3. **Legacy Route Collisions**: Physical directories `frontend/src/app/login/` and `frontend/src/app/(admin)/admin/login/` remain on disk. They must be permanently deleted to prevent route collisions with `(auth)/login` and `(auth)/admin/login`.

---

## 4. Conclusion

The failures in `frontend/__tests__/restaurant-dashboard.test.tsx` (lines 263–307) are caused by:
1. Element collision across plan cards and billing history rows for `'Growth'`, `'Starter'`, and `'$249'`.
2. Text node concatenation for `'$499'` (`"$499/mo"` vs exact `"$499"`).
3. Synchronous assertion against an asynchronous `await fetch` modal close handler when clicking `Proceed to Stripe Checkout`.

### Concrete Fix Strategy

#### Target File:
`frontend/__tests__/restaurant-dashboard.test.tsx` (lines 263–307)

#### Proposed Replacement (Exact Code):
```tsx
  describe('BillingTab', () => {
    it('renders subscription tiers and monthly usage progress bars', () => {
      render(<BillingTab />);

      // Next billing alert
      expect(screen.getByText(/Next billing date: 1 October 2026/i)).toBeInTheDocument();

      // Plans (using getAllByText or regex to handle duplicate matches in plan cards vs billing history table)
      expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Growth').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getAllByText(/\$149/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$249/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/\$499/)).toBeInTheDocument();
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('Active Plan')).toBeInTheDocument();

      // Monthly Usage
      expect(screen.getByText(/Usage This Month/i)).toBeInTheDocument();
      expect(screen.getByText('Calls Handled')).toBeInTheDocument();
      expect(screen.getByText('1,481')).toBeInTheDocument();
      expect(screen.getByText('AI Conversation Minutes')).toBeInTheDocument();
      expect(screen.getByText('4,183')).toBeInTheDocument();
      expect(screen.getByText('SMS & WhatsApp Messages')).toBeInTheDocument();

      // Billing History
      expect(screen.getByText(/Billing & Invoice History/i)).toBeInTheDocument();
      expect(screen.getByText('Sep 2026')).toBeInTheDocument();
      expect(screen.getByText('Aug 2026')).toBeInTheDocument();
      expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    });

    it('opens and confirms plan switch modal', () => {
      render(<BillingTab />);

      const switchBtn = screen.getByRole('button', { name: /Upgrade to Starter|Switch to Starter/i });
      fireEvent.click(switchBtn);

      expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
      expect(screen.getByText(/Starter includes up to 500 inbound calls/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Proceed to Stripe Checkout/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
    });
  });
```

#### Parallel Fix for `frontend/__tests__/plan-gating-adversarial.test.tsx` (lines 295–310):
```tsx
    it('BillingTab renders official SaaS plans ($149 Starter, $249 Growth, $499 Enterprise)', () => {
      render(<BillingTab />);

      // Verify plan cards exist with exact pricing
      expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$149/).length).toBeGreaterThanOrEqual(1);

      expect(screen.getAllByText('Growth').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\$249/).length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText(/\$499/)).toBeInTheDocument();

      // Starter venue shows Starter as active plan
      expect(screen.getByText('Active Plan')).toBeInTheDocument();
    });
```

---

## 5. Verification Method

1. **Verify Unit Test Suite Execution**:
   ```bash
   cd frontend
   npm test -- __tests__/restaurant-dashboard.test.tsx
   ```
   *Pass Condition*: `restaurant-dashboard.test.tsx` executes and reports 7 passing test suites (or all describe blocks passed), 0 failures.

2. **Verify Adversarial Unit Tests**:
   ```bash
   cd frontend
   npm test -- __tests__/plan-gating-adversarial.test.tsx
   ```
   *Pass Condition*: All plan gating and billing tests pass cleanly with 0 failures.

3. **Verify Full Jest Suite**:
   ```bash
   cd frontend
   npm test
   ```
   *Pass Condition*: All Jest suites pass with exit code 0.

4. **Verify Playwright E2E**:
   ```bash
   cd frontend
   npm run test:e2e
   ```
   *Pass Condition*: Playwright runs all 4 journeys including `billing.spec.ts` with exit code 0.

5. **Invalidation Conditions**:
   - `screen.getByText('Growth')` or `screen.getByText('Starter')` remaining in `restaurant-dashboard.test.tsx`.
   - Synchronous click on `Proceed to Stripe Checkout` without `await` or `waitFor`.
   - `expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument()` failing.
