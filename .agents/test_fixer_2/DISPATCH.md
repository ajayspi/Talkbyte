# DISPATCH: Test Fixer 2 (Cardinality Query Adjustments)

**Working Directory**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\test_fixer_2`
**Project Root**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989`
**Authoritative Request**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md`
**Reviewer Report**: `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\reviewer_2\handoff.md`

## Assignment: Apply Cardinality Query Fixes
You are assigned to adjust 9 query assertions in `frontend/__tests__/restaurant-dashboard.test.tsx` and `frontend/__tests__/admin-panel.test.tsx` to resolve multiple DOM element match errors.

### Exact Changes Required:

1. **In `frontend/__tests__/restaurant-dashboard.test.tsx`**:
   - At Line 165 (in OrdersTab test):
     Replace:
     ```tsx
     const viewButton = screen.getByRole('button', { name: 'View' });
     ```
     With:
     ```tsx
     const viewButton = screen.getAllByRole('button', { name: 'View' })[0];
     ```

2. **In `frontend/__tests__/admin-panel.test.tsx`**:
   - In LiveMonitorView test (around Lines 97–99):
     Replace:
     ```tsx
     expect(screen.getByText("Mama's Pizzeria")).toBeInTheDocument();
     expect(screen.getByText('Thai Express')).toBeInTheDocument();
     expect(screen.getByText('Burger Palace')).toBeInTheDocument();
     ```
     With:
     ```tsx
     expect(screen.getAllByText("Mama's Pizzeria")[0]).toBeInTheDocument();
     expect(screen.getAllByText('Thai Express')[0]).toBeInTheDocument();
     expect(screen.getAllByText('Burger Palace')[0]).toBeInTheDocument();
     ```
   - Around Line 110:
     Replace:
     ```tsx
     const mamasCard = screen.getByText("Mama's Pizzeria");
     ```
     With:
     ```tsx
     const mamasCard = screen.getAllByText("Mama's Pizzeria")[0];
     ```
   - In BillingView test (around Lines 271–274):
     Replace:
     ```tsx
     expect(screen.getByText("Mama's Pizzeria")).toBeInTheDocument();
     expect(screen.getByText('Thai Express')).toBeInTheDocument();
     expect(screen.getByText('Burger Palace')).toBeInTheDocument();
     expect(screen.getByText('Taco Loco')).toBeInTheDocument();
     ```
     With:
     ```tsx
     expect(screen.getAllByText("Mama's Pizzeria")[0]).toBeInTheDocument();
     expect(screen.getAllByText('Thai Express')[0]).toBeInTheDocument();
     expect(screen.getAllByText('Burger Palace')[0]).toBeInTheDocument();
     expect(screen.getAllByText('Taco Loco')[0]).toBeInTheDocument();
     ```

Write your handoff report to `.agents/test_fixer_2/handoff.md` and notify caller when done.

## 2026-09-03T10:06:22Z
You are test_fixer_2 (Role: Test Cardinality Fixer).
Working Directory: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\test_fixer_2

MANDATORY: Read these files first:
1. ORIGINAL_REQUEST.md: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\ORIGINAL_REQUEST.md
2. DISPATCH.md: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\test_fixer_2\DISPATCH.md
3. Reviewer findings: c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\reviewer_2\handoff.md

Your task:
Apply the 9 specific cardinality query adjustments in `frontend/__tests__/restaurant-dashboard.test.tsx` and `frontend/__tests__/admin-panel.test.tsx` as detailed in DISPATCH.md:
- Change single element queries `getByRole('button', { name: 'View' })` to `getAllByRole('button', { name: 'View' })[0]`.
- Change duplicate text queries for "Mama's Pizzeria", "Thai Express", "Burger Palace", and "Taco Loco" in LiveMonitorView and BillingView tests to `getAllByText(...)[0]`.
Write handoff report to `c:\Users\vigilare\OneDrive - Vigilare BP PVT LTD\Desktop\Claude local\.claude\worktrees\talkbyte-project-integration-fad989\.agents\test_fixer_2\handoff.md` and send completion message to caller.
