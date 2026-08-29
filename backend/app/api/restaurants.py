"""Restaurant management endpoints — Sprint 3"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    # TODO: fetch from Supabase
    return {"restaurant_id": restaurant_id, "status": "stub"}


@router.post("/")
async def create_restaurant(body: dict):
    # TODO: onboarding flow — create restaurant, provision Telnyx number
    return {"status": "stub"}


@router.put("/{restaurant_id}/menu")
async def update_menu(restaurant_id: str, body: dict):
    # TODO: upsert menu_items, re-embed with text-embedding-3-small → pgvector
    return {"status": "stub"}
