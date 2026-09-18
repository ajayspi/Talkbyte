"""Restaurant management endpoints — Sprint 3"""

from fastapi import APIRouter, HTTPException, Depends
from app.api.auth import get_current_user, verify_restaurant_access
from app.db.supabase import get_restaurant_by_id, get_db
import structlog
from app.services.rag import get_embedding

log = structlog.get_logger()
router = APIRouter()


@router.get("/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    rest = await get_restaurant_by_id(restaurant_id)
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return rest.model_dump()


@router.post("/")
async def create_restaurant(body: dict, user=Depends(get_current_user)):
    # TODO: onboarding flow — create restaurant, provision Telnyx number
    # Sprint 3 feature.
    db = get_db()

    # Insert restaurant
    result = await db.table("restaurants").insert(body).execute()
    restaurant = result.data[0]

    # Grant access to the user who created it
    await db.table("restaurant_users").insert({
        "restaurant_id": restaurant["id"],
        "user_id": user.id,
        "role": "owner"
    }).execute()

    return {"status": "created", "restaurant": restaurant}


@router.put("/{restaurant_id}/menu")
async def update_menu(
        restaurant_id: str,
        body: dict,
        access=Depends(verify_restaurant_access)):
    # upsert menu_items, re-embed with text-embedding-3-small → pgvector
    db = get_db()
    items = body.get("items", [])

    for item in items:
        # Generate embedding
        content_to_embed = f"{item['name']} - {item.get('description', '')}"
        try:
            embedding = await get_embedding(content_to_embed)
            item["embedding"] = embedding
        except Exception as e:
            log.error("menu.embedding.failed", error=str(e), item=item["name"])

        item["restaurant_id"] = restaurant_id

        # Upsert
        await db.table("menu_items").upsert(item).execute()

    return {"status": "menu updated", "items_processed": len(items)}
