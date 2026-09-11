import re

with open("backend/app/services/livekit_agent.py", "r") as f:
    code = f.read()

# Make it explicit that we are using LiteLLM Proxy in the code comments and configuration
replacement = """
        # Initialize VoiceAssistant
        # Using LiteLLM Proxy (http://litellm:4000) for cross-provider LLM failover (OpenAI -> Anthropic)
        # and unified spend tracking across tenants.
        litellm_base_url = os.getenv("LITELLM_BASE_URL", "http://litellm:4000/v1")
        assistant = VoiceAssistant(
            vad=vad,
            stt=deepgram.STT(model="nova-3", language=stt_language, api_key=deepgram_key),
            llm=openai.LLM(model="gpt-4o-mini", system_prompt=system_prompt, api_key=openai_key, base_url=litellm_base_url),
            tts=tts_plugin,
            fnc_ctx=fnc_ctx,
        )
"""

code = re.sub(r'        # Initialize VoiceAssistant.*?fnc_ctx=fnc_ctx,\n        \)', replacement, code, flags=re.DOTALL)

with open("backend/app/services/livekit_agent.py", "w") as f:
    f.write(code)
