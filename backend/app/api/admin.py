"""Admin API — Sprint 4"""

from fastapi import APIRouter
from app.api.dependencies import CurrentUser, require_platform_admin

router = APIRouter()


@router.get("/stats")
async def platform_stats(user: CurrentUser):
    await require_platform_admin(user)
    # TODO: aggregate from Supabase — MRR, calls today, active restaurants
    return {"status": "stub"}


@router.get("/restaurants")
async def list_all_restaurants(user: CurrentUser):
    await require_platform_admin(user)
    # TODO: all restaurants with health scores, churn risk, MRR
    return {"restaurants": []}


@router.get("/calls/live")
async def live_calls(user: CurrentUser):
    await require_platform_admin(user)
    # TODO: read active call sessions from Upstash Redis
    return {"calls": []}
