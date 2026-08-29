"""
Supabase client — Postgres 16 + pgvector + Auth.
"""

import os
from supabase import AsyncClient, acreate_client

_supabase: AsyncClient | None = None


async def init_supabase() -> None:
    global _supabase
    _supabase = await acreate_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def get_db() -> AsyncClient:
    if _supabase is None:
        raise RuntimeError("Supabase not initialised — call init_supabase() at startup")
    return _supabase
