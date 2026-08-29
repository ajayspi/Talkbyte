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
    """Mock Supabase client."""
    with patch('app.db.supabase.SupabaseClient') as mock:
        yield mock

@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    with patch('app.db.redis.Redis') as mock:
        yield mock

@pytest.fixture
def mock_deepgram():
    """Mock Deepgram STT."""
    with patch('app.services.stt.DeepgramClient') as mock:
        yield mock

@pytest.fixture
def mock_openai():
    """Mock OpenAI LLM."""
    with patch('app.services.llm.OpenAI') as mock:
        yield mock
