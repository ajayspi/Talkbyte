# Review & Adversarial Analysis: Milestone M4 Test Suite Sync & Package Config

**Reviewer**: `reviewer_m4_2`  
**Working Directory**: `.agents/reviewer_m4_2/`  
**Target Files**:
- `frontend/package.json`
- `frontend/__tests__/restaurant-dashboard.test.tsx` (lines 263–307)
- `frontend/src/components/restaurant/BillingTab.tsx`
- `frontend/src/app/login/` & `frontend/src/app/(admin)/admin/login/` (Route Collision Safety)
- `frontend/playwright.config.ts` & `frontend/e2e/` (E2E Runner Verification)
**Verdict**: **REQUEST_CHANGES**

---

## 1. Executive Summary

Milestone M4 implementation by `worker_m4` configured `@playwright/test: "^1.50.0"` in `frontend/package.json`, configured `playwright.config.ts` with webServer and single-worker execution, implemented 4 Playwright E2E journey specs in `frontend/e2e/`, and added npm lifecycle hooks (`predev`, `prebuild`, `pretest`) to purge duplicate route directories.

However, deep static code analysis and DOM structure tracing reveal **critical defects** in the synchronized Jest unit tests (`frontend/__tests__/restaurant-dashboard.test.tsx`) and **architectural fragility** in the route collision mitigation:
1. **Jest Test Incompatibility with Rendered DOM**: Lines 263–307 in `restaurant-dashboard.test.tsx` will fail when executed by Jest because multiple elements render `'Growth'`, `'Starter'`, and `'$249'` (triggering `TestingLibraryElementError: Found multiple elements...`), `'$499'` fails exact text matching against `<div className="plan-price">$499<span>/mo</span></div>`, and clicking `Proceed to Stripe Checkout` triggers an asynchronous `fetch` without `await waitFor(...)`, leaving the modal in the DOM when the synchronous negation assertion runs.
2. **Fragile Route Collision Hook**: Rather than permanently deleting the duplicate legacy folders `src/app/login/` and `src/app/(admin)/admin/login/` from the repository, `worker_m4` added a runtime Node deletion hook to `package.json`. These folders remain physically on disk, leaving a collision hazard for any direct CLI commands (e.g. `npx next build`, `next dev`).
3. **Self-Certifying Work**: Because interactive terminal commands timed out in the worker's session, the worker certified lines 263–303 as synchronized without verifying them against the actual rendered DOM of `BillingTab.tsx`.

---

## 2. Detailed Findings

### Finding 1: [Critical / Defect & Self-Certifying Work] Jest Assertions in `restaurant-dashboard.test.tsx` Incompatible with `BillingTab.tsx` DOM
- **Location**: `frontend/__tests__/restaurant-dashboard.test.tsx`, lines 263–307
- **Target Component**: `frontend/src/components/restaurant/BillingTab.tsx`
- **Issue Breakdown**:

#### A. Multiple Matching Elements for `getByText('Growth')`, `getByText('Starter')`, and `getByText('$249')`
In `@testing-library/react`, `screen.getByText(str)` throws an error if more than 1 matching element is found in the DOM. In `BillingTab.tsx`:
1. `'Growth'` is rendered in:
   - Line 287: `<strong>{currentPlanConfig.name}</strong>` inside the current plan banner (`✓ Current Plan: Growth ($249 AUD/mo)...`)
   - Line 312: `<div className="plan-name">{plan.name}</div>` inside the Growth plan card
   - Line 458: `<td className="text-xs text-gray-600">{inv.planName}</td>` in the Billing History table row for Sep 2026
   - Line 458: `<td className="text-xs text-gray-600">{inv.planName}</td>` in the Billing History table row for Aug 2026
   - Line 458: `<td className="text-xs text-gray-600">{inv.planName}</td>` in the Billing History table row for Jul 2026
   - Card title (line 361): `Usage This Month (Growth Plan)`
   *Result*: At least 5 elements have exact text `'Growth'`. Calling `screen.getByText('Growth')` throws:
   `TestingLibraryElementError: Found multiple elements with the text: Growth`

2. `'Starter'` is rendered in:
   - Line 312: `<div className="plan-name">Starter</div>`
   - Line 458: `<td className="text-xs text-gray-600">Starter</td>` in row Jun 2026
   *Result*: Calling `screen.getByText('Starter')` throws:
   `TestingLibraryElementError: Found multiple elements with the text: Starter`

