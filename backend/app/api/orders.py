"""Order endpoints — Sprint 1+"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/{order_id}")
async def get_order(order_id: str):
    # TODO: fetch from Supabase
    return {"order_id": order_id, "status": "stub"}


@router.get("/restaurant/{restaurant_id}")
async def list_orders(restaurant_id: str, limit: int = 50):
    # TODO: fetch from Supabase, paginate
    return {"orders": [], "restaurant_id": restaurant_id}
