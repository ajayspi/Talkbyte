"""
Supabase client — Postgres 16 + pgvector + Auth.
"""

from supabase import AsyncClient, acreate_client
from config import config

_supabase: AsyncClient | None = None


async def init_supabase() -> None:
    global _supabase
    _supabase = await acreate_client(
        config.supabase_url,
        config.supabase_service_role_key,
    )


def get_db() -> AsyncClient:
    if _supabase is None:
        raise RuntimeError("Supabase not initialised — call init_supabase() at startup")
    return _supabase
