"""Order endpoints — Sprint 1+"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query
from uuid import UUID
from app.api.dependencies import CurrentUser, require_restaurant_member
from app.db.supabase import get_db

router = APIRouter()


@router.get("/{order_id}")
async def get_order(order_id: UUID, user: CurrentUser):
    result = await get_db().table("orders").select("*").eq("id", str(order_id)).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = result.data[0]
    await require_restaurant_member(order["restaurant_id"], user)
    return order


@router.get("/restaurant/{restaurant_id}")
async def list_orders(
    restaurant_id: UUID,
    user: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
):
    await require_restaurant_member(str(restaurant_id), user)
    result = await get_db().table("orders").select("*").eq(
        "restaurant_id", str(restaurant_id)
    ).order("created_at", desc=True).limit(limit).execute()
    return {"orders": result.data, "restaurant_id": str(restaurant_id)}
