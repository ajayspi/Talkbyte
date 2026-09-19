"""Stripe webhook + payment link generation — Sprint 2"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
import stripe

from app.db.supabase import get_order, update_order_state, get_call, get_platform_secret
from app.models.order import OrderState
from app.services.messaging import send_payment_message
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
        if session.get("mode") == "subscription":
            rest_id = session.get("client_reference_id") or (session.get("metadata") or {}).get("restaurant_id")
            plan_id = (session.get("metadata") or {}).get("plan_id")
            if rest_id and plan_id:
                from app.db.supabase import get_db
                db = get_db()
                norm_plan = plan_id.lower().strip()
                if norm_plan == "pro":
                    norm_plan = "growth"
                try:
                    await db.table("restaurants").update({"plan_id": norm_plan}).eq("id", rest_id).execute()
                    log.info("payments.subscription_session_completed", restaurant_id=rest_id, plan_id=norm_plan)
                except Exception as db_e:
                    log.error("payments.webhook.plan_update_failed", error=str(db_e))
        else:
            order_id = session.get("client_reference_id")
            if order_id:
                # Trigger POS push
                log.info("stripe.payment_completed", order_id=order_id)
                order = await get_order(order_id)
                if order:
                    push_order_to_pos.delay(order_id, order.restaurant_id)
    elif event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
        from app.api.billing import _handle_subscription_change
        subscription = event["data"]["object"]
        await _handle_subscription_change(subscription, event["type"])

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
        # Send payment link via WhatsApp (with Telnyx SMS fallback)
        await send_payment_message(
            to_number=customer_number,
            payment_url=session.url,
            restaurant_name="Our Restaurant",
            from_number=telnyx_number,
        )


        return {"payment_url": session.url, "order_id": order_id}
    except Exception as e:
        log.error("stripe.create_link.failed", error=str(e))
        raise HTTPException(
            status_code=500, detail="Failed to create payment link")
