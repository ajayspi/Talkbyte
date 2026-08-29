"""Admin API — Sprint 4"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/stats")
async def platform_stats():
    # TODO: aggregate from Supabase — MRR, calls today, active restaurants
    return {"status": "stub"}


@router.get("/restaurants")
async def list_all_restaurants():
    # TODO: all restaurants with health scores, churn risk, MRR
    return {"restaurants": []}


@router.get("/calls/live")
async def live_calls():
    # TODO: read active call sessions from Upstash Redis
    return {"calls": []}
