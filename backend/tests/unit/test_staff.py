import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from main import app

client = TestClient(app)



@pytest.fixture
def mock_db():
    with patch("app.api.staff.get_db") as mock_get_db:
        mock = MagicMock()
        mock_get_db.return_value = mock
        yield mock


def test_invite_staff_success_with_auth_admin(mock_db):
    """Test inviting a new staff member via Supabase Auth Admin."""
    # 1. Existing user check returns None (new user)
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=None)
    )

    # 2. Auth admin invite_user_by_email returns mock user
    mock_auth_user = MagicMock()
    mock_auth_user.id = "user-uuid-123"
    mock_invite_resp = MagicMock()
    mock_invite_resp.user = mock_auth_user
    mock_db.auth.admin.invite_user_by_email = AsyncMock(return_value=mock_invite_resp)

    # 3. Users table upsert
    mock_users_upsert = MagicMock()
    mock_users_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[{"id": "user-uuid-123"}]))

    # 4. Restaurant users table upsert
    mock_ru_upsert = MagicMock()
    mock_ru_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[{"id": "ru-1"}]))

    def table_router(table_name):
        if table_name == "users":
            m = MagicMock()
            m.select = mock_users_select.select
            m.upsert = mock_users_upsert.upsert
            return m
        elif table_name == "restaurant_users":
            return mock_ru_upsert
        return MagicMock()

    mock_db.table.side_effect = table_router

    response = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "rest-uuid-abc",
            "name": "Sarah Connor",
            "email": "sarah@example.com",
            "role": "Manager"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["user_id"] == "user-uuid-123"
    assert "Sarah Connor" in data["message"]
    assert data["staff"]["role"] == "manager"
    assert data["staff"]["email"] == "sarah@example.com"


def test_invite_staff_fallback_to_create_user(mock_db):
    """Test fallback to create_user when invite_user_by_email fails (e.g. SMTP unconfigured)."""
    # 1. Existing user check returns None
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=None)
    )

    # 2. Auth admin invite_user_by_email raises exception (SMTP failure)
    mock_db.auth.admin.invite_user_by_email = AsyncMock(side_effect=Exception("SMTP service unavailable"))

    # 3. Fallback create_user succeeds
    mock_created_user = MagicMock()
    mock_created_user.id = "user-uuid-fallback-456"
    mock_create_resp = MagicMock()
    mock_create_resp.user = mock_created_user
    mock_db.auth.admin.create_user = AsyncMock(return_value=mock_create_resp)

    # 4. Upsert mocks
    mock_users_upsert = MagicMock()
    mock_users_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_ru_upsert = MagicMock()
    mock_ru_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))

    def table_router(table_name):
        if table_name == "users":
            m = MagicMock()
            m.select = mock_users_select.select
            m.upsert = mock_users_upsert.upsert
            return m
        elif table_name == "restaurant_users":
            return mock_ru_upsert
        return MagicMock()

    mock_db.table.side_effect = table_router

    response = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "rest-uuid-abc",
            "name": "Kyle Reese",
            "email": "kyle@example.com",
            "role": "Staff"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["user_id"] == "user-uuid-fallback-456"
    assert data["staff"]["role"] == "staff"


def test_invite_staff_existing_user(mock_db):
    """Test inviting a user who already exists in public.users."""
    # Existing user found in public.users
    mock_users_select = MagicMock()
    mock_users_select.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"id": "existing-user-789", "email": "existing@example.com", "name": "John Doe"})
    )

    mock_users_upsert = MagicMock()
    mock_users_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock_ru_upsert = MagicMock()
    mock_ru_upsert.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))

    def table_router(table_name):
        if table_name == "users":
            m = MagicMock()
            m.select = mock_users_select.select
            m.upsert = mock_users_upsert.upsert
            return m
        elif table_name == "restaurant_users":
            return mock_ru_upsert
        return MagicMock()

    mock_db.table.side_effect = table_router

    response = client.post(
        "/api/staff/invite",
        json={
            "restaurant_id": "rest-uuid-abc",
            "name": "John Doe",
            "email": "existing@example.com",
            "role": "Owner"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["user_id"] == "existing-user-789"
    assert data["staff"]["role"] == "owner"


def test_get_staff_success_from_view(mock_db):
    """Test GET /api/staff queries restaurant_staff_view and returns formatted list."""
    mock_view_select = MagicMock()
    mock_view_select.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {
                "id": "ru-1",
                "restaurant_id": "rest-123",
                "user_id": "user-1",
                "role": "owner",
                "name": "Nonna Maria",
                "email": "maria@nonnas.com.au",
                "created_at": "2026-09-01T00:00:00Z",
                "last_login": "2026-09-18T10:00:00Z"
            },
            {
                "id": "ru-2",
                "restaurant_id": "rest-123",
                "user_id": "user-2",
                "role": "manager",
                "name": "Luigi",
                "email": "luigi@nonnas.com.au",
                "created_at": "2026-09-05T00:00:00Z",
                "last_login": None
            }
        ])
    )
    mock_db.table.return_value = mock_view_select

    response = client.get("/api/staff?restaurant_id=rest-123")
    assert response.status_code == 200
    data = response.json()
    assert "staff" in data
    assert len(data["staff"]) == 2
    assert data["staff"][0]["name"] == "Nonna Maria"
    assert data["staff"][0]["role"] == "owner"
    assert data["staff"][1]["name"] == "Luigi"


def test_get_staff_fallback_when_view_fails(mock_db):
    """Test GET /api/staff falls back to restaurant_users when view is absent."""
    mock_ru_query = MagicMock()
    mock_ru_query.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"id": "ru-1", "restaurant_id": "rest-123", "user_id": "usr-1", "role": "staff"}
        ])
    )

    mock_u_query = MagicMock()
    mock_u_query.select.return_value.eq.return_value.maybe_single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"name": "Fallback User", "email": "fallback@example.com"})
    )

    def table_router(table_name):
        if table_name == "restaurant_staff_view":
            raise Exception("View not found")
        elif table_name == "restaurant_users":
            return mock_ru_query
        elif table_name == "users":
            return mock_u_query
        return MagicMock()

    mock_db.table.side_effect = table_router

    response = client.get("/api/staff?restaurant_id=rest-123")
    assert response.status_code == 200
    data = response.json()
    assert len(data["staff"]) == 1
    assert data["staff"][0]["name"] == "Fallback User"
    assert data["staff"][0]["email"] == "fallback@example.com"
