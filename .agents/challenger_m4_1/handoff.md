# Challenger M4-1 Handoff Report: Adversarial Stress-Testing of Playwright Journey 1 & 2

**Agent**: `challenger_m4_1`  
**Milestone**: M4 (Playwright E2E Testing Suite)  
**Parent Agent**: `parent` (`b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`)  
**Verdict**: `REQUEST_CHANGES`  
**Date**: 2026-09-14T06:22:00Z  
**Handoff Type**: Hard (Review Complete)  

---

## 1. Observation

1. **Journey 1 Spec (`frontend/e2e/owner-login.spec.ts`)**:
   - Line 73:
     ```typescript
     await expect(page.locator('text=Calls Today')).toBeVisible();
     ```
   - In `frontend/src/components/restaurant/DashboardTab.tsx`:
     - Line 108:
       ```tsx
       <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calls Today</div>
       ```
     - Line 275:
       ```tsx
       <CardTitle>Calls Today (by hour)</CardTitle>
       ```
   - In Playwright, `page.locator('text=Calls Today')` is an unquoted substring match that matches any element whose text includes "Calls Today".
   - In Playwright (v1.14+), all locator assertions such as `expect(locator).toBeVisible()` operate in strict mode by default.

2. **Journey 1 Authentication & Inputs (`frontend/src/app/(auth)/login/page.tsx`)**:
   - Lines 69-100 define `input[type="email"]`, `input[type="password"]`, and `button[type="submit"]`. These match 1:1 with selectors in `owner-login.spec.ts` (lines 46–48) without collisions.
   - Lines 55–59 define error banner rendering:
     ```tsx
     {error && (
       <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
         {error}
       </div>
     )}
     ```
   - `owner-login.spec.ts` does not contain any assertions or test cases for invalid credentials or error display.

3. **Journey 2 Spec (`frontend/e2e/menu-availability.spec.ts`)**:
   - Line 40 safely isolates the target card using `.first()`:
     ```typescript
     const firstCard = page.locator('.menu-item-card').first();
     ```
     This avoids collision with the 8 other menu item cards and the "+ Add New Item" card (`MenuTab.tsx:355`).
   - Line 59 matches `text=Out of stock` and line 70 matches `text=Available: AI voice agent synced`.
   - In `MenuTab.tsx` line 157, the toast format is:
     ```typescript
     `✓ ${newAvailable ? 'Available' : 'Out of stock'}: AI voice agent synced in <30s.`
     ```
     This matches the test locators.

4. **Journey 2 Rapid Toggle & Plan Gating (`frontend/src/components/restaurant/MenuTab.tsx`)**:
   - In `MenuTab.tsx` lines 144–162:
     ```tsx
     const handleToggleAvailability = async (id: string, currentAvailable: boolean) => {
       const newAvailable = !currentAvailable;
       setItems((prev) =>
         prev.map((item) =>
           item.id === id ? { ...item, available: newAvailable } : item
         )
       );
       ...
     ```
     `currentAvailable` is read from closure argument, not atomically calculated from previous state.
   - In `frontend/src/lib/planGating.ts` line 168:
     ```typescript
     'menu:availability_toggle': {
       minLevel: 1,
       minTier: 'starter',
       title: 'Instant 30s Availability Toggle',
       description: 'Update AI availability in real-time within 30 seconds.',
       upgradeCtaText: '',
     }
     ```
     The toggle switch (`MenuTab.tsx:344`) is not gated by `canAccess()`, so it is permanently enabled across all subscription tiers.

---

## 2. Logic Chain

1. From Observation 1: Playwright locator assertions (`toBeVisible()`) enforce strict mode. The selector `page.locator('text=Calls Today')` performs substring matching.
2. From Observation 1: The restaurant dashboard contains both `<div ...>Calls Today</div>` (KPI card) and `<CardTitle>Calls Today (by hour)</CardTitle>` (chart title).
3. Therefore, resolving `page.locator('text=Calls Today')` yields 2 elements, causing Playwright to throw a strict mode violation error during test execution. This is an active failure mode in Journey 1.
4. From Observation 4: In `MenuTab.tsx`, `menu:availability_toggle` is in the `starter` tier (level 1) and has no conditional gating wrapper around its `<div className="toggle" />`. Therefore, menu availability is never blocked by plan gating.
5. From Observation 3: Toast messages rendered in `MenuTab.tsx` line 157 contain `<30s` text and match `text=Out of stock` and `text=Available: AI voice agent synced` as expected by Journey 2.
6. From Observation 3 & 4: In Journey 2, awaiting `expect(badge).toContainText('Unavailable')` between toggle clicks gives React sufficient time to re-render, preventing the closure race condition during normal test runs.
7. From Observation 2: While the single happy-path login test meets the literal wording of R3 ("(1) restaurant owner login → dashboard loads"), the strict selector collision in line 73 will prevent `npx playwright test` from passing cleanly.

---

## 3. Caveats

1. **Interactive Terminal Block**: CLI command execution via `run_command` in this environment prompted for interactive user confirmation and timed out. Verification was performed through rigorous static AST, DOM tree, and Playwright selector semantics analysis.
2. **Component Level Race Condition**: The non-functional state updater in `handleToggleAvailability` represents a UI component risk under rapid un-awaited clicks, but does not cause test failure in `menu-availability.spec.ts` because Playwright waits for badge text between clicks.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

**Required Action**:
Fix the strict selector collision in `frontend/e2e/owner-login.spec.ts`:
- **File**: `frontend/e2e/owner-login.spec.ts`
- **Line**: 73
- **Current**:
  ```typescript
  await expect(page.locator('text=Calls Today')).toBeVisible();
  ```
- **Change to**:
  ```typescript
  await expect(page.locator('text="Calls Today"').first()).toBeVisible();
  ```
  *(or `await expect(page.getByText('Calls Today', { exact: true })).toBeVisible();`)*

---

## 5. Verification Method

1. **Inspect Selector in `owner-login.spec.ts`**:
   `view_file` at `frontend/e2e/owner-login.spec.ts:73`. Verify whether it uses an exact match (`text="Calls Today"`) or `.first()`.
2. **Inspect Competing Element in `DashboardTab.tsx`**:
   `view_file` at `frontend/src/components/restaurant/DashboardTab.tsx:275`. Verify presence of `<CardTitle>Calls Today (by hour)</CardTitle>`.
3. **Execute Playwright Test (when CLI is available)**:
   ```bash
   cd frontend
   npx playwright test e2e/owner-login.spec.ts
   ```
   - Before fix: Fails with `Error: strict mode violation: locator('text=Calls Today') resolved to 2 elements`.
   - After fix: Passes with exit code 0.
4. **Invalidation Conditions**:
   - If Playwright's strict mode is globally disabled or if `<CardTitle>Calls Today (by hour)</CardTitle>` does not match `text=Calls Today`.
