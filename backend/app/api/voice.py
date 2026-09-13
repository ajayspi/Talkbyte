"""
Voice webhook — receives Telnyx inbound call events, bridges to LiveKit.
Sprint 1: fully implemented.
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
import structlog
import telnyx
from livekit import api
from app.models.call import CallSession, CallState
from app.db.redis import save_session
from app.db.supabase import save_call, update_call_state, get_platform_secret
from config import config
import uuid
from datetime import datetime, timezone

log = structlog.get_logger()
router = APIRouter()


async def dial_livekit_sip(call_control_id: str, caller_number: str, telnyx_number: str):
    telnyx.api_key = await get_platform_secret("TELNYX_API_KEY")
    """Bridge answered Telnyx call to LiveKit via SIP."""
    room_name = f"call_{call_control_id}"

    # Initialize CallSession in Redis
    session = CallSession(
        call_id=call_control_id,
        restaurant_id=telnyx_number,  # Will resolve to real restaurant_id in agent
        caller_number=caller_number,
        state=CallState.GREETING,
        started_at=datetime.now(timezone.utc)
    )
    await save_session(session.to_redis(), ttl=1800)
    await save_call(session)

    # We use Telnyx Call Control to transfer the answered call to LiveKit SIP URI
    try:
        call = telnyx.Call()
        call.call_control_id = call_control_id
        # We need a SIP domain configured in LiveKit, typically provided in env vars.
        import os
        region = os.getenv("LIVEKIT_REGION", "")
        sip_domain = getattr(config, "livekit_sip_domain", None)
        if not sip_domain:
            if region:
                 sip_domain = f"{region}.sip.livekit.cloud"
            else:
                 sip_domain = "sip.livekit.cloud"

        call.transfer(to=f"sip:{room_name}@{sip_domain}")
    except Exception as e:
        log.error("telnyx.sip_transfer_failed", error=str(e))


@router.post("/webhook")
async def telnyx_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Telnyx sends all call events here.
    """
    telnyx.api_key = await get_platform_secret("TELNYX_API_KEY")
    body = await request.json()
    event_type = body.get("data", {}).get("event_type", "unknown")
    call_control_id = body.get("data", {}).get(
        "payload", {}).get("call_control_id")

    log.info("telnyx.webhook", event_type=event_type, call_id=call_control_id)

    if event_type == "call.initiated":
        # Answer the call
        try:
            call = telnyx.Call()
            call.call_control_id = call_control_id
            call.answer()
        except Exception as e:
            log.error("telnyx.answer_failed", error=str(e))

    elif event_type == "call.answered":
        caller_number = body.get("data", {}).get("payload", {}).get("from")
        telnyx_number = body.get("data", {}).get("payload", {}).get("to")
        # Start SIP bridging in background
        background_tasks.add_task(
            dial_livekit_sip, call_control_id, caller_number, telnyx_number)

    elif event_type == "call.hangup":
        # Call ended
        await update_call_state(call_control_id, CallState.COMPLETE)

    return {"received": True}


@router.post("/livekit-agent-start")
async def livekit_agent_start(request: Request):
    """
    Placeholder for any webhook LiveKit might send if needed, 
    but the main logic runs in livekit_agent.py entrypoint.
    """
    body = await request.json()
    room_name = body.get("room_name")
    log.info("livekit.agent.start", room=room_name)
    return {"status": "agent_started", "room": room_name}
