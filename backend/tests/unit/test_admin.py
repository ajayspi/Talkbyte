import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

from main import app

client = TestClient(app)


@pytest.fixture
def mock_supabase_auth():
    with patch('app.core.security.get_db') as mock_get_db:
        mock_db = AsyncMock()
        mock_get_db.return_value = mock_db
        yield mock_db


def test_admin_stats_unauthorized():
    # No auth header
    response = client.get("/api/admin/stats")
    assert response.status_code == 403  # FastAPI HTTPBearer returns 403


def test_admin_stats_invalid_token(mock_supabase_auth):
    # Setup mock to raise Exception (or return None)
    mock_supabase_auth.auth.get_user.side_effect = Exception("Invalid token")

    response = client.get(
        "/api/admin/stats",
        headers={"Authorization": "Bearer invalid_token"}
    )

    # We should get a 401
    assert response.status_code == 401


@patch('app.api.admin.get_db')
def test_admin_stats_forbidden(mock_get_db, mock_supabase_auth):
    # Setup mock to return a normal user
    mock_user_response = MagicMock()
    mock_user = MagicMock()
    mock_user.id = "user-123"
    mock_user.app_metadata = {}
    mock_user.role = "authenticated"
    mock_user.email = "user@example.com"
    mock_user_response.user = mock_user
    mock_supabase_auth.auth.get_user.return_value = mock_user_response

    response = client.get(
        "/api/admin/stats",
        headers={"Authorization": "Bearer valid_normal_user_token"}
    )

    assert response.status_code == 403


@patch('app.api.admin.get_db')
def test_admin_stats_success(mock_get_db, mock_supabase_auth):
    # Setup mock to return an admin user
    mock_user_response = MagicMock()
    mock_user = MagicMock()
    mock_user.id = "admin-123"
    mock_user.app_metadata = {"is_admin": True}
    mock_user.role = "authenticated"
    mock_user.email = "admin@example.com"
    mock_user_response.user = mock_user
    mock_supabase_auth.auth.get_user.return_value = mock_user_response

    response = client.get(
        "/api/admin/stats",
        headers={"Authorization": "Bearer valid_admin_token"}
    )

    assert response.status_code == 200
    assert response.json()["mrr"] == 5000
