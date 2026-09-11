"""
LiveKit Agents pipeline — Sprint 1, Tasks 6–10
Wires: Deepgram Flux STT → GPT-4.1 → ElevenLabs TTS

Reference: https://docs.livekit.io/agents/quickstart/
"""

import logging
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, elevenlabs, silero
from app.services.llm import build_system_prompt
from app.models.call import CallSession, CallState
from app.db.redis import get_session, save_session
from config import config

logger = logging.getLogger(__name__)

# ElevenLabs voice ID per restaurant (for now, single default voice)
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"


async def entrypoint(ctx: JobContext):
    """Called by LiveKit when a new inbound call room is ready.

    Room name format: {call_id}_{restaurant_id}
    Session must exist in Redis (created by Telnyx webhook handler)
    """
    try:
        logger.info(f"[{ctx.room.name}] Agent entrypoint started")
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

        # Pull call session from Redis (created by Telnyx webhook handler)
        session_data = await get_session(ctx.room.name)
        if not session_data:
            logger.error(f"[{ctx.room.name}] No session found in Redis")
            await ctx.room.send_data(b'{"error": "session_not_found"}')
            return

        session = CallSession.from_redis(session_data)
        logger.info(f"[{ctx.room.name}] Session loaded: {session.call_id}, state={session.state}")

        # Fetch restaurant for dynamic STT language
        restaurant = await get_restaurant_by_id(session.restaurant_id)
        stt_language = "en-US" # Default
        if restaurant and hasattr(restaurant, 'timezone'):
            if "Australia" in restaurant.timezone:
                stt_language = "en-AU"
            elif "Europe" in restaurant.timezone or "London" in restaurant.timezone:
                stt_language = "en-GB"


        # Load VAD (Voice Activity Detection)
        try:
            vad = silero.VAD.load()
        except Exception as e:
            logger.error(f"[{ctx.room.name}] VAD.load() failed: {e}")
            raise

        # Build system prompt with restaurant context (no menu RAG yet in Sprint 1)
        system_prompt = build_system_prompt(session)
        logger.debug(f"[{ctx.room.name}] System prompt:\n{system_prompt}")

        # Define function context for the LLM
        fnc_ctx = llm.FunctionContext()

        @fnc_ctx.ai_callable(description="Add items to the customer's order")
        async def add_to_order(name: str, qty: int, price_cents: int):
            from app.models.order import add_item, OrderItem
            items = [OrderItem(**item) for item in session.order_items]
            try:
                items = add_item(items, name, qty, price_cents)
                session.order_items = [item.model_dump() for item in items]
                await save_session(session.to_redis(), ttl=1800)
                logger.info(f"[{ctx.room.name}] Added to order: {qty}x {name}")
                return "Successfully added to order."
            except Exception as e:
                return f"Failed to add: {e}"

        @fnc_ctx.ai_callable(description="Remove items from the customer's order")
        async def remove_from_order(name: str, qty: int):
            from app.models.order import remove_item, OrderItem
            items = [OrderItem(**item) for item in session.order_items]
            try:
                items = remove_item(items, name, qty)
                session.order_items = [item.model_dump() for item in items]
                await save_session(session.to_redis(), ttl=1800)
                logger.info(f"[{ctx.room.name}] Removed from order: {qty}x {name}")
                return "Successfully removed from order."
            except Exception as e:
                return f"Failed to remove: {e}"

        @fnc_ctx.ai_callable(description="Confirm the complete order and proceed to payment")
        async def confirm_order():
            logger.info(f"[{ctx.room.name}] Order confirmed by AI")
            session.transition(CallState.CONFIRMED)
            await save_session(session.to_redis(), ttl=1800)
            from app.db.supabase import update_call_state, get_restaurant_by_id
            await update_call_state(session.call_id, CallState.CONFIRMED)
            # TODO Sprint 2: Push to POS, send payment SMS
            return "Order confirmed. Proceed to inform the customer about payment via SMS."

        from app.db.supabase import get_platform_secret
        import os
        
        deepgram_key = await get_platform_secret("DEEPGRAM_API_KEY")
        openai_key = await get_platform_secret("OPENAI_API_KEY")
        elevenlabs_key = await get_platform_secret("ELEVENLABS_API_KEY")
        
        # Initialize VoiceAssistant
        assistant = VoiceAssistant(
            vad=vad,
            stt=deepgram.STT(model="nova-3", language=stt_language, api_key=deepgram_key),
            llm=openai.LLM(model="gpt-4o-mini", system_prompt=system_prompt, api_key=openai_key),
            tts=elevenlabs.TTS(voice_id=ELEVENLABS_VOICE_ID, api_key=elevenlabs_key),
            fnc_ctx=fnc_ctx,
        )

        # Event: user speech committed → save to transcript
        @assistant.on("user_speech_committed")
        async def on_user_speech(message: llm.ChatMessage):
            """User message received and committed."""
            logger.info(f"[{ctx.room.name}] User speech: {message.content[:100]}")
            session.transcript.append({"role": "user", "content": message.content})
            await save_session(session.to_redis(), ttl=1800)

        # Event: assistant response → save to transcript and update state if needed
        @assistant.on("agent_speech_committed")
        async def on_agent_speech(message: llm.ChatMessage):
            """Agent message committed."""
            logger.info(f"[{ctx.room.name}] Agent speech: {message.content[:100]}")
            session.transcript.append({"role": "assistant", "content": message.content})
            await save_session(session.to_redis(), ttl=1800)

        # Start the voice assistant
        logger.info(f"[{ctx.room.name}] Starting voice assistant")
        assistant.start(ctx.room)

        # Run until call ends
        await ctx.aclose()
        logger.info(f"[{ctx.room.name}] Call ended, session cleaned up")

    except Exception as e:
        logger.error(f"[{ctx.room.name}] Agent error: {type(e).__name__}: {e}", exc_info=True)
        raise


def _run_with_creds():
    import asyncio
    import os
    from app.db.supabase import get_platform_secret, init_supabase
    
    async def fetch_creds():
        await init_supabase()
        os.environ["LIVEKIT_URL"] = await get_platform_secret("LIVEKIT_URL")
        os.environ["LIVEKIT_API_KEY"] = await get_platform_secret("LIVEKIT_API_KEY")
        os.environ["LIVEKIT_API_SECRET"] = await get_platform_secret("LIVEKIT_API_SECRET")
        
    asyncio.run(fetch_creds())
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )
    _run_with_creds()
