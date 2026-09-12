import re

with open("backend/app/models/restaurant.py", "r") as f:
    code = f.read()

replacement = """    tts_provider: str = "elevenlabs"     # elevenlabs, cartesia
    voice_id: str | None = None          # ID for the chosen TTS provider
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))"""

# Replace the conflict block
code = re.sub(
    r'<<<<<<< HEAD.*?=======\n.*?>>>>>>> origin/claude/talkbyte-project-integration-fad989',
    replacement,
    code,
    flags=re.DOTALL
)

with open("backend/app/models/restaurant.py", "w") as f:
    f.write(code)
