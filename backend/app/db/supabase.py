"""
Supabase client — Postgres 16 + pgvector + Auth.
"""

from __future__ import annotations

from supabase import AsyncClient, acreate_client
from config import config

from app.models.call import CallSession, CallState
from app.models.order import Order, OrderItem, OrderState
from app.models.restaurant import MenuItem, Restaurant

_supabase: AsyncClient | None = None


async def init_supabase() -> None:
    global _supabase
    _supabase = await acreate_client(
        config.supabase_url,
        config.supabase_service_role_key,
    )


def get_db() -> AsyncClient:
    if _supabase is None:
        raise RuntimeError(
            "Supabase not initialised — call init_supabase() at startup")
    return _supabase


async def get_platform_secret(secret_name: str) -> str:
    """Fetch API keys dynamically from the database (e.g. platform_secrets table)."""
    import os
    try:
        res = await get_db().table("platform_secrets").select("secret_value").eq("secret_name", secret_name).maybe_single().execute()
        if res.data and "secret_value" in res.data:
            return res.data["secret_value"]
    except Exception:
        pass
    # Fallback to os.environ for local dev if table doesn't exist yet
    return os.environ.get(secret_name.upper(), "")


# ── Restaurants ───────────────────────────────────────────────────────────────

async def get_restaurant_by_telnyx_number(telnyx_number: str) -> Restaurant | None:
    result = await get_db().table("restaurants").select("*").eq("telnyx_number", telnyx_number).maybe_single().execute()
    if result.data is None:
        return None
    return _row_to_restaurant(result.data)


async def get_restaurant_by_id(restaurant_id: str) -> Restaurant | None:
    result = await get_db().table("restaurants").select("*").eq("id", restaurant_id).maybe_single().execute()
    if result.data is None:
        return None
    return _row_to_restaurant(result.data)


def _row_to_restaurant(row: dict) -> Restaurant:
    return Restaurant(
        id=row["id"],
        name=row["name"],
        phone_number=row.get("phone_number"),
        telnyx_number=row.get("telnyx_number"),
        plan_id=row.get("plan") or row.get("plan_id") or "starter",
        active=row.get("active", False),
        ai_instructions=row.get("ai_instructions"),
        timezone=row.get("timezone", "Australia/Sydney"),
        tts_provider=row.get("tts_provider", "elevenlabs"),
        voice_id=row.get("voice_id"),
        created_at=row["created_at"],
    )


# ── Menu ──────────────────────────────────────────────────────────────────────

async def get_menu_items_by_restaurant(restaurant_id: str) -> list[MenuItem]:
    result = (
        await get_db()
        .table("menu_items")
        .select("id,restaurant_id,name,description,price_cents,category,available")
        .eq("restaurant_id", restaurant_id)
        .execute()
    )
    return [_row_to_menu_item(r) for r in (result.data or [])]


async def search_menu_by_embedding(
    restaurant_id: str,
    embedding: list[float],
    top_k: int = 5,
) -> list[MenuItem]:
    """pgvector cosine similarity search via a Postgres RPC function."""
    result = await get_db().rpc(
        "search_menu",
        {
            "query_embedding": embedding,
            "p_restaurant_id": restaurant_id,
            "match_count": top_k,
        },
    ).execute()
    return [_row_to_menu_item(r) for r in (result.data or [])]


def _row_to_menu_item(row: dict) -> MenuItem:
    return MenuItem(
        id=row.get("id"),
        restaurant_id=row["restaurant_id"],
        name=row["name"],
        description=row.get("description"),
        # DB column may be either price_cents or price; normalise here.
        price_cents=row.get("price_cents") or int(row.get("price", 0)),
        category=row.get("category"),
        available=row.get("available", True),
    )


# ── Calls ─────────────────────────────────────────────────────────────────────

async def save_call(call: CallSession) -> None:
    await get_db().table("calls").upsert(
        {
            "id": call.call_id,
            "restaurant_id": call.restaurant_id,
            "caller_number": call.caller_number,
            "state": call.state.value,
            "started_at": call.started_at.isoformat(),
            "transcript": call.transcript,
        },
        on_conflict="id",
    ).execute()


async def update_call_state(call_id: str, state: CallState) -> None:
    await get_db().table("calls").update({"state": state.value}).eq("id", call_id).execute()


async def get_call(call_id: str) -> CallSession | None:
    result = await get_db().table("calls").select("*").eq("id", call_id).maybe_single().execute()
    if result.data is None:
        return None
    row = result.data
    return CallSession(
        call_id=row["id"],
        restaurant_id=row["restaurant_id"],
        caller_number=row["caller_number"],
        state=CallState(row["state"]),
        started_at=row["started_at"],
        transcript=row.get("transcript") or [],
    )


# ── Orders ────────────────────────────────────────────────────────────────────

async def save_order(order: Order) -> None:
    row: dict = {
        "restaurant_id": order.restaurant_id,
        "items": [item.model_dump() for item in order.items],
        "total_cents": order.total_cents,
        "state": order.state.value,
        "created_at": order.created_at.isoformat(),
    }
    if order.id:
        row["id"] = order.id
    if order.call_id:
        row["call_id"] = order.call_id
    if order.pos_order_id:
        row["pos_order_id"] = order.pos_order_id

    await get_db().table("orders").upsert(row, on_conflict="id").execute()


async def update_order_state(order_id: str, state: OrderState) -> None:
    await get_db().table("orders").update({"state": state.value}).eq("id", order_id).execute()


async def get_order(order_id: str) -> Order | None:
    result = await get_db().table("orders").select("*").eq("id", order_id).maybe_single().execute()
    if result.data is None:
        return None
    row = result.data
    return Order(
        id=row["id"],
        call_id=row.get("call_id"),
        restaurant_id=row["restaurant_id"],
        items=[OrderItem(**item) for item in (row.get("items") or [])],
        total_cents=row.get("total_cents", 0),
        state=OrderState(row["state"]),
        pos_order_id=row.get("pos_order_id"),
        created_at=row["created_at"],
    )


# ── Payment events ────────────────────────────────────────────────────────────

async def save_payment_event(event: dict) -> None:
    await get_db().table("payment_events").insert(event).execute()


async def update_payment_event(order_id: str, updates: dict) -> None:
    await get_db().table("payment_events").update(updates).eq("order_id", order_id).execute()
