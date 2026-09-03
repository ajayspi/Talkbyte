"""Admin API — Sprint 4"""

from fastapi import APIRouter
from app.db.supabase import get_db

router = APIRouter()

@router.get("/stats")
async def platform_stats():
    db = get_db()
    # Mocking MRR, calls today for this sprint
    return {"mrr": 5000, "calls_today": 120, "active_restaurants": 15}

@router.get("/restaurants")
async def list_all_restaurants():
    db = get_db()
    result = await db.table("restaurants").select("*").execute()
    return {"restaurants": result.data}

@router.get("/calls/live")
async def live_calls():
    # Read active call sessions from Upstash Redis if possible
    # For now returning empty list as placeholder for UI
    return {"calls": []}
