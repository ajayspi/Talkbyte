"""Billing API — Stripe Checkout Session creation & subscription webhook handler.

Endpoints:
  POST /api/billing/create-checkout-session
  POST /api/billing/webhook
"""

from __future__ import annotations

import structlog
import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.db.supabase import get_db, get_platform_secret

log = structlog.get_logger()
router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class CreateCheckoutRequest(BaseModel):
    restaurant_id: str
    plan_id: str  # 'starter' | 'growth' | 'pro' | 'enterprise'
    success_url: str | None = None
    cancel_url: str | None = None


# ── Plan → Stripe Price mapping ───────────────────────────────────────────────
# In production these would be fetched from Supabase `plans` table or stored as
# Stripe Price IDs in platform_secrets. Here we use env-level price IDs with
# clear fallbacks so the feature works end-to-end even before the secrets are set.

PLAN_PRICE_IDS: dict[str, str] = {
    "starter":    "price_starter_placeholder",
    "growth":     "price_growth_placeholder",
    "pro":        "price_growth_placeholder",
    "enterprise": "price_enterprise_placeholder",
}


async def _get_stripe_price_id(plan_id: str) -> str:
    """Fetch the Stripe Price ID from platform_secrets, falling back to hardcoded map."""
    plan_key = plan_id.lower().strip()
    secret_name = f"STRIPE_PRICE_{plan_key.upper()}"
    price_id = await get_platform_secret(secret_name)
    if not price_id and plan_key == "growth":
        price_id = await get_platform_secret("STRIPE_PRICE_PRO")
    elif not price_id and plan_key == "pro":
        price_id = await get_platform_secret("STRIPE_PRICE_GROWTH")
    if price_id:
        return price_id
    return PLAN_PRICE_IDS.get(plan_key, PLAN_PRICE_IDS["starter"])


# ── POST /api/billing/create-checkout-session ─────────────────────────────────

