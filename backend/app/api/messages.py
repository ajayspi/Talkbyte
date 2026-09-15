"""
Internal messaging endpoints — Sprint 2 / Milestone M2.

Exposes internal APIs for multi-channel notification dispatch
(Meta WhatsApp Business Cloud API with automatic Telnyx SMS fallback).
"""

from __future__ import annotations

from typing import Optional
import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.messaging import (
    send_payment_message,
    SendMessageResponse,
)

log = structlog.get_logger()
router = APIRouter()


class SendMessageRequest(BaseModel):
    """Payload for internal message dispatch."""
    to_number: str = Field(
        ...,
        min_length=1,
        description="Customer phone number (e.g. '+61412345678' or '0412345678')",
    )
    payment_url: str = Field(
        ...,
        min_length=1,
        description="Stripe Checkout URL to send to the customer",
    )
    restaurant_name: str = Field(
        default="Our Restaurant",
        description="Display name of the restaurant",
    )
    from_number: Optional[str] = Field(
        default=None,
        description="Optional sender number for SMS fallback path",
    )
    order_id: Optional[str] = Field(
        default=None,
        description="Optional order ID for tracking / telemetry",
    )


@router.post("/send", response_model=SendMessageResponse, status_code=status.HTTP_200_OK)
@router.post("", response_model=SendMessageResponse, status_code=status.HTTP_200_OK, include_in_schema=False)
async def send_message_endpoint(req: SendMessageRequest) -> SendMessageResponse:
    """
    Send an order payment link to a customer.

    - Routes Australian mobile numbers (+614xxxxxxxx or 04xxxxxxxx) to WhatsApp first.
    - If WhatsApp delivery fails for ANY reason (not registered, API error, exception),
      automatically falls back to plain SMS via Telnyx.
    - Non-AU numbers bypass WhatsApp and deliver directly via Telnyx SMS.
    """
    log.info(
        "messages.api_send_requested",
        to=req.to_number,
        restaurant_name=req.restaurant_name,
        order_id=req.order_id,
    )

    result = await send_payment_message(
        to_number=req.to_number,
        payment_url=req.payment_url,
        restaurant_name=req.restaurant_name,
        from_number=req.from_number,
    )
    return result


@router.get("/health", status_code=status.HTTP_200_OK)
async def messages_health():
    """Health check endpoint for internal messaging subsystem."""
    return {"status": "ok", "service": "messages"}
