"""
LiveKit Agents pipeline — Sprint 1, Tasks 6–10
Wires: Deepgram Flux STT → GPT-4.1 → ElevenLabs TTS

Reference: https://docs.livekit.io/agents/quickstart/
"""

# TODO Sprint 1, Task 5–8:
# from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
# from livekit.agents.voice_assistant import VoiceAssistant
# from livekit.plugins import deepgram, openai, elevenlabs
# from app.services.llm import build_system_prompt
# from app.models.call import CallSession, CallState
# from app.db.redis import get_session, save_session

# async def entrypoint(ctx: JobContext):
#     """Called by LiveKit when a new inbound call room is ready."""
#     await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
#
#     # Pull call session from Redis (created by Telnyx webhook handler)
#     session = await get_session(ctx.room.name)
#
#     assistant = VoiceAssistant(
#         vad=silero.VAD.load(),
#         stt=deepgram.STT(model="nova-3", language="en-AU"),
#         llm=openai.LLM(model="gpt-4.1"),
#         tts=elevenlabs.TTS(voice_id=ELEVENLABS_VOICE_ID),
#         chat_ctx=build_system_prompt(session),
#     )
#     assistant.start(ctx.room)
#
#     @assistant.on("user_speech_committed")
#     def on_user_speech(msg):
#         session.transcript.append({"role": "user", "content": msg.content})
#         await save_session(session)
#
# if __name__ == "__main__":
#     cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))

placeholder = "Remove this when implementing Sprint 1 Task 5"
