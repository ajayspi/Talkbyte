import pytest
from config import Config


def test_config_loads_from_env(monkeypatch):
    """Test config loads environment variables."""
    monkeypatch.setenv('ENVIRONMENT', 'test')
    monkeypatch.setenv('DEBUG', 'true')
    monkeypatch.setenv('LOG_LEVEL', 'debug')

    config = Config.from_env()

    assert config.environment == 'test'
    assert config.debug is True
    assert config.log_level == 'debug'


def test_config_defaults():
    """Test config has sensible defaults."""
    # Ensure env vars not set
    import os
    env_backup = os.environ.copy()
    for key in ['ENVIRONMENT', 'DEBUG', 'LOG_LEVEL']:
        os.environ.pop(key, None)

    try:
        config = Config.from_env()
        assert config.environment == 'development'
        assert config.debug is True
    finally:
        os.environ.clear()
        os.environ.update(env_backup)
