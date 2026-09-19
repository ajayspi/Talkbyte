# Adversarial Stress Testing Analysis: Playwright Journey 1 & Journey 2

**Agent**: `challenger_m4_1`  
**Milestone**: M4 (Playwright E2E Testing Suite)  
**Parent Agent**: `parent` (`b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`)  
**Target Specs**:
- `frontend/e2e/owner-login.spec.ts` (Journey 1: Owner Login -> Dashboard Loads)
- `frontend/e2e/menu-availability.spec.ts` (Journey 2: Menu Availability Toggle)  
**Date**: 2026-09-14T06:20:00Z  

---

## Executive Summary

An adversarial examination and stress test of Playwright Journeys 1 and 2 was performed against the frontend App Router implementation (`src/app/(auth)/login/page.tsx`, `src/app/(restaurant)/dashboard/page.tsx`, `src/app/(restaurant)/layout.tsx`, `src/components/restaurant/DashboardTab.tsx`, `src/components/restaurant/MenuTab.tsx`, and `src/lib/planGating.ts`).

### Key Findings:
1. **[CRITICAL / HIGH] Strict Mode Selector Collision in Journey 1 (`owner-login.spec.ts:73`)**:
   - Selector `page.locator('text=Calls Today')` performs substring matching. On `/dashboard`, `DashboardTab.tsx` contains TWO elements matching this substring:
     1. Top KPI metric card: `<div ...>Calls Today</div>` (line 108)
     2. Hourly chart card title: `<CardTitle>Calls Today (by hour)</CardTitle>` (line 275)
   - Playwright locator assertions (e.g. `expect(locator).toBeVisible()`) enforce **strict mode**. Resolving 2 elements causes Playwright to immediately throw a runtime exception:
     `Error: strict mode violation: locator('text=Calls Today') resolved to 2 elements`
   - **Impact**: Journey 1 fails under `npx playwright test`.
   - **Mitigation**: Update selector to exact match or `.first()`:
     `page.locator('text="Calls Today"').first()` or `page.getByText('Calls Today', { exact: true })`.

2. **[MEDIUM] Journey 1 Lacks Negative Authentication & Persistence Coverage**:
   - `owner-login.spec.ts` tests exclusively the happy path.
   - No assertions exist for invalid credentials (error banner rendered when Supabase returns 400), empty form submission validation, or session persistence on reload (`page.reload()`).
   - While R3 in `ORIGINAL_REQUEST.md` minimally demands "(1) restaurant owner login → dashboard loads", the absence of negative testing leaves login error handling unverified in E2E.

3. **[MEDIUM] Rapid Toggle State Race Condition in `MenuTab.tsx`**:
   - `handleToggleAvailability(item.id, item.available)` captures `item.available` from the component render closure rather than utilizing a functional state update (`setItems(prev => ...)`).
   - If two clicks are fired concurrently in rapid succession without awaiting DOM re-rendering, both clicks capture the initial state (`true`), dispatching two "unavailable" mutations instead of toggling back and forth.
   - While `menu-availability.spec.ts` awaits badge state (`expect(badge).toContainText('Unavailable')`) before issuing the second click—avoiding a test failure in normal sequential execution—the underlying UI component lacks click debouncing or disabling during state transitions.

4. **[PASSED] Plan Gating Non-Interference in Journey 2**:
   - `menu:availability_toggle` is defined with `minLevel: 1` (`starter` tier) in `planGating.ts`.
   - The toggle switch in `MenuTab.tsx` (line 344) is completely un-gated and accessible to all tiers without upgrade modal prompts.

5. **[PASSED] Toast Notification Matching (`<30s`)**:
   - Toast text is generated as `` `✓ ${newAvailable ? 'Available' : 'Out of stock'}: AI voice agent synced in <30s.` ``.
   - Selectors `text=Out of stock` and `text=Available: AI voice agent synced` match the generated toast cleanly.
   - Toast display duration is 3500ms, ample for Playwright assertions without flakiness.

6. **[PASSED] Zero Hardcoded Sleeps**:
   - Both test files avoid `page.waitForTimeout()` in favor of web-first assertions and URL navigation waiting (`page.waitForURL`), adhering to Playwright best practices.

---

## Detailed Challenge Matrix

| Challenge ID | Target | Category | Severity | Description | Status |
|---|---|---|---|---|---|
| CH-01 | `owner-login.spec.ts:73` | Strict Selector Collision | **HIGH** | `page.locator('text=Calls Today')` resolves to 2 DOM elements (`Calls Today` and `Calls Today (by hour)`), throwing a strict mode violation in Playwright. | **CONFIRMED BUG** |
| CH-02 | `owner-login.spec.ts` | Test Coverage Gap | **MEDIUM** | Missing negative test for invalid login credentials (`div.bg-red-50` error banner). | **GAP** |
| CH-03 | `MenuTab.tsx` | Race Condition | **MEDIUM** | Non-functional state update in `handleToggleAvailability` leads to state clobbering under rapid un-awaited double clicks. | **CONFIRMED RISK** |
| CH-04 | `menu-availability.spec.ts` | Selector Collision | **LOW** | `.menu-item-card` is used by both menu items and the "+ Add New Item" card. Safely mitigated in test via `.first()`. | **MITIGATED** |
| CH-05 | `MenuTab.tsx` | Plan Gating Interference | **LOW** | Potential for plan gating to lock out menu toggle on free/starter tiers. Verified NOT gated. | **PASSED** |
| CH-06 | `menu-availability.spec.ts` | Timing & Toast | **LOW** | Toast auto-dismiss timing vs Playwright assertion speed. Verified 3500ms timeout is robust. | **PASSED** |

---

## Deep Dive Analysis

