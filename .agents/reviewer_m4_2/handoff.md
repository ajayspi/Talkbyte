# Milestone M4 Review Report: Package Config & Unit Test Sync

**Agent**: `reviewer_m4_2`  
**Roles**: `reviewer`, `critic`  
**Milestone**: M4 (Test Suite Sync & Package Config Review)  
**Parent Agent**: `parent` (`b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`)  
**Date**: 2026-09-14T06:14:00Z  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **`frontend/package.json`**:
   - Lines 7–8, 12, 16:
     ```json
     "predev": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\"",
     "prebuild": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\"",
     "pretest": "node -e \"const fs=require('fs'); ['src/app/login', 'src/app/(admin)/admin/login'].forEach(p => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true }));\"",
     "test:e2e": "playwright test"
     ```
   - Line 39: `"@playwright/test": "^1.50.0"`. In `package-lock.json`, line 9778 specifies `@playwright/test: "^1.51.1"`.
2. **Filesystem State of Route Collisions**:
   - `list_dir` on `frontend/src/app` shows directory `login` is still present containing `page.tsx` (size 2609 bytes).
   - `list_dir` on `frontend/src/app/(admin)/admin` shows directory `login` is still present containing `page.tsx` (size 2729 bytes).
   - Concurrently, `frontend/src/app/(auth)/login/page.tsx` and `frontend/src/app/(auth)/admin/login/page.tsx` exist.
3. **`frontend/src/components/restaurant/BillingTab.tsx` DOM Structure**:
   - Line 287: `<strong>{currentPlanConfig.name}</strong>` renders `<strong>Growth</strong>`.
   - Line 312: `<div className="plan-name">{plan.name}</div>` renders `<div class="plan-name">Growth</div>` and `<div class="plan-name">Starter</div>`.
   - Lines 77–110 (`DEFAULT_BILLING_HISTORY`) & line 458: `<td className="text-xs text-gray-600">{inv.planName}</td>` renders `Growth` 3 times (Sep 2026, Aug 2026, Jul 2026) and `Starter` 1 time (Jun 2026).
   - Line 459: `<td className="font-bold text-gray-900">{inv.amount}</td>` renders `$249` 3 times and `$149` 1 time.
   - Line 314: `<div className="plan-price">{plan.price}<span ...>/mo</span></div>` renders `$499/mo`.
   - Line 181: `handleConfirmUpgrade` is an `async` function calling `await fetch(...)`, closing the modal in `finally { setUpgradeModalOpen(false); }`.
   - Line 514: Cancel button `<button onClick={() => setUpgradeModalOpen(false)}>Cancel</button>` closes the modal synchronously.
4. **`frontend/__tests__/restaurant-dashboard.test.tsx` (lines 263–307)**:
   - Lines 271–276:
     ```tsx
     expect(screen.getByText('Starter')).toBeInTheDocument();
     expect(screen.getByText('Growth')).toBeInTheDocument();
     expect(screen.getByText('Enterprise')).toBeInTheDocument();
     expect(screen.getByText('$149')).toBeInTheDocument();
     expect(screen.getByText('$249')).toBeInTheDocument();
     expect(screen.getByText('$499')).toBeInTheDocument();
     ```
   - Lines 304–305:
     ```tsx
     fireEvent.click(screen.getByRole('button', { name: /Proceed to Stripe Checkout|Confirm/i }));
     expect(screen.queryByText('Confirm Subscription Change')).not.toBeInTheDocument();
     ```
5. **Execution Environment**:
   - Subagent terminal command execution prompted for interactive user permission in the IDE and timed out (`Permission prompt for action 'command' ... timed out waiting for user response`). `worker_m4` did not run `npm test` or `npx playwright test`.

---

## 2. Logic Chain