3. `'$249'` is rendered in:
   - Line 459: `<td className="font-bold text-gray-900">$249</td>` in row Sep 2026
   - Line 459: `<td className="font-bold text-gray-900">$249</td>` in row Aug 2026
   - Line 459: `<td className="font-bold text-gray-900">$249</td>` in row Jul 2026
   *Result*: Calling `screen.getByText('$249')` throws:
   `TestingLibraryElementError: Found multiple elements with the text: $249`

#### B. Text Mismatch for Pricing Cards
In `BillingTab.tsx`, line 314:
```tsx
<div className="plan-price">
  {plan.price}
  <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
    /mo
  </span>
</div>
```
The text content of this `div` is `"$499/mo"`. Calling `screen.getByText('$499')` with default exact match (`exact: true`) fails to find any node whose full textContent is `"$499"` (unlike `$149` and `$249` which also appear in the table, `$499` does not appear in `DEFAULT_BILLING_HISTORY`).

#### C. Asynchronous Modal Dismissal vs. Synchronous Assertion
In `restaurant-dashboard.test.tsx`, lines 295–306:
```tsx
it('opens and confirms plan switch modal', () => {
  render(<BillingTab />);

  const switchBtn = screen.getByRole('button', { name: /Upgrade to Starter|Switch to Starter/i });
  fireEvent.click(switchBtn);

  expect(screen.getByText('Confirm Subscription Change')).toBeInTheDocument();
  expect(screen.getByText(/Starter includes up to 500 inbound calls/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Proceed to Stripe Checkout|Confirm/i }));
  expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
});
```
In `BillingTab.tsx`, clicking `Proceed to Stripe Checkout` executes `handleConfirmUpgrade` (lines 181–231):
```tsx
const handleConfirmUpgrade = async () => {
  setIsSubmitting(true);
  ...
  try {
    const res = await fetch(`${apiBase}/api/billing/create-checkout-session`, ...);
    ...
  } catch (err: any) {
    ...
  } finally {
    setIsSubmitting(false);
    setUpgradeModalOpen(false);
  }
};
```
Because `handleConfirmUpgrade` is an `async` function that pauses at `await fetch(...)`, control returns immediately from `fireEvent.click(...)`. The next line in the test:
`expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();`
runs synchronously while the promise is still pending. At this moment, `upgradeModalOpen` is still `true`.
The assertion fails because `Confirm Subscription Change` is still in the document!

- **Remediation**:
  1. In `restaurant-dashboard.test.tsx`, replace ambiguous `getByText` calls with scoped queries or `getAllByText`:
     - e.g., `expect(screen.getAllByText('Growth').length).toBeGreaterThanOrEqual(1);`
     - `expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);`
     - `expect(screen.getAllByText('$249').length).toBeGreaterThanOrEqual(1);`
     - `expect(screen.getByText(/499/)).toBeInTheDocument();`
  2. For modal closing:
     Either dismiss via the Cancel button (which is synchronous):
     ```tsx
     fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
     expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
     ```
     (exactly matching how `MenuTab` and `OrdersTab` test modal dismissal, and how `frontend/e2e/billing.spec.ts` line 65 tests it!)
     OR make the test `async` and use `await waitFor(() => expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument());` with mocked fetch.

---

### Finding 2: [Major / Architectural Fragility] Legacy Collision Folders Left on Disk
- **Location**:
  - `frontend/src/app/login/` (contains obsolete `page.tsx`)
  - `frontend/src/app/(admin)/admin/login/` (contains obsolete `page.tsx`)
  - `frontend/package.json` (`predev`, `prebuild`, `pretest` scripts)
- **Why this is a problem**:
  Next.js App Router forbids defining the same URL path across route groups:
  - `/login` is defined in both `src/app/(auth)/login/page.tsx` and `src/app/login/page.tsx`.
  - `/admin/login` is defined in both `src/app/(auth)/admin/login/page.tsx` and `src/app/(admin)/admin/login/page.tsx`.
  `worker_m4` added a runtime Node deletion hook:
  ```json
  "predev": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\""
  ```
  While this hook executes during `npm run dev`, `npm run build`, and `npm test`, it has major drawbacks:
  1. The obsolete folders were NEVER actually deleted from the disk/repository during M4 work.
  2. Any command that bypasses npm lifecycle hooks (e.g., `npx next build`, `npx next dev`, or direct invocation by containerized tooling) will immediately crash with a Next.js duplicate route error.
  3. Deleting files on the fly during build/dev modifies the local git worktree, showing dirty working directory changes during development.
