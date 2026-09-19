"""
Integrations API — Manage third-party integrations (Square, Stripe, Twilio, Shopify).
Stores sensitive credentials securely and masks API keys upon retrieval.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException
import structlog

from app.db.supabase import get_db

log = structlog.get_logger()
router = APIRouter()

SUPPORTED_PROVIDERS = {"square", "stripe", "twilio", "shopify"}


def mask_api_key(key: Optional[str]) -> str:
    """Mask sensitive API keys for secure presentation."""
    if not key:
        return ""
    s = str(key).strip()
    if len(s) <= 8:
        return "********"
    if "-" in s[:8]:
        idx = s.index("-") + 1
        prefix = s[:idx]
        suffix = s[-4:]
        return f"{prefix}****...****{suffix}"
    prefix = s[:4]
    suffix = s[-4:]
    return f"{prefix}****...****{suffix}"


class SaveIntegrationRequest(BaseModel):
    restaurant_id: str = Field(..., description="Restaurant UUID")
    provider: str = Field(..., description="Integration provider ('square', 'stripe', 'twilio', 'shopify')")
    api_key: Optional[str] = Field(default=None, description="Sensitive API key or access token")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Provider metadata")
    config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Provider configuration")
    status: Optional[str] = Field(default="connected", description="Integration status")


class SaveIntegrationResponse(BaseModel):
    status: str = "success"
    provider: str
    connected: bool


class ProviderIntegrationInfo(BaseModel):
    connected: bool
    status: str
    masked_key: str
    metadata: Dict[str, Any]


class IntegrationsResponse(BaseModel):
    integrations: Dict[str, ProviderIntegrationInfo]


@router.post("", response_model=SaveIntegrationResponse)
@router.post("/", response_model=SaveIntegrationResponse, include_in_schema=False)
async def save_integration(request: SaveIntegrationRequest):
    """
    Save or update third-party integration credentials for a restaurant.
    Securely upserts into public.restaurant_integrations.
    """
    restaurant_id = request.restaurant_id.strip()
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id is required")

    provider_norm = request.provider.strip().lower()
    if provider_norm not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider '{request.provider}'. Supported providers: {', '.join(sorted(SUPPORTED_PROVIDERS))}"
        )

    db = get_db()
    record: Dict[str, Any] = {
        "restaurant_id": restaurant_id,
        "provider": provider_norm,
        "status": request.status or "connected",
        "is_active": True,
        "metadata": request.metadata or {},
        "config": request.config or {},
    }

    if request.api_key is not None:
        key_val = request.api_key.strip()
        record["api_key"] = key_val
        record["credentials"] = {"api_key": key_val}

    try:
        await (
            db.table("restaurant_integrations")
            .upsert(record, on_conflict="restaurant_id,provider")
            .execute()
        )
    except Exception as e:
        log.error("integrations.save.failed", error=str(e), provider=provider_norm, restaurant_id=restaurant_id)
        raise HTTPException(status_code=500, detail=f"Failed to save integration: {str(e)}")

    return SaveIntegrationResponse(
        status="success",
        provider=provider_norm,
        connected=True
    )


@router.get("", response_model=IntegrationsResponse)
@router.get("/", response_model=IntegrationsResponse, include_in_schema=False)
async def get_integrations(restaurant_id: str = Query(..., description="Restaurant UUID")):
    """
    Get configured integrations for a restaurant.
    Returns masked API keys so credentials are never leaked to the client.
    """
    restaurant_id = restaurant_id.strip()
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id is required")

    db = get_db()
    try:
        res = (
            await db.table("restaurant_integrations")
            .select("*")
            .eq("restaurant_id", restaurant_id)
            .execute()
        )
        rows = res.data or []
    except Exception as e:
        log.error("integrations.get.failed", error=str(e), restaurant_id=restaurant_id)
        raise HTTPException(status_code=500, detail=f"Failed to fetch integrations: {str(e)}")

    # Initialize all supported providers with default unconfigured state
    integrations_map: Dict[str, ProviderIntegrationInfo] = {}
    for p in ("square", "stripe", "twilio", "shopify"):
        integrations_map[p] = ProviderIntegrationInfo(
            connected=False,
            status="unconfigured",
            masked_key="",
            metadata={}
        )

    for row in rows:
        p = (row.get("provider") or "").strip().lower()
        if not p:
            continue

        raw_key = row.get("api_key")
        if not raw_key and isinstance(row.get("credentials"), dict):
            raw_key = row["credentials"].get("api_key")

        status_val = row.get("status", "active")
        is_active_val = row.get("is_active", True)
        is_connected = bool(is_active_val and status_val in ("active", "connected"))

        integrations_map[p] = ProviderIntegrationInfo(
            connected=is_connected,
            status=status_val if is_connected else "disconnected",
            masked_key=mask_api_key(raw_key),
            metadata=row.get("metadata") or row.get("config") or {}
        )

    return IntegrationsResponse(integrations=integrations_map)


@router.delete("/{provider}")
async def delete_integration(provider: str, restaurant_id: str = Query(..., description="Restaurant UUID")):
    """Delete or disconnect an integration."""
    restaurant_id = restaurant_id.strip()
    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id is required")

    provider_norm = provider.strip().lower()
    db = get_db()
    try:
        await (
            db.table("restaurant_integrations")
            .delete()
            .eq("restaurant_id", restaurant_id)
            .eq("provider", provider_norm)
            .execute()
        )
        return {"status": "success", "provider": provider_norm, "connected": False}
    except Exception as e:
        log.error("integrations.delete.failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to delete integration: {str(e)}")
