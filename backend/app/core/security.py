from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog
from app.db.supabase import get_db

security = HTTPBearer()
log = structlog.get_logger()


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Validate the token using the Supabase client auth.get_user().
    This avoids needing the JWT secret and manually decoding it.
    """
    token = credentials.credentials
    db = get_db()

    try:
        # Supabase auth.get_user automatically verifies the JWT against
        # its backend and returns the user object if valid
        user_response = await db.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = user_response.user

        # Check if the user is in admin_users table
        admin_check = await db.table("admin_users").select("*").eq("id", user.id).maybe_single().execute()
        if not admin_check.data:
            log.warning("admin.auth.forbidden", user_id=user.id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        log.error("admin.auth.failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
