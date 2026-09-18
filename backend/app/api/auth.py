from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import get_db

security = HTTPBearer()


async def verify_jwt(
        credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase JWT."""
    token = credentials.credentials
    try:
        db = get_db()
        user_resp = await db.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_resp.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_restaurant_id_from_request(request: Request) -> str | None:
    return request.path_params.get("restaurant_id")


async def verify_restaurant_access(
    request: Request,
    user=Depends(verify_jwt)
):
    """Verify that the user has access to the given restaurant_id."""
    restaurant_id = get_restaurant_id_from_request(request)
    if not restaurant_id:
        # If no restaurant_id in path, we can't verify here. Up to endpoint.
        return user

    db = get_db()
    # Check if user has access to this restaurant based on restaurant_users table
    # This matches the RLS policy defined in the DB.
    result = await db.table("restaurant_users").select("*").eq("user_id", user.id).eq("restaurant_id", restaurant_id).execute()
    if not result.data:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user
