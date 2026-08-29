"""Stripe webhook + payment link generation — Sprint 2"""

from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    """
    Handles:
      checkout.session.completed → mark order COMPLETE, notify restaurant
      checkout.session.expired   → mark PAYMENT_EXPIRED, alert restaurant

    TODO Sprint 2:
      1. Verify Stripe-Signature header with STRIPE_WEBHOOK_SECRET
      2. Parse event type
      3. Update payment_events table in Supabase
      4. Trigger POS push via Celery if payment succeeded
    """
    return {"received": True}


@router.post("/create-link/{order_id}")
async def create_payment_link(order_id: str):
    """
    Generates a Stripe Payment Link for the confirmed order.
    Sends link via Telnyx SMS to caller's number.

    TODO Sprint 2:
      1. Fetch order from Supabase
      2. Create Stripe Payment Link (amount = order total)
      3. Save link to payment_events table
      4. Send SMS via Telnyx with link
      5. Schedule Celery task to expire after PAYMENT_LINK_TTL_SECONDS
    """
    return {"status": "stub", "order_id": order_id}
