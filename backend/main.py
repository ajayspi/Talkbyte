"""
TalkByte AI — FastAPI entry point
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import config
from app.services.logging import setup_logging
from app.services.error_handler import register_exception_handlers
from app.db.supabase import init_supabase
from app.db.redis import init_redis
from app.api import voice, orders, restaurants, payments, admin

log = setup_logging(config.debug)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    log.info("talkbyte.starting", environment=config.environment)
    await init_supabase()
    await init_redis()
    log.info("talkbyte.ready")
    yield
    log.info("talkbyte.shutdown")


app = FastAPI(
    title="TalkByte AI",
    version="0.1.0",
    description="AI phone ordering backend for Australian restaurants",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

# Routers
app.include_router(voice.router,       prefix="/api/voice",       tags=["voice"])
app.include_router(orders.router,      prefix="/api/orders",      tags=["orders"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["restaurants"])
app.include_router(payments.router,    prefix="/api/payments",    tags=["payments"])
app.include_router(admin.router,       prefix="/api/admin",       tags=["admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "talkbyte-api"}
