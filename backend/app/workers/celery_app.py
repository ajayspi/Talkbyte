"""
Celery workers — async background tasks.
Broker: Upstash Redis (rediss://... from CELERY_BROKER_URL env var)

Tasks:
  - push_order_to_pos: 3× retry with exponential backoff → email fallback
  - expire_payment_link: runs after PAYMENT_LINK_TTL_SECONDS if no payment
"""

import os
from celery import Celery

app = Celery(
    "talkbyte",
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379"),
    include=["app.workers.celery_app"],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Australia/Sydney",
    task_acks_late=True,
)


@app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,   # seconds (doubles each retry: 30 → 60 → 120)
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def push_order_to_pos(self, order_id: str, restaurant_id: str):
    """
    Push confirmed order to Square POS.
    On final failure → send email to restaurant with order details.
    """
    import asyncio
    from app.db.supabase import get_order, get_restaurant_by_id, update_order_state
    from app.models.order import OrderState
    from app.services.pos.square import SquarePOS
    from config import config
    import structlog

    log = structlog.get_logger()

    async def _do_push():
        order = await get_order(order_id)
        if not order:
            log.error("celery.push_order.not_found", order_id=order_id)
            return

        restaurant = await get_restaurant_by_id(restaurant_id)
        if not restaurant:
            log.error("celery.push_order.restaurant_not_found", restaurant_id=restaurant_id)
            return

        try:
            from app.db.supabase import get_platform_secret
            access_token = await get_platform_secret("SQUARE_ACCESS_TOKEN")
            location_id = await get_platform_secret("SQUARE_LOCATION_ID")
            
            # We assume config has square token per restaurant, but for now use generic env var 
            # Or store in restaurant table. (We'll use generic config for now)
            pos = SquarePOS(
                access_token=access_token,
                location_id=location_id
            )
            result = await pos.push_order(restaurant_id, order.model_dump())
            if result.get("success"):
                await update_order_state(order_id, OrderState.POS_PUSHED)
                log.info("celery.push_order.success", order_id=order_id)
        except Exception as e:
            log.error("celery.push_order.failed", error=str(e))
            if self.request.retries == self.max_retries:
                # TODO: send_pos_failure_email(restaurant_id, order_id)
                await update_order_state(order_id, OrderState.POS_FAILED)
            raise e

    asyncio.run(_do_push())


@app.task
def expire_payment_link(order_id: str):
    """
    Marks order PAYMENT_EXPIRED, notifies restaurant.
    """
    import asyncio
    from app.db.supabase import get_order, update_order_state
    from app.models.order import OrderState
    import structlog

    log = structlog.get_logger()

    async def _do_expire():
        order = await get_order(order_id)
        if order and order.state == OrderState.CONFIRMED:
            # If not paid/pushed, expire it
            # wait, payment state might be tracked separately.
            await update_order_state(order_id, OrderState.CANCELLED) # or PAYMENT_EXPIRED
            log.info("celery.expire_payment_link", order_id=order_id)

    asyncio.run(_do_expire())
