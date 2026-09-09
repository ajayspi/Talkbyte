"""Stripe webhook + payment link generation — Sprint 2"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
import stripe
from config import config
from app.db.supabase import get_order, update_order_state, get_call, get_platform_secret
from app.models.order import OrderState
from app.services.sms import send_payment_sms
import structlog
from app.workers.celery_app import push_order_to_pos

log = structlog.get_logger()
router = APIRouter()


@router.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
    webhook_secret = await get_platform_secret("STRIPE_WEBHOOK_SECRET")
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except Exception as e:
        log.error("stripe.webhook.verification_failed", error=str(e))
        raise HTTPException(
            status_code=400, detail="Webhook verification failed")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_id = session.get("client_reference_id")
        if order_id:
            # Trigger POS push
            log.info("stripe.payment_completed", order_id=order_id)
            order = await get_order(order_id)
            if order:
                push_order_to_pos.delay(order_id, order.restaurant_id)

    return {"received": True}


@router.post("/create-link/{order_id}")
async def create_payment_link(order_id: str):
    stripe.api_key = await get_platform_secret("STRIPE_SECRET_KEY")
    order = await get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    call = await get_call(order.call_id) if order.call_id else None
    customer_number = call.caller_number if call else "+61400000000"

    try:
        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "aud",
                    "product_data": {"name": "TalkByte Restaurant Order"},
                    "unit_amount": order.total_cents,
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url="https://talkbyte.com/success",
            cancel_url="https://talkbyte.com/cancel",
            client_reference_id=order_id,
        )

        telnyx_number = await get_platform_secret("TELNYX_PHONE_NUMBER") or "+61411111111"
        # Send SMS via Telnyx
        await send_payment_sms(
            to_number=customer_number,
            from_number=telnyx_number,
            payment_url=session.url,
            restaurant_name="Our Restaurant"
        )

        return {"payment_url": session.url, "order_id": order_id}
    except Exception as e:
        log.error("stripe.create_link.failed", error=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to create payment link")
