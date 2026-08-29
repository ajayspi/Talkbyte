"""
TalkByte Configuration Management
Load environment variables and provide a global config instance.
"""

import os
from dataclasses import dataclass
from typing import Literal


@dataclass
class Config:
    """Application configuration loaded from environment variables."""

    # Database
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Cache
    redis_url: str

    # API Keys
    telnyx_api_key: str
    telnyx_sip_connection_id: str
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    deepgram_api_key: str
    openai_api_key: str
    elevenlabs_api_key: str

    # App Config
    debug: bool
    log_level: Literal["debug", "info", "warning", "error"]
    environment: Literal["development", "staging", "production"]

    @classmethod
    def from_env(cls) -> "Config":
        """Load config from environment variables."""
        return cls(
            supabase_url=os.getenv("SUPABASE_URL", "http://localhost:54321"),
            supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", ""),
            supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            redis_url=os.getenv("REDIS_URL", "redis://redis:6379"),
            telnyx_api_key=os.getenv("TELNYX_API_KEY", ""),
            telnyx_sip_connection_id=os.getenv("TELNYX_SIP_CONNECTION_ID", ""),
            livekit_url=os.getenv("LIVEKIT_URL", ""),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY", ""),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET", ""),
            deepgram_api_key=os.getenv("DEEPGRAM_API_KEY", ""),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", ""),
            debug=os.getenv("DEBUG", "true").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "debug"),  # type: ignore
            environment=os.getenv("ENVIRONMENT", "development"),  # type: ignore
        )


# Global config instance
config = Config.from_env()