### 1. Challenge CH-01: Strict Mode Selector Collision on `Calls Today`

#### The Problem:
In `frontend/e2e/owner-login.spec.ts`:
```typescript
72:    // 7. Assert KPI cards are displayed
73:    await expect(page.locator('text=Calls Today')).toBeVisible();
74:    await expect(page.locator('text=Revenue Today')).toBeVisible();
```

In `frontend/src/components/restaurant/DashboardTab.tsx`:
- Line 108 (Top KPI Card):
  ```tsx
  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calls Today</div>
  ```
- Line 275 (Hourly Chart Card Title):
  ```tsx
  <CardTitle>Calls Today (by hour)</CardTitle>
  ```

#### Playwright Selector Resolution:
In Playwright, selector strings starting with `text=` perform case-insensitive substring matching unless exact match delimiters are provided:
- `page.locator('text=Calls Today')` matches both `<div>Calls Today</div>` and `<h3>Calls Today (by hour)</h3>`.
- Since Playwright v1.14, locator assertions like `expect(locator).toBeVisible()` enforce strict mode by default.
- When more than one element matches, Playwright fails the test with:
  ```
  Error: strict mode violation: locator('text=Calls Today') resolved to 2 elements:
      1) <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calls Today</div>
      2) <h3 class="font-semibold leading-none tracking-tight text-lg text-white">Calls Today (by hour)</h3>
  ```

#### Recommended Fix:
Change `frontend/e2e/owner-login.spec.ts` line 73 to:
```typescript
await expect(page.locator('text="Calls Today"').first()).toBeVisible();
```
or:
```typescript
await expect(page.getByText('Calls Today', { exact: true })).toBeVisible();
```

---

### 2. Challenge CH-03: Rapid Toggle State and Closure Capture in `MenuTab.tsx`

#### The Problem:
In `frontend/src/components/restaurant/MenuTab.tsx`:
```tsx
const handleToggleAvailability = async (id: string, currentAvailable: boolean) => {
  const newAvailable = !currentAvailable;
  // Optimistic UI state update
  setItems((prev) =>
    prev.map((item) =>
      item.id === id ? { ...item, available: newAvailable } : item
    )
  );

  // Call Supabase backend mutation
  try {
    await toggleMenuItemAvailability(id, newAvailable);
    showToast(
      `✓ ${newAvailable ? 'Available' : 'Out of stock'}: AI voice agent synced in <30s.`
    );
  } catch {
    showToast(`Updated locally. AI sync pending.`);
  }
};
```

#### Race Condition Trigger:
In JSX:
```tsx
<div
  className={`toggle ${item.available ? 'on' : ''}`}
  onClick={() => handleToggleAvailability(item.id, item.available)}
  title="Toggle availability for AI voice ordering"
/>
```
If two click events occur within <50ms before React completes state re-rendering and DOM reconciliation:
1. Click 1 receives `currentAvailable = true`, computes `newAvailable = false`, schedules state update to `false`.
2. Click 2 fires before re-render, still reading `item.available = true` from the old closure.
3. Click 2 computes `newAvailable = false` again, scheduling state update to `false` twice instead of restoring `true`.
4. Both clicks trigger `toggleMenuItemAvailability(id, false)`.

#### Playwright Journey 2 Resilience:
In `frontend/e2e/menu-availability.spec.ts`:
```typescript
52:    await toggle.click();
53:
54:    // 5. Verify badge updates immediately to Unavailable with badge-red
55:    await expect(badge).toContainText('Unavailable');
56:    await expect(badge).toHaveClass(/badge-red/);
...
63:    await toggle.click();
```
Because the test awaits `expect(badge).toContainText('Unavailable')` between clicks, React completes the re-render cycle before Click 2 occurs. Thus, the test itself does not flake under ordinary execution. However, this is an inherent fragility in the component under rapid stress.

---

### 3. Verification of Plan Gating Non-Interference (Journey 2)

We audited `frontend/src/lib/planGating.ts` and `frontend/src/components/restaurant/MenuTab.tsx`:
- `planGating.ts` line 168:
  ```typescript
  'menu:availability_toggle': {
    minLevel: 1,
    minTier: 'starter',
    title: 'Instant 30s Availability Toggle',
    description: 'Update AI availability in real-time within 30 seconds.',
    upgradeCtaText: '',
  }
  ```
- In `MenuTab.tsx`, while `menu:web_scraper` and `menu:csv_upload` are gated via `canAccess()` checks, the availability `.toggle` is NOT gated.
- The toggle is directly interactive for all tenant plans (`starter`, `growth`, `enterprise`), ensuring 100% feature availability as required.

---

### 4. Toast Message Verification (`<30s`)

In `MenuTab.tsx` line 157:
```typescript
`✓ ${newAvailable ? 'Available' : 'Out of stock'}: AI voice agent synced in <30s.`
```
In `menu-availability.spec.ts`:
- Check 1: `page.locator('text=Out of stock')` matches `"✓ Out of stock: AI voice agent synced in <30s."`
- Check 2: `page.locator('text=Available: AI voice agent synced')` matches `"✓ Available: AI voice agent synced in <30s."`
Both match deterministically and unambiguously.

---

## Verdict

**Verdict**: `REQUEST_CHANGES`

**Reason**:
1. `frontend/e2e/owner-login.spec.ts` line 73 (`await expect(page.locator('text=Calls Today')).toBeVisible();`) contains a fatal strict selector collision with `Calls Today (by hour)` that will cause Playwright to fail with a strict mode violation when executed.
2. Minor fix required: replace `page.locator('text=Calls Today')` with `page.locator('text="Calls Today"').first()` or `page.getByText('Calls Today', { exact: true })`.
