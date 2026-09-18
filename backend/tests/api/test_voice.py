import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from fastapi import FastAPI
from app.api.voice import router

app = FastAPI()
app.include_router(router)

client = TestClient(app)

def test_livekit_agent_start_missing_auth():
    response = client.post("/livekit-agent-start", json={"room_name": "test_room"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}

@patch("app.api.voice.get_platform_secret", new_callable=AsyncMock)
def test_livekit_agent_start_invalid_auth(mock_get_secret):
    mock_get_secret.side_effect = lambda k: "test_key" if k == "LIVEKIT_API_KEY" else "test_secret"

    response = client.post(
        "/livekit-agent-start",
        json={"room_name": "test_room"},
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}


from livekit.protocol.webhook import WebhookEvent
from livekit.protocol.models import Room

@patch("app.api.voice.get_platform_secret", new_callable=AsyncMock)
@patch("livekit.api.webhook.WebhookReceiver.receive")
def test_livekit_agent_start_valid_auth(mock_receive, mock_get_secret):
    mock_get_secret.side_effect = lambda k: "test_key" if k == "LIVEKIT_API_KEY" else "test_secret"

    event = WebhookEvent(room=Room(name="test_room"), event="room_started")
    mock_receive.return_value = event

    response = client.post(
        "/livekit-agent-start",
        json={"room_name": "test_room"},
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "agent_started", "room": "test_room"}
    mock_receive.assert_called_once()