@router.post("/create-checkout-session")
async def create_checkout_session(body: CreateCheckoutRequest):
    """
    Create a Stripe Checkout Session for a restaurant upgrading their subscription.

    Returns { checkout_url: str } — the frontend should redirect the user there.
    """
    stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")

    if not stripe.api_key:
        log.error("billing.create_checkout.no_stripe_key")
        raise HTTPException(status_code=500, detail="Stripe not configured")

    plan_normalized = body.plan_id.lower().strip()
    price_id = await _get_stripe_price_id(plan_normalized)

    success_url = body.success_url or "https://app.talkbyte.com/restaurant/billing?checkout=success"
    cancel_url = body.cancel_url or "https://app.talkbyte.com/restaurant/billing?checkout=cancelled"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            # Pass restaurant_id so webhook can match the session back to a restaurant
            client_reference_id=body.restaurant_id,
            metadata={
                "restaurant_id": body.restaurant_id,
                "plan_id": plan_normalized,
            },
            subscription_data={
                "metadata": {
                    "restaurant_id": body.restaurant_id,
                    "plan_id": plan_normalized,
                }
            },
        )

        log.info(
            "billing.checkout_session_created",
            restaurant_id=body.restaurant_id,
            plan_id=plan_normalized,
            session_id=session.id,
        )
        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.StripeError as e:
        log.error("billing.create_checkout.stripe_error", error=str(e))
        raise HTTPException(status_code=502, detail=f"Stripe error: {e.user_message}")
    except Exception as e:
        log.error("billing.create_checkout.error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


# ── POST /api/billing/webhook ─────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_subscription_webhook(request: Request):
    """
    Handle Stripe subscription lifecycle events and keep Supabase in sync.

    Handled events:
      • customer.subscription.created  — set plan_id on restaurant
      • customer.subscription.updated  — update plan_id on restaurant
      • customer.subscription.deleted  — downgrade plan_id on restaurant
    """
    stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
    webhook_secret = (
        await get_platform_secret("STRIPE_BILLING_WEBHOOK_SECRET")
        or await get_platform_secret("STRIPE_WEBHOOK_SECRET")
    )

    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature", "")

    # Verify webhook signature when secret is configured
    if webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except (stripe.SignatureVerificationError, ValueError) as e:
            log.error("billing.webhook.signature_failed", error=str(e))
            raise HTTPException(status_code=400, detail="Webhook signature verification failed")
    else:
        # Allow unsigned events in local development / CI
        import json
        try:
            event = json.loads(payload)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")
        log.warning("billing.webhook.no_secret_configured — skipping signature verification")

    event_type: str = event.get("type", "")
    log.info("billing.webhook.received", event_type=event_type)

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        subscription = event["data"]["object"]
        await _handle_subscription_change(subscription, event_type)
    elif event_type == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await _handle_subscription_deleted(subscription)

    return {"received": True}


async def _handle_subscription_change(subscription: dict, event_type: str) -> None:
    """
    Update `restaurants.plan_id` in Supabase when a Stripe subscription changes.

    The Checkout Session puts restaurant_id in `client_reference_id` on the session;
    Stripe copies subscription_data metadata to the subscription's `metadata` field.
    """
    metadata: dict = subscription.get("metadata") or {}
    restaurant_id: str | None = metadata.get("restaurant_id")
    plan_id: str | None = metadata.get("plan_id")
    stripe_subscription_id: str = subscription.get("id", "")
    status: str = subscription.get("status", "active")

    items = subscription.get("items", {}).get("data", [])
    if items and not plan_id:
        # Derive plan_id from the Price metadata or nickname if not in subscription metadata
        price = items[0].get("price", {})
        plan_id = price.get("metadata", {}).get("plan_id") or price.get("nickname")

    if plan_id:
        plan_id = plan_id.lower().strip()
        # Map alias 'pro' to 'growth' to respect database FK constraint
        if plan_id == "pro":
            plan_id = "growth"

    db = get_db()

    # Fallback: if restaurant_id is missing in metadata, look it up from subscriptions table
    if not restaurant_id and stripe_subscription_id:
        try:
            res = await db.table("subscriptions").select("restaurant_id").eq(
                "stripe_subscription_id", stripe_subscription_id
            ).maybe_single().execute()
            if res and res.data:
                restaurant_id = res.data.get("restaurant_id")
        except Exception:
            pass

    if not restaurant_id:
        log.warning("billing.webhook.no_restaurant_id", subscription_id=stripe_subscription_id)
        return

    # Upsert subscription record
    try:
        period_end = None
        current_period_end = subscription.get("current_period_end")
        if current_period_end:
            from datetime import datetime, timezone
            period_end = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()

        await db.table("subscriptions").upsert(
            {
                "restaurant_id": restaurant_id,
                "plan_id": plan_id or "starter",
                "stripe_subscription_id": stripe_subscription_id,
                "status": status,
                "current_period_end": period_end,
            },
            on_conflict="stripe_subscription_id",
        ).execute()

        # Update restaurants.plan_id
        if plan_id:
            await db.table("restaurants").update({"plan_id": plan_id}).eq(
                "id", restaurant_id
            ).execute()

        # Write a billing_event row for history (isolated try/except since billing_events may not exist in schema)
        try:
            await db.table("billing_events").insert(
                {
                    "restaurant_id": restaurant_id,
                    "event_type": event_type,
                    "plan_id": plan_id or "starter",
                    "stripe_subscription_id": stripe_subscription_id,
                    "status": "active" if status == "active" else status,
                    "amount_cents": _extract_amount_cents(subscription),
                }
            ).execute()
        except Exception as be_err:
            log.debug("billing.webhook.billing_events_insert_skipped", error=str(be_err))

        log.info(
            "billing.webhook.processed",
            restaurant_id=restaurant_id,
            plan_id=plan_id,
            event_type=event_type,
            status=status,
        )

    except Exception as e:
        log.error(
            "billing.webhook.db_error",
            error=str(e),
            restaurant_id=restaurant_id,
        )
        # Don't re-raise — return 200 so Stripe doesn't retry for DB errors


async def _handle_subscription_deleted(subscription: dict) -> None:
    """When a subscription is cancelled/deleted, downgrade restaurant to starter."""
    metadata: dict = subscription.get("metadata") or {}
    restaurant_id: str | None = metadata.get("restaurant_id")
    stripe_subscription_id: str = subscription.get("id", "")

    db = get_db()
    if not restaurant_id and stripe_subscription_id:
        try:
            res = await db.table("subscriptions").select("restaurant_id").eq(
                "stripe_subscription_id", stripe_subscription_id
            ).maybe_single().execute()
            if res and res.data:
                restaurant_id = res.data.get("restaurant_id")
        except Exception:
            pass

    if not restaurant_id:
        return

    try:
        await db.table("subscriptions").update({"status": "cancelled"}).eq(
            "stripe_subscription_id", stripe_subscription_id
        ).execute()
        await db.table("restaurants").update({"plan_id": "starter"}).eq(
            "id", restaurant_id
        ).execute()
        log.info("billing.webhook.subscription_cancelled", restaurant_id=restaurant_id)
    except Exception as e:
        log.error("billing.webhook.cancel_db_error", error=str(e), restaurant_id=restaurant_id)


def _extract_amount_cents(subscription: dict) -> int | None:
    """Try to read the subscription amount from plan/price metadata."""
    try:
        items = subscription.get("items", {}).get("data", [])
        if items:
            price = items[0].get("price", {})
            unit_amount = price.get("unit_amount")
            if unit_amount is not None:
                return int(unit_amount)
    except Exception:
        pass
    return None

