"""
Square POS integration — Sprint 2 primary POS target.
Reference: https://developer.squareup.com/reference/square/orders-api
"""

from app.services.pos.base import POSBase, POSError
import structlog

log = structlog.get_logger()


class SquarePOS(POSBase):

    def __init__(self, access_token: str, location_id: str):
        self.access_token = access_token
        self.location_id = location_id
        # TODO Sprint 2: initialise Square SDK client
        # from square.client import Client
        # self.client = Client(access_token=access_token, environment="production")

    async def push_order(self, restaurant_id: str, order: dict) -> dict:
        """
        TODO Sprint 2:
          1. Map TalkByte order items to Square line items
          2. POST /v2/orders
          3. Return {"pos_order_id": response["order"]["id"], "success": True}
          4. On HTTP error → raise POSError (Celery retries 3× with backoff)
        """
        log.info("square.push_order.stub", restaurant=restaurant_id)
        raise NotImplementedError("Implement in Sprint 2")

    async def check_status(self, pos_order_id: str) -> str:
        # TODO Sprint 2: GET /v2/orders/{order_id}
        raise NotImplementedError("Implement in Sprint 2")
