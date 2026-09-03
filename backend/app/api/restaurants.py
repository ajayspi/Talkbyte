"""Restaurant management endpoints — Sprint 3"""

from uuid import UUID
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.api.dependencies import CurrentUser, require_restaurant_member
from app.db.supabase import get_db

router = APIRouter()


class RestaurantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone_number: str = Field(min_length=8, max_length=32)
    ai_instructions: str = Field(default="", max_length=4000)


class MenuUpdate(BaseModel):
    class Item(BaseModel):
        name: str = Field(min_length=1, max_length=160)
        description: str = Field(default="", max_length=1000)
        price_cents: int = Field(ge=0, le=1_000_000)
        category: str = Field(default="", max_length=80)
        available: bool = True

    items: list[Item] = Field(default_factory=list, max_length=500)


@router.get("/{restaurant_id}")
async def get_restaurant(restaurant_id: UUID, user: CurrentUser):
    await require_restaurant_member(str(restaurant_id), user)
    result = await get_db().table("restaurants").select("*").eq("id", str(restaurant_id)).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return result.data[0]


@router.post("/")
async def create_restaurant(body: RestaurantCreate, user: CurrentUser):
    restaurant_result = await get_db().table("restaurants").insert(body.model_dump()).execute()
    restaurant = restaurant_result.data[0]
    await get_db().table("restaurant_users").insert({
        "restaurant_id": restaurant["id"], "user_id": user["sub"], "role": "owner"
    }).execute()
    return restaurant


@router.put("/{restaurant_id}/menu")
async def update_menu(restaurant_id: UUID, body: MenuUpdate, user: CurrentUser):
    membership = await require_restaurant_member(str(restaurant_id), user)
    if membership["role"] not in {"owner", "manager"}:
        raise HTTPException(status_code=403, detail="Owner or manager access required")
    rows = [item.model_dump() | {"restaurant_id": str(restaurant_id)} for item in body.items]
    result = await get_db().table("menu_items").upsert(rows).execute() if rows else None
    return {"items": result.data if result else []}
