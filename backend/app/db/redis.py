"""
Upstash Redis — call session state cache.
TTL = 30 minutes (CALL_SESSION_TTL_SECONDS).
Keys: call_session:{call_id}
"""

import json
import os
from upstash_redis.asyncio import Redis

_redis: Redis | None = None


async def init_redis() -> None:
    global _redis
    _redis = Redis(
        url=os.environ["UPSTASH_REDIS_REST_URL"],
        token=os.environ["UPSTASH_REDIS_REST_TOKEN"],
    )


def get_redis() -> Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialised — call init_redis() at startup")
    return _redis


async def save_session(session_data: dict, ttl: int = 1800) -> None:
    r = get_redis()
    key = f"call_session:{session_data['call_id']}"
    await r.setex(key, ttl, json.dumps(session_data))


async def get_session(call_id: str) -> dict | None:
    r = get_redis()
    raw = await r.get(f"call_session:{call_id}")
    return json.loads(raw) if raw else None


async def delete_session(call_id: str) -> None:
    r = get_redis()
    await r.delete(f"call_session:{call_id}")
