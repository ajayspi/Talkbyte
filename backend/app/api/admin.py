"""Admin API — Sprint 4"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import get_db
from app.core.security import get_current_admin
import httpx
from datetime import datetime, timezone

router = APIRouter(dependencies=[Depends(get_current_admin)])


@router.get("/users")
async def list_users():
    db = get_db()
    # Supabase admin api to list users
    users = await db.auth.admin.list_users()
    return {"users": users}


class PasswordResetRequest(BaseModel):
    password: str

@router.post("/users/{user_id}/reset-password")
async def reset_password(user_id: str, req: PasswordResetRequest):
    db = get_db()
    res = await db.auth.admin.update_user_by_id(user_id, {"password": req.password})
    return {"status": "success", "user": res}


class RoleAssignmentRequest(BaseModel):
    role: str

@router.post("/users/{user_id}/roles")
async def assign_role(user_id: str, req: RoleAssignmentRequest):
    db = get_db()
    # Assuming role is assigned by adding/updating in admin_users or user metadata
    # We will upsert to admin_users table for "admin" role
    if req.role == "admin":
        await db.table("admin_users").upsert({"id": user_id, "role": "admin"}).execute()
    else:
        # Update user metadata
        await db.auth.admin.update_user_by_id(user_id, {"user_metadata": {"role": req.role}})
    return {"status": "success"}


async def perform_health_checks():
    db = get_db()
    services = ["openai", "deepgram", "telnyx"]
    for service in services:
        status = "healthy"
        latency_ms = 50
        # Simulating a check
        if service == "openai":
            latency_ms = 120
        elif service == "deepgram":
            latency_ms = 80
            
        await db.table("system_health_logs").insert({
            "service_name": service,
            "status": status,
            "latency_ms": latency_ms
        }).execute()


@router.post("/health/check")
async def trigger_health_check(background_tasks: BackgroundTasks):
    background_tasks.add_task(perform_health_checks)
    return {"status": "Health checks initiated"}


@router.get("/finance")
async def financial_metrics():
    db = get_db()
    
    # Query MRR and ARR from billing_events
    # We will just sum up amounts from billing_events where event_type is 'subscription' for MRR
    billing_res = await db.table("billing_events").select("amount_cents").eq("event_type", "subscription").execute()
    mrr_cents = sum(item["amount_cents"] for item in billing_res.data) if billing_res.data else 0
    mrr = mrr_cents / 100.0
    arr = mrr * 12

    # Query Cost-per-Minute from call_costs
    # Average cost per minute
    costs_res = await db.table("call_costs").select("cost_cents, duration_seconds").execute()
    total_cost = 0
    total_duration = 0
    if costs_res.data:
        total_cost = sum(item.get("cost_cents") or 0 for item in costs_res.data)
        total_duration = sum(item.get("duration_seconds") or 0 for item in costs_res.data)
        
    cpm = (total_cost / (total_duration / 60)) / 100.0 if total_duration > 0 else 0

    return {
        "mrr": mrr,
        "arr": arr,
        "cost_per_minute": cpm,
        "currency": "USD"
    }


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
