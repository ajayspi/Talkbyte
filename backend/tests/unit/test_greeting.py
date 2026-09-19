import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from main import app

client = TestClient(app)



def test_generate_greeting_openai_success():
    """Test successful OpenAI greeting generation."""
    mock_completion = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "G'day! Welcome to Nonna's Pizzeria. I'm Aria, your automated assistant. Would you like to place an order today?"
    mock_completion.choices = [mock_choice]

    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="sk-valid-key")):
        with patch("app.api.voice.AsyncOpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)
            mock_openai_cls.return_value = mock_client

            response = client.post(
                "/api/voice/generate-greeting",
                json={
                    "restaurant_name": "Nonna's Pizzeria",
                    "persona": "Aria",
                    "style_or_tone": "warm and friendly"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["provider"] == "openai"
            assert "Nonna's Pizzeria" in data["greeting"]
            assert "Aria" in data["greeting"]


def test_generate_greeting_missing_api_key_fallback():
    """Test infallible fallback when OPENAI_API_KEY is not configured."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        response = client.post(
            "/api/voice/generate-greeting",
            json={
                "restaurant_name": "Bondi Burger Shack",
                "persona": "Aria"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["provider"] == "fallback"
        assert "Bondi Burger Shack" in data["greeting"]
        assert "Aria" in data["greeting"]


def test_generate_greeting_openai_exception_fallback():
    """Test that if OpenAI API call raises an exception, the dynamic fallback is returned without crashing."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="sk-error-key")):
        with patch("app.api.voice.AsyncOpenAI") as mock_openai_cls:
            mock_client = MagicMock()
            mock_client.chat.completions.create = AsyncMock(side_effect=Exception("OpenAI connection timeout"))
            mock_openai_cls.return_value = mock_client

            response = client.post(
                "/api/voice/generate-greeting",
                json={
                    "restaurant_name": "Melbourne Souvlaki",
                    "persona": "Liam"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["provider"] == "fallback"
            assert "Melbourne Souvlaki" in data["greeting"]
            assert "Liam" in data["greeting"]


def test_generate_greeting_persona_variations():
    """Test different personas produce persona-specific phrasing in fallback mode."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        # Liam persona
        res_liam = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "Sydney Seafood", "persona": "Liam"}
        )
        assert res_liam.status_code == 200
        assert "Liam" in res_liam.json()["greeting"]

        # Chloe persona
        res_chloe = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "Sydney Seafood", "persona": "Chloe"}
        )
        assert res_chloe.status_code == 200
        assert "Chloe" in res_chloe.json()["greeting"]

        # Default Aria persona
        res_aria = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "Sydney Seafood", "persona": "Aria"}
        )
        assert res_aria.status_code == 200
        assert "Aria" in res_aria.json()["greeting"]


def test_generate_greeting_empty_or_loading_name_fallback():
    """Test fallback when restaurant name is 'Loading...' or empty."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        response = client.post(
            "/api/voice/generate-greeting",
            json={"restaurant_name": "Loading...", "persona": "Aria"}
        )
        assert response.status_code == 200
        assert "our restaurant" in response.json()["greeting"]


def test_generate_greeting_alias_route():
    """Test that /api/voice/greeting alias route functions identically."""
    with patch("app.api.voice.get_platform_secret", new=AsyncMock(return_value="")):
        response = client.post(
            "/api/voice/greeting",
            json={"restaurant_name": "Brisbane Bistro", "persona": "Aria"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "Brisbane Bistro" in response.json()["greeting"]
