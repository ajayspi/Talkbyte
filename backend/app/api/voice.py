"""
Voice webhook — receives Telnyx inbound call events, bridges to LiveKit.
Sprint 1: stub handlers only. Implement each TODO in order.
"""

from fastapi import APIRouter, Request, HTTPException
import structlog

log = structlog.get_logger()
router = APIRouter()


@router.post("/webhook")
async def telnyx_webhook(request: Request):
    """
    Telnyx sends all call events here:
      - call.initiated → answer the call
      - call.answered  → bridge to LiveKit SIP
      - call.hangup    → save call record

    TODO Sprint 1, Task 5:
      1. Verify Telnyx-Signature header
      2. Parse event type from body["data"]["event_type"]
      3. On call.initiated → telnyx.calls.answer()
      4. On call.answered  → create LiveKit room, dial SIP participant
      5. On call.hangup    → mark call CALL_DROPPED or COMPLETE in Redis + Supabase
    """
    body = await request.json()
    event_type = body.get("data", {}).get("event_type", "unknown")
    log.info("telnyx.webhook", event_type=event_type)

    # Placeholder — replace with real handlers
    return {"received": True}


@router.post("/livekit-agent-start")
async def livekit_agent_start(request: Request):
    """
    Called by LiveKit Agents framework when a new participant joins the room.
    This is where the voice pipeline begins:
      STT (Deepgram Flux) → LLM (GPT-4.1) → TTS (ElevenLabs) → back to caller

    TODO Sprint 1, Tasks 6–10:
      1. Initialise CallSession in Redis (GREETING state)
      2. Start Deepgram WebSocket STT stream
      3. On each utterance → run through LLM with call context
      4. Stream TTS response back through LiveKit audio track
      5. Update call state machine after each turn
      6. On CONFIRMED → save order to Supabase, trigger Sprint 2 payment
    """
    body = await request.json()
    room_name = body.get("room_name")
    log.info("livekit.agent.start", room=room_name)

    return {"status": "agent_started", "room": room_name}
