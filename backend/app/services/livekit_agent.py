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

        # Load VAD (Voice Activity Detection)
        try:
            vad = silero.VAD.load()
        except Exception as e:
            logger.error(f"[{ctx.room.name}] VAD.load() failed: {e}")
            raise

        # Build system prompt with restaurant context (no menu RAG yet in Sprint 1)
        system_prompt = build_system_prompt(session)
        logger.debug(f"[{ctx.room.name}] System prompt:\n{system_prompt}")

        # Initialize VoiceAssistant
        assistant = VoiceAssistant(
            vad=vad,
            stt=deepgram.STT(model="nova-3", language="en-AU"),
            llm=openai.LLM(model="gpt-4.1", system_prompt=system_prompt),
            tts=elevenlabs.TTS(voice_id=ELEVENLABS_VOICE_ID),
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

            # Check if LLM returned function calls (order items, etc.)
            if hasattr(message, "function_calls") and message.function_calls:
                for call in message.function_calls:
                    logger.info(f"[{ctx.room.name}] Function call: {call}")
                    # Handle function calls (order capture, state transitions)
                    # TODO Sprint 2: parse and handle order_item, confirm_order, etc.

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


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
