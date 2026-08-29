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
    Sprint 2: push confirmed order to Square POS.
    On final failure → send email to restaurant with order details.

    TODO Sprint 2:
      1. Fetch order from Supabase
      2. Fetch restaurant's Square access_token + location_id
      3. SquarePOS.push_order(...)
      4. On success → update orders.pos_order_id + state = COMPLETE
      5. On final failure → send_pos_failure_email(restaurant_id, order_id)
    """
    raise NotImplementedError("Implement in Sprint 2")


@app.task
def expire_payment_link(order_id: str):
    """
    Sprint 2: called by Stripe webhook or scheduled TTL.
    Marks order PAYMENT_EXPIRED, notifies restaurant.
    """
    raise NotImplementedError("Implement in Sprint 2")
