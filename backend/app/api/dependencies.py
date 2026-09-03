"""Shared API security dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import config
from app.db.supabase import get_db

bearer_scheme = HTTPBearer(auto_error=True)


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> dict:
    """Verify a Supabase access token and return its claims."""
    if not config.supabase_jwt_secret:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication is not configured")
    try:
        claims = jwt.decode(
            credentials.credentials,
            config.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    if not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Access token has no subject")
    return claims


CurrentUser = Annotated[dict, Depends(current_user)]


async def require_restaurant_member(restaurant_id: str, user: dict) -> dict:
    """Return membership claims only when the user belongs to the restaurant."""
    response = await get_db().table("restaurant_users").select("role").eq(
        "restaurant_id", restaurant_id
    ).eq("user_id", user["sub"]).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=403, detail="Restaurant access denied")
    return response.data[0]


async def require_platform_admin(user: dict) -> dict:
    if user["sub"] not in config.platform_admin_ids:
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user