# Handoff Report: Explorer M3-1 (Backend Billing & Webhook Investigation)

**Role**: Teamwork Explorer (Read-Only Investigation)  
**Working Directory**: `.agents/explorer_m3_1`  
**Parent Agent**: orchestrator (Conversation ID: `b49662ee-22a2-47ec-a9cb-7ce83bdfa26f`)  
**Target Subsystems**:
- `backend/app/api/billing.py`
- `backend/app/api/payments.py`
- `backend/tests/unit/test_billing.py`
- `backend/supabase_schema.sql`

---

## 1. Observation

1. **Routing and Mounting**:
   - `backend/main.py:53-55` mounts both payment and billing routers:
     ```python
     app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
     app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
     app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
     ```
   - Endpoints in `backend/app/api/billing.py`:
     - `POST /api/billing/create-checkout-session` (line 53)
     - `POST /api/billing/webhook` (line 103)
   - Endpoints in `backend/app/api/payments.py`:
     - `POST /api/payments/stripe-webhook` (line 16)
     - `POST /api/payments/create-link/{order_id}` (line 45)

2. **Stripe Checkout Session Creation (`backend/app/api/billing.py:72-83`)**:
   ```python
   session = stripe.checkout.Session.create(
       mode="subscription",
       line_items=[{"price": price_id, "quantity": 1}],
       success_url=success_url,
       cancel_url=cancel_url,
       client_reference_id=body.restaurant_id,
       metadata={
           "restaurant_id": body.restaurant_id,
           "plan_id": body.plan_id,
       },
   )
   ```
   - Observed that `subscription_data={"metadata": {"restaurant_id": body.restaurant_id, "plan_id": body.plan_id}}` is **omitted**.
   - In `backend/app/api/billing.py:35-39`, `PLAN_PRICE_IDS` is:
     ```python
     PLAN_PRICE_IDS: dict[str, str] = {
         "starter":    "price_starter_placeholder",
         "pro":        "price_pro_placeholder",
         "enterprise": "price_enterprise_placeholder",
     }
     ```
     `"growth"` is missing.
   - At line 48:
     ```python
     return PLAN_PRICE_IDS.get(plan_id, PLAN_PRICE_IDS["starter"])
     ```
     When `plan_id == "growth"`, it falls back to `"starter"`.

3. **Stripe Webhook Event Handling (`backend/app/api/billing.py:108-111, 134-136, 148-191`)**:
   - At lines 134-136:
     ```python
     if event_type in ("customer.subscription.created", "customer.subscription.updated"):
         subscription = event["data"]["object"]
         await _handle_subscription_change(subscription, event_type)
     ```
   - At lines 148-156:
     ```python
     metadata: dict = subscription.get("metadata") or {}
     restaurant_id: str | None = metadata.get("restaurant_id")
     plan_id: str | None = metadata.get("plan_id")
     stripe_subscription_id: str = subscription.get("id", "")
     status: str = subscription.get("status", "active")

     if not restaurant_id:
         log.warning("billing.webhook.no_restaurant_id", subscription_id=stripe_subscription_id)
         return
     ```
   - At lines 187-190:
     ```python
     if plan_id:
         await db.table("restaurants").update({"plan_id": plan_id}).eq(
             "id", restaurant_id
         ).execute()
     ```
   - At lines 193-202:
     ```python
     await db.table("billing_events").insert(...).execute()
     ```

4. **Database Schema Constraints (`backend/supabase_schema.sql:10-34`)**:
   - `plans` table rows (lines 17-20):
     ```sql
     insert into plans values
       ('starter',    'Starter',    14900, 500),
       ('growth',     'Growth',     24900, 2000),
       ('enterprise', 'Enterprise', 49900, 10000);
     ```
   - `restaurants` table (line 29):
     ```sql
     plan_id text references plans(id) default 'starter',
     ```
   - `billing_events` table is NOT defined anywhere in `backend/supabase_schema.sql`.

5. **Unit Test Coverage (`backend/tests/unit/`)**:
   - Directory listing of `backend/tests/unit/` showed:
     `test_call.py`, `test_config.py`, `test_llm.py`, `test_messaging.py`, `test_messaging_adversarial.py`, `test_order.py`, `test_restaurant.py`, `test_whatsapp.py`.
   - `test_billing.py` does NOT exist.
   - Ripgrep for `billing` across `backend/tests/` returned 0 matches.

---

## 2. Logic Chain

