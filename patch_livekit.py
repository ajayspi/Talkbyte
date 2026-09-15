import re

with open("backend/app/services/livekit_agent.py", "r") as f:
    code = f.read()

replacement1 = """        # Determine TTS provider dynamically based on restaurant config
        tts_provider_name = getattr(restaurant, "tts_provider", "elevenlabs") if restaurant else "elevenlabs"
        voice_id = getattr(restaurant, "voice_id", None) if restaurant else None

        # Fetch keys
        cartesia_key = await get_platform_secret("CARTESIA_API_KEY")
        elevenlabs_key = await get_platform_secret("ELEVENLABS_API_KEY")
        fallback_provider = os.getenv("TTS_FALLBACK_PROVIDER", "elevenlabs")

        try:
            if tts_provider_name == "cartesia" and cartesia_key:
                cartesia_voice_id = voice_id if voice_id else "a0e99841-438c-4a64-b679-ae501e7d6091"
                tts_plugin = cartesia.TTS(voice=cartesia_voice_id, api_key=cartesia_key)
                logger.info(f"[{ctx.room.name}] Using Cartesia TTS (voice={cartesia_voice_id})")
            else:
                raise ValueError("Cartesia selected but no key available, falling back")
        except Exception as e:
            logger.warning(f"[{ctx.room.name}] Primary TTS failed/unavailable ({e}). Routing to fallback: {fallback_provider}")
            if fallback_provider == "elevenlabs" and elevenlabs_key:
                eleven_voice_id = ELEVENLABS_VOICE_ID # Safe default fallback
                tts_plugin = elevenlabs.TTS(voice_id=eleven_voice_id, api_key=elevenlabs_key)
            else:
                logger.error("No valid TTS fallback available.")
                raise"""

code = re.sub(
    r'<<<<<<< HEAD\n\s*# Determine TTS provider dynamically based on restaurant config.*?=======\n\s*elevenlabs_key = await get_platform_secret\("ELEVENLABS_API_KEY"\)\n>>>>>>> origin/claude/talkbyte-project-integration-fad989',
    replacement1,
    code,
    flags=re.DOTALL
)

replacement2 = """            stt=deepgram.STT(model="nova-3", language=stt_language, api_key=deepgram_key),
            llm=openai.LLM(model="gpt-4o-mini", system_prompt=system_prompt, api_key=openai_key, base_url=litellm_base_url),
            tts=tts_plugin,"""

code = re.sub(
    r'<<<<<<< HEAD\n\s*stt=deepgram\.STT\(model="nova-3", language=stt_language, api_key=deepgram_key\),\n\s*llm=openai\.LLM\(model="gpt-4o-mini", system_prompt=system_prompt, api_key=openai_key, base_url=litellm_base_url\),\n\s*tts=tts_plugin,\n=======\n\s*stt=deepgram\.STT\(model="nova-3", language="en-AU",\n\s*api_key=deepgram_key\),\n\s*llm=openai\.LLM\(model="gpt-4\.1",\n\s*system_prompt=system_prompt, api_key=openai_key\),\n\s*tts=elevenlabs\.TTS\(voice_id=ELEVENLABS_VOICE_ID,\n\s*api_key=elevenlabs_key\),\n>>>>>>> origin/claude/talkbyte-project-integration-fad989',
    replacement2,
    code,
    flags=re.DOTALL
)

with open("backend/app/services/livekit_agent.py", "w") as f:
    f.write(code)
