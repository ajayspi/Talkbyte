import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
import uuid
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from main import app
from app.db.supabase import get_db
from app.api.auth import verify_restaurant_access

client = TestClient(app)

# Override the auth dependency for testing
async def override_verify_restaurant_access():
    return {"id": "fake_user_id"}

@pytest.fixture
def override_auth():
    app.dependency_overrides[verify_restaurant_access] = override_verify_restaurant_access
    yield
    app.dependency_overrides = {}

def test_list_orders_unauthorized():
    """Test that listing orders without auth token fails."""
    # This should fail because we don't have the auth dependency overridden here
    # and we don't provide a token
    restaurant_id = str(uuid.uuid4())
    response = client.get(f"/api/orders/restaurant/{restaurant_id}")
    assert response.status_code == 403 # HTTPBearer returns 403 when no credentials are provided

@patch('app.api.orders.get_db')
def test_list_orders_authorized(mock_get_db, override_auth):
    """Test that listing orders with auth token succeeds."""
    restaurant_id = str(uuid.uuid4())

    mock_db = Mock()
    mock_table = Mock()
    mock_select = Mock()
    mock_eq = Mock()
    mock_order = Mock()
    mock_limit = Mock()

    mock_execute = AsyncMock()
    mock_execute.return_value.data = [{"id": "order1"}]

    mock_limit.execute = mock_execute
    mock_order.limit.return_value = mock_limit
    mock_eq.order.return_value = mock_order
    mock_select.eq.return_value = mock_eq
    mock_table.select.return_value = mock_select
    mock_db.table.return_value = mock_table

    mock_get_db.return_value = mock_db

    response = client.get(f"/api/orders/restaurant/{restaurant_id}")
    assert response.status_code == 200
    assert response.json() == {"orders": [{"id": "order1"}], "restaurant_id": restaurant_id}