1. **Failure of Jest Unit Tests (Observation 3 & 4)**:
   - `@testing-library/react`'s `getByText(text)` throws `TestingLibraryElementError: Found multiple elements with the text: <text>` when more than one element matches.
   - Because `BillingTab.tsx` renders `'Growth'` 5 times and `'Starter'` 2 times across plan cards, alerts, and billing history tables, `screen.getByText('Growth')` and `screen.getByText('Starter')` will throw runtime errors in Jest.
   - Similarly, `$249` is rendered in 3 separate rows in the billing history table, causing `screen.getByText('$249')` to throw due to multiple elements.
   - For `$499`, `div.textContent` is `"$499/mo"`. Calling `screen.getByText('$499')` with default exact matching fails because no element's full text content is `"$499"`.
   - When line 304 clicks `/Proceed to Stripe Checkout|Confirm/i`, `handleConfirmUpgrade` pauses at `await fetch(...)`. Because the test function is synchronous, line 305 runs immediately before the promise resolves and before `setUpgradeModalOpen(false)` executes. Therefore, `Confirm Subscription Change` remains in the DOM, causing `expect(...).not.toBeInTheDocument()` to throw.
   - Therefore, the Jest tests in `restaurant-dashboard.test.tsx` DO NOT match the actual rendered output and behavior of `BillingTab.tsx`.

2. **Route Collision Fragility (Observation 1 & 2)**:
   - `worker_m4` attempted to mitigate route collisions between `src/app/login/` and `src/app/(auth)/login/` via npm lifecycle hooks (`predev`, `prebuild`, `pretest`).
   - However, the physical directories were never removed from the workspace or git repository.
   - Any execution that does not invoke `npm run ...` (such as direct `npx next build`, `npx next dev`, or direct container builds) will fail with Next.js duplicate route errors.
   - Permanent deletion from disk is required.

3. **E2E Command Validation (Observation 1)**:
   - `"test:e2e": "playwright test"` is correctly defined in `frontend/package.json`.
   - `frontend/playwright.config.ts` points to `./e2e`, specifies `webServer` targeting `npm run dev`, and configures chromium on port 3000.
   - It is runnable as a single command from `frontend/`.

---

## 3. Caveats

1. **Interactive Shell Commands**: Due to IDE user-permission timeouts on powershell execution, unit and E2E tests could not be executed interactively in this session. The assessment is based on rigorous AST, DOM tree, and React 19 / Testing Library semantics tracing.
2. **Predev Execution**: If `npm run dev` is executed, the `predev` hook will delete `src/app/login` and `src/app/(admin)/admin/login` at runtime; however, relying on this runtime mutation rather than repository cleanup remains an anti-pattern.

---

## 4. Conclusion

**Verdict**: **REQUEST_CHANGES**

The work product cannot be approved in its current state due to failing Jest unit tests and fragile route collision mitigation:
1. **Critical Defect**: In `frontend/__tests__/restaurant-dashboard.test.tsx`, lines 271–276 throw due to multiple matching elements (`Growth`, `Starter`, `$249`) and text mismatch (`$499`), and lines 304–305 fail due to synchronous assertion on an asynchronous modal dismissal.
2. **Major Defect**: Legacy route directories `src/app/login/` and `src/app/(admin)/admin/login/` remain on disk and must be permanently removed.

**Required Actions**:
1. Fix `frontend/__tests__/restaurant-dashboard.test.tsx`:
   - Use `screen.getAllByText('Starter')`, `screen.getAllByText('Growth')`, `screen.getAllByText('$149')`, `screen.getAllByText('$249')` asserting length >= 1.
   - Use regex `screen.getByText(/499/)` or scope within plan cards.
   - In `it('opens and confirms plan switch modal')`, test modal closing via the Cancel button (`fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))`), matching `MenuTab`, `OrdersTab`, and `billing.spec.ts`.
2. Permanently delete `frontend/src/app/login/` and `frontend/src/app/(admin)/admin/login/` from disk.

---

## 5. Verification Method

1. **Verify Unit Test Suite**:
   ```bash
   cd frontend
   npm test -- __tests__/restaurant-dashboard.test.tsx
   ```
   *Pass Condition*: Test suite executes with 0 failed tests.
2. **Verify Route Directory Deletion**:
   Ensure `src/app/login` and `src/app/(admin)/admin/login` no longer exist on disk:
   ```bash
   node -e "if (require('fs').existsSync('frontend/src/app/login')) process.exit(1);"
   ```
3. **Verify E2E Single-Command Execution**:
   ```bash
   cd frontend
   npm run test:e2e
   ```
   *Pass Condition*: Playwright launches `webServer` and runs all 4 journeys.
