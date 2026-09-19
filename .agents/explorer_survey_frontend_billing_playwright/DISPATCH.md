## 2026-09-13T23:11:35Z

Investigate requirements R2 (SaaS Subscription Billing) and R3 (Playwright E2E Testing Suite):
- R2: Restaurant owners view current plan, upgrade via Stripe Checkout, see billing history. /dashboard/billing route returns HTTP 200. Stripe Webhook handler updates restaurants.plan_id in Supabase when customer.subscription.updated received. Access to premium features gated based on plan_id.
- R3: Automated Playwright E2E test suite in frontend/ covering (1) owner login -> dashboard loads, (2) menu item availability toggle updates, (3) operator admin login -> restaurants list loads. Single command runnable: npx playwright test exits with code 0.