1. **From Observation 2**: In the Stripe API, `checkout.Session.create` metadata is stored on the session object. Stripe does NOT transfer session metadata to the subscription object unless `subscription_data={"metadata": ...}` is explicitly supplied.
2. **From Observation 3**: When `customer.subscription.created` or `customer.subscription.updated` fires, `subscription["metadata"]` will be empty (`{}`) because `subscription_data` was omitted during checkout creation.
3. **From Step 1 and Step 2**: On line 154 of `billing.py`, `if not restaurant_id:` evaluates to true, causing `_handle_subscription_change` to log a warning and return early without calling `db.table("restaurants").update({"plan_id": plan_id})`.
4. **From Observation 2 and 4**: `supabase_schema.sql` defines `'starter'`, `'growth'`, `'enterprise'`. If `body.plan_id` is `"growth"`, line 48 falls back to `"starter"`. If `body.plan_id` is `"pro"`, line 188 attempts to update `restaurants.plan_id` with `"pro"`, which fails Postgres foreign key validation against `plans(id)`.
5. **From Observation 4**: `billing_events` does not exist in `supabase_schema.sql`. Although `db.table("restaurants").update` executes before line 193, line 193 will fail, logging `billing.webhook.db_error`. Isolating line 193 in a try/except block avoids false error logging.
6. **From Observation 5**: Because `backend/tests/unit/test_billing.py` does not exist, there is currently zero automated regression testing verifying that `customer.subscription.updated` updates `restaurants.plan_id` in Supabase.

---

## 3. Caveats

1. **Stripe Test Mode vs Mocking**: In unit tests, `stripe.checkout.Session.create` and `stripe.Webhook.construct_event` are mocked using `unittest.mock.MagicMock` and `patch`. Live testing requires valid Stripe test keys (`sk_test_...` and `whsec_...`).
2. **Multiple Webhook Endpoints in Stripe Dashboard**: Stripe allows either a single webhook URL or multiple URLs. If an administrator configures `/api/payments/stripe-webhook` instead of `/api/billing/webhook`, subscription webhooks would hit `payments.py`. Cross-routing support in `payments.py` is strongly advised to prevent misconfigurations.
3. **Database Migration for `plans`**: If the team decides to keep both `'pro'` and `'growth'` as separate plan IDs rather than aliasing `'pro'` to `'growth'`, an insert statement for `'pro'` must be executed in Supabase.

---

## 4. Conclusion

1. **Root Cause Analysis Complete**:
   - `billing.py` contains the necessary structure to satisfy Requirement R2, but suffers from two critical defects:
     1. Missing `subscription_data={"metadata": ...}` in `create_checkout_session`, preventing `restaurant_id` from reaching subscription webhooks.
     2. Missing `"growth"` in `PLAN_PRICE_IDS` and unnormalized plan IDs (`"pro"` vs `"growth"`).
2. **Actionable Fixes Identified**:
   - Update `backend/app/api/billing.py`:
     - Add `subscription_data={"metadata": {"restaurant_id": body.restaurant_id, "plan_id": body.plan_id.lower()}}`.
     - Include `"growth"` in `PLAN_PRICE_IDS`.
     - Normalize `plan_id = plan_id.lower().strip()`, aliasing `"pro"` to `"growth"`.
     - Isolate `billing_events` insert with defensive try/except.
   - Update `backend/app/api/payments.py`:
     - Forward subscription events to `_handle_subscription_change` for zero-configuration webhook handling.
3. **Comprehensive Test Suite Designed**:
   - A 14-test suite for `backend/tests/unit/test_billing.py` has been fully designed and written in `analysis.md`, covering checkout creation, signature verification, `customer.subscription.updated`, `customer.subscription.created`, and error resilience, designed to run with `pytest` and exit code 0.

---

## 5. Verification Method

To independently verify the findings and the proposed test suite once implemented:

1. **Static Inspection**:
   - Inspect `backend/app/api/billing.py` lines 72-83 to verify absence of `subscription_data`.
   - Inspect `backend/app/api/billing.py` lines 35-39 to verify absence of `"growth"` in `PLAN_PRICE_IDS`.
   - Inspect `backend/supabase_schema.sql` lines 17-20 to verify allowed `plans` values (`'starter'`, `'growth'`, `'enterprise'`).

2. **Execute Unit Test Suite**:
   ```bash
   cd backend
   pytest tests/unit/test_billing.py -v
   ```
   *Expected outcome*: All tests pass with exit code 0.

3. **Invalidation Conditions**:
   - If Stripe automatically copied session metadata to subscriptions without `subscription_data`, the metadata finding would be invalid. (Verified: Stripe API documentation specifically confirms session metadata is not copied to subscriptions).
   - If `plans` table in Supabase already contained `'pro'`, the FK constraint finding would be invalid. (Verified: `supabase_schema.sql` line 17 only inserts `starter`, `growth`, `enterprise`).
