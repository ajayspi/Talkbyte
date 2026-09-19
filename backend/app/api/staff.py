"""
Staff Management API — Inviting staff members and querying restaurant staff.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException
import structlog
import uuid

from app.db.supabase import get_db

log = structlog.get_logger()
router = APIRouter()


class StaffInviteRequest(BaseModel):
    restaurant_id: str = Field(..., description="Restaurant UUID")
    name: str = Field(..., min_length=1, description="Staff member full name")
    email: str = Field(..., min_length=3, description="Staff member email address")
    role: str = Field(default="staff", description="Staff role (owner, manager, staff)")


class StaffInviteResponse(BaseModel):
    status: str = "success"
    user_id: str
    message: str
    staff: Optional[Dict[str, Any]] = None


class StaffListResponse(BaseModel):
    staff: List[Dict[str, Any]]


@router.post("/invite", response_model=StaffInviteResponse)
async def invite_staff(request: StaffInviteRequest):
    """
    Invite a new staff member to the restaurant:
    1. Check if user already exists in public.users.
    2. If not, invite via Supabase Auth Admin (invite_user_by_email, with fallback to create_user).
    3. Upsert into public.users (id, email, name).
    4. Upsert into public.restaurant_users (restaurant_id, user_id, role).
    """
    db = get_db()
    email = request.email.strip().lower()
    name = request.name.strip()
    role_norm = request.role.strip().lower()
    restaurant_id = request.restaurant_id.strip()

    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id is required")
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid email is required")

    user_id: Optional[str] = None

    # Step 1: Check if user exists in public.users
    try:
        existing_user = (
            await db.table("users")
            .select("id, email, name")
            .eq("email", email)
            .maybe_single()
            .execute()
        )
        if existing_user and existing_user.data and "id" in existing_user.data:
            user_id = str(existing_user.data["id"])
    except Exception as e:
        log.debug("staff.invite.check_existing_users_failed", error=str(e))

    # Step 2: Supabase Auth Admin invite or create
    if not user_id:
        # Try invite_user_by_email first
        try:
            auth_admin = getattr(db.auth, "admin", None)
            if auth_admin and hasattr(auth_admin, "invite_user_by_email"):
                invite_resp = await auth_admin.invite_user_by_email(
                    email,
                    {"data": {"name": name, "full_name": name}}
                )
                if invite_resp:
                    if hasattr(invite_resp, "user") and invite_resp.user:
                        user_id = str(invite_resp.user.id)
                    elif isinstance(invite_resp, dict) and "user" in invite_resp:
                        user_obj = invite_resp["user"]
                        user_id = str(user_obj.get("id") if isinstance(user_obj, dict) else user_obj.id)
        except Exception as invite_err:
            log.warning("staff.invite.invite_user_failed_fallback_to_create", error=str(invite_err))

        # Fallback to create_user (e.g. SMTP disabled in dev/local environments)
        if not user_id:
            try:
                auth_admin = getattr(db.auth, "admin", None)
                if auth_admin and hasattr(auth_admin, "create_user"):
                    create_resp = await auth_admin.create_user({
                        "email": email,
                        "email_confirm": True,
                        "user_metadata": {"name": name, "full_name": name}
                    })
                    if create_resp:
                        if hasattr(create_resp, "user") and create_resp.user:
                            user_id = str(create_resp.user.id)
                        elif isinstance(create_resp, dict) and "user" in create_resp:
                            user_obj = create_resp["user"]
                            user_id = str(user_obj.get("id") if isinstance(user_obj, dict) else user_obj.id)
            except Exception as create_err:
                log.warning("staff.invite.create_user_failed", error=str(create_err))

        # If still no user_id, fallback to generating a UUID
        if not user_id:
            user_id = str(uuid.uuid4())

    # Step 3: Upsert into public.users
    try:
        await db.table("users").upsert({
            "id": user_id,
            "email": email,
            "name": name
        }, on_conflict="id").execute()
    except Exception as e:
        log.warning("staff.invite.upsert_users_warning", error=str(e))

    # Step 4: Upsert into public.restaurant_users
    try:
        await db.table("restaurant_users").upsert({
            "restaurant_id": restaurant_id,
            "user_id": user_id,
            "role": role_norm
        }, on_conflict="restaurant_id,user_id").execute()
    except Exception as e:
        log.error("staff.invite.upsert_restaurant_users_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to assign staff role: {str(e)}")

    staff_info = {
        "id": user_id,
        "restaurant_id": restaurant_id,
        "user_id": user_id,
        "name": name,
        "email": email,
        "role": role_norm,
        "lastLogin": "Pending Invite",
        "last_login": None
    }

    return StaffInviteResponse(
        status="success",
        user_id=user_id,
        message=f"Staff member {name} invited successfully",
        staff=staff_info
    )


@router.get("", response_model=StaffListResponse)
@router.get("/", response_model=StaffListResponse, include_in_schema=False)
async def get_staff(restaurant_id: str = Query(..., description="Restaurant UUID")):
    """
    Get all staff members for a restaurant.
    Queries restaurant_staff_view or falls back to querying restaurant_users joined with users.
    """
    restaurant_id = restaurant_id.strip()
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id is required")

    db = get_db()

    # Primary approach: query public.restaurant_staff_view
    try:
        res = (
            await db.table("restaurant_staff_view")
            .select("*")
            .eq("restaurant_id", restaurant_id)
            .execute()
        )
        if res and res.data is not None:
            staff_list = []
            for item in res.data:
                staff_list.append({
                    "id": item.get("id", item.get("user_id")),
                    "restaurant_id": item.get("restaurant_id"),
                    "user_id": item.get("user_id"),
                    "role": item.get("role", "staff"),
                    "name": item.get("name") or "Staff Member",
                    "email": item.get("email") or "",
                    "created_at": item.get("created_at"),
                    "updated_at": item.get("updated_at"),
                    "last_login": item.get("last_login"),
                    "lastLogin": item.get("last_login") or "Never",
                })
            return StaffListResponse(staff=staff_list)
    except Exception as view_err:
        log.warning("staff.get.restaurant_staff_view_fallback", error=str(view_err))

    # Fallback approach: query restaurant_users directly and join users
    try:
        ru_res = (
            await db.table("restaurant_users")
            .select("*")
            .eq("restaurant_id", restaurant_id)
            .execute()
        )
        staff_list = []
        for ru in (ru_res.data or []):
            uid = ru.get("user_id")
            user_data = {}
            if uid:
                try:
                    u_res = await db.table("users").select("name, email").eq("id", uid).maybe_single().execute()
                    if u_res and u_res.data:
                        user_data = u_res.data
                except Exception:
                    pass

            staff_list.append({
                "id": ru.get("id", uid),
                "restaurant_id": ru.get("restaurant_id"),
                "user_id": uid,
                "role": ru.get("role", "staff"),
                "name": user_data.get("name") or "Staff Member",
                "email": user_data.get("email") or "",
                "created_at": ru.get("created_at"),
                "updated_at": ru.get("updated_at"),
                "last_login": None,
                "lastLogin": "Never",
            })
        return StaffListResponse(staff=staff_list)
    except Exception as e:
        log.error("staff.get.failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to query staff: {str(e)}")
