from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import get_db


security = HTTPBearer()


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Retrieves the current user from the Supabase auth token.
    Raises 401 if invalid.
    """
    token = credentials.credentials
    db = get_db()
    try:
        user_response = await db.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401,
                                detail="Invalid authentication credentials")
        return user_response.user
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication error: {
                str(e)}")


async def verify_restaurant_access(
    restaurant_id: str,
    user=Depends(get_current_user)
) -> dict:
    """
    Verifies that the authenticated user has access to the given restaurant_id.
    """
    db = get_db()
    result = await db.table("restaurant_users").select("*").eq("restaurant_id", restaurant_id).eq("user_id", user.id).maybe_single().execute()

    if not result.data:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You do not have access to this restaurant")

    return result.data