- **Remediation**:
  Permanently remove `frontend/src/app/login/` and `frontend/src/app/(admin)/admin/login/` from the filesystem/git tree. Once permanently removed, the `predev`/`prebuild`/`pretest` scripts can either be removed or retained purely as idempotent safeguards.

---

## 3. Checklist Verification

### Q1: Do Jest tests match the actual rendered output of `BillingTab.tsx`?
**Verdict**: **NO**.
- As proved in Finding 1, `getByText('Growth')`, `getByText('Starter')`, and `getByText('$249')` will throw runtime errors due to duplicate elements in the table and banner.
- `getByText('$499')` does not match `<div class="plan-price">$499<span>/mo</span></div>`.
- Modal dismissal test clicks an async checkout action without waiting, causing a synchronous assertion failure on an open modal.

### Q2: Is `"test:e2e": "playwright test"` runnable as a single command from `frontend/`?
**Verdict**: **YES**.
- `frontend/package.json` defines `"test:e2e": "playwright test"`.
- `frontend/playwright.config.ts` correctly configures:
  - `testDir: './e2e'`
  - `baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'`
  - `webServer: { command: 'npm run dev', url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 120000 }`
  - `workers: 1`
  - `projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]`
- When `npm run test:e2e` is executed from `frontend/`, Playwright starts the Next.js dev server (triggering `predev`), waits for `http://127.0.0.1:3000` to be ready, and runs all journeys in `./e2e`.

### Q3: Route Collision Safety
**Verdict**: **PARTIAL / NEEDS CLEANUP**.
- The `predev`, `prebuild`, and `pretest` scripts mitigate collisions when invoked through `npm run ...`.
- However, the legacy directories `src/app/login/` and `src/app/(admin)/admin/login/` remain on disk and should be deleted once and for all to eliminate build fragility.

---

## 4. Adversarial Stress-Testing & Attack Surface

| Attack Scenario | Expected Impact | Mitigation Required |
|---|---|---|
| Run `jest frontend/__tests__/restaurant-dashboard.test.tsx` | Test suite fails with `Found multiple elements with text: Growth` and assertion failure on modal dismissal | Update lines 271–306 to use `getAllByText`, regex matching, and synchronous Cancel button for modal test |
| Run `npx next build` directly (bypassing npm script hooks) | Next.js build fails with route collision: `Both /login and /(auth)/login resolve to /login` | Delete `src/app/login/` and `src/app/(admin)/admin/login/` from disk |
| Developer runs `git status` after `npm run dev` | Git reports untracked or deleted file discrepancies | Clean repository state permanently |
| Offline execution of E2E tests | All 4 journeys intercept `**/auth/v1/**` and `**/rest/v1/**` | Robust, passes without live backend |

---

## 5. Conclusion & Actionable Next Steps

Verdict: **REQUEST_CHANGES**

**Required Actions for implementer / worker**:
1. In `frontend/__tests__/restaurant-dashboard.test.tsx`:
   - Change `expect(screen.getByText('Starter')).toBeInTheDocument();` to `expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);`
   - Change `expect(screen.getByText('Growth')).toBeInTheDocument();` to `expect(screen.getAllByText('Growth').length).toBeGreaterThanOrEqual(1);`
   - Change `expect(screen.getByText('$149')).toBeInTheDocument();` to `expect(screen.getAllByText('$149').length).toBeGreaterThanOrEqual(1);`
   - Change `expect(screen.getByText('$249')).toBeInTheDocument();` to `expect(screen.getAllByText('$249').length).toBeGreaterThanOrEqual(1);`
   - Change `expect(screen.getByText('$499')).toBeInTheDocument();` to `expect(screen.getByText(/499/)).toBeInTheDocument();`
   - In `it('opens and confirms plan switch modal')`, test modal closing via the Cancel button:
     ```tsx
     fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
     expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
     ```
2. Permanently delete `frontend/src/app/login/` and `frontend/src/app/(admin)/admin/login/` from disk.
