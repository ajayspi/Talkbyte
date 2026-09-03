"""Order endpoints — Sprint 1+"""

from fastapi import APIRouter, HTTPException
from app.db.supabase import get_order, get_db

router = APIRouter()


@router.get("/{order_id}")
async def get_order_api(order_id: str):
    order = await get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.model_dump()


@router.get("/restaurant/{restaurant_id}")
async def list_orders(restaurant_id: str, limit: int = 50):
    db = get_db()
    result = await db.table("orders").select("*").eq("restaurant_id", restaurant_id).order("created_at", desc=True).limit(limit).execute()
    return {"orders": result.data, "restaurant_id": restaurant_id}
