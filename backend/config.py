"""
TalkByte Configuration Management
Load environment variables and provide a global config instance.
"""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Literal
from dotenv import load_dotenv

# Load .env.local (or .env) into os.environ before Config.from_env() reads it
# Try .env.local first (local overrides), then fall back to .env
_env_local = Path(".env.local")
_env_default = Path(".env")
if _env_local.exists():
    load_dotenv(dotenv_path=_env_local)
elif _env_default.exists():
    load_dotenv(dotenv_path=_env_default)


@dataclass
class Config:
    """Application configuration loaded from environment variables."""

    # Database
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Cache — Upstash Redis (not standard Redis)
    upstash_redis_rest_url: str
    upstash_redis_rest_token: str

    # API Keys — Telephony
    telnyx_api_key: str
    telnyx_public_key: str
    telnyx_sip_connection_id: str

    # API Keys — Voice & Video
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    deepgram_api_key: str
    openai_api_key: str
    elevenlabs_api_key: str

    # Payments
    stripe_secret_key: str
    square_application_id: str
    square_application_secret: str

    # App Config
    frontend_url: str
    environment: Literal["development", "staging", "production"]
    debug: bool
    log_level: Literal["debug", "info", "warning", "error"]

    @classmethod
    def from_env(cls) -> "Config":
        """Load config from environment variables."""
        return cls(
            supabase_url=os.getenv("SUPABASE_URL", "http://localhost:54321"),
            supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", ""),
            supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
            upstash_redis_rest_url=os.getenv("UPSTASH_REDIS_REST_URL", ""),
            upstash_redis_rest_token=os.getenv("UPSTASH_REDIS_REST_TOKEN", ""),
            telnyx_api_key=os.getenv("TELNYX_API_KEY", ""),
            telnyx_public_key=os.getenv("TELNYX_PUBLIC_KEY", ""),
            telnyx_sip_connection_id=os.getenv("TELNYX_SIP_CONNECTION_ID", ""),
            livekit_url=os.getenv("LIVEKIT_URL", ""),
            livekit_api_key=os.getenv("LIVEKIT_API_KEY", ""),
            livekit_api_secret=os.getenv("LIVEKIT_API_SECRET", ""),
            deepgram_api_key=os.getenv("DEEPGRAM_API_KEY", ""),
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", ""),
            stripe_secret_key=os.getenv("STRIPE_SECRET_KEY", ""),
            square_application_id=os.getenv("SQUARE_APPLICATION_ID", ""),
            square_application_secret=os.getenv("SQUARE_APPLICATION_SECRET", ""),
            frontend_url=os.getenv("FRONTEND_URL", "http://localhost:3000"),
            environment=os.getenv("ENVIRONMENT", "development"),  # type: ignore
            debug=os.getenv("DEBUG", "true").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "debug"),  # type: ignore
        )


# Global config instance
config = Config.from_env()
