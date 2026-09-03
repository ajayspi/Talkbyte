"""Stripe webhook + payment link generation — Sprint 2"""

from fastapi import APIRouter, Request, HTTPException, status
from uuid import UUID
from config import config
from app.api.webhook_security import verify_stripe_signature
from app.api.dependencies import CurrentUser, require_restaurant_member
from app.db.supabase import get_db

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
    payload = await request.body()
    if not verify_stripe_signature(
      payload,
      request.headers.get("stripe-signature", ""),
      config.stripe_webhook_secret,
    ):
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Stripe signature")
    return {"received": True}


@router.post("/create-link/{order_id}")
async def create_payment_link(order_id: UUID, user: CurrentUser):
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
    result = await get_db().table("orders").select("id, restaurant_id, state, total_cents").eq(
      "id", str(order_id)
    ).limit(1).execute()
    if not result.data:
      raise HTTPException(status_code=404, detail="Order not found")
    order = result.data[0]
    await require_restaurant_member(order["restaurant_id"], user)
    if order["state"] != "CONFIRMED":
      raise HTTPException(status_code=409, detail="Only confirmed orders can receive a payment link")
    raise HTTPException(status_code=501, detail="Stripe payment-link provider is not configured")
