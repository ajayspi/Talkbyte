import os


async def get_platform_secret(secret_name: str) -> str:
    """
    Fetch an API key dynamically from the Supabase platform_secrets table.
    Falls back to os.getenv for local dev and testing.
    """
    try:
        from app.db.supabase import get_db
        client = get_db()
        response = await client.table("platform_secrets").select(
            "secret_value").eq("secret_name", secret_name).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]["secret_value"]
    except Exception:
        pass
    # Fallback to local environment variables if not in DB for development
    return os.getenv(secret_name.upper(), "")

