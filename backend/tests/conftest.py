import pytest
from unittest.mock import Mock, patch
import os

# Set test environment
os.environ['ENVIRONMENT'] = 'test'
os.environ['SUPABASE_URL'] = 'http://localhost:5432'
os.environ['UPSTASH_REDIS_REST_URL'] = 'http://localhost:6379'
os.environ['UPSTASH_REDIS_REST_TOKEN'] = 'test-token'

@pytest.fixture
def mock_supabase():
    """Mock Supabase client get_db() function."""
    with patch('app.db.supabase.get_db') as mock:
        yield mock

@pytest.fixture
def mock_redis():
    """Mock Redis client get_redis() function."""
    with patch('app.db.redis.get_redis') as mock:
        yield mock

@pytest.fixture
def mock_deepgram():
    """Mock Deepgram STT.

    TODO Sprint 1, Task 6:
      Deepgram integration not yet implemented.
      When implementing livekit_agent.py, patch 'livekit.plugins.deepgram.STT'
      or create app/services/stt.py with Deepgram wrapper.
    """
    # Placeholder — update when Task 6 begins
    yield Mock()

@pytest.fixture
def mock_openai():
    """Mock OpenAI LLM.

    TODO Sprint 1, Task 7:
      OpenAI integration not yet implemented.
      When implementing livekit_agent.py, patch 'livekit.plugins.openai.LLM'
      or create app/services/openai.py with OpenAI wrapper.
    """
    # Placeholder — update when Task 7 begins
    yield Mock()
