"""
Square POS integration — Sprint 2 primary POS target.
Reference: https://developer.squareup.com/reference/square/orders-api
"""

from app.services.pos.base import POSBase, POSError
import structlog
import uuid
from square.client import Client

log = structlog.get_logger()


class SquarePOS(POSBase):

    def __init__(
            self,
            access_token: str,
            location_id: str,
            environment: str = "sandbox"):
        self.access_token = access_token
        self.location_id = location_id
        self.client = Client(
            access_token=access_token,
            environment=environment)

    async def push_order(self, restaurant_id: str, order: dict) -> dict:
        """
        Map TalkByte order items to Square line items and push to POS.
        """
        line_items = []
        for item in order.get("items", []):
            line_items.append({
                "name": item["name"],
                "quantity": str(item["qty"]),
                "base_price_money": {
                    "amount": item["price_cents"],
                    "currency": "AUD"
                }
            })

        body = {
            "idempotency_key": str(uuid.uuid4()),
            "order": {
                "location_id": self.location_id,
                "line_items": line_items,
                "state": "OPEN"
            }
        }

        try:
            result = self.client.orders.create_order(body)
            if result.is_success():
                order_id = result.body.get("order", {}).get("id")
                log.info(
                    "square.push_order.success",
                    restaurant=restaurant_id,
                    order_id=order_id)
                return {"pos_order_id": order_id, "success": True}
            elif result.is_error():
                log.error("square.push_order.error", errors=result.errors)
                raise POSError(f"Square API Error: {result.errors}")
        except Exception as e:
            log.error("square.push_order.exception", error=str(e))
            raise POSError(f"Exception: {str(e)}")

        raise POSError("Unknown error during Square push")

    async def check_status(self, pos_order_id: str) -> str:
        try:
            result = self.client.orders.retrieve_order(pos_order_id)
            if result.is_success():
                return result.body.get("order", {}).get("state", "UNKNOWN")
            raise POSError(f"Square API Error: {result.errors}")
        except Exception as e:
            raise POSError(str(e))
