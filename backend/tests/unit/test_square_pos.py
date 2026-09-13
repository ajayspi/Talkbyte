import pytest
from unittest.mock import MagicMock, patch
from app.services.pos.square import SquarePOS
from app.services.pos.base import POSError

@pytest.fixture
def mock_square_client():
    with patch('app.services.pos.square.Client') as mock_client_class:
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        yield mock_client_instance

@pytest.fixture
def square_pos(mock_square_client):
    return SquarePOS(access_token="test_token", location_id="test_location")

@pytest.mark.asyncio
async def test_push_order_success(square_pos, mock_square_client):
    order_data = {
        "items": [
            {"name": "Burger", "qty": 2, "price_cents": 1000},
            {"name": "Fries", "qty": 1, "price_cents": 300}
        ]
    }

    mock_result = MagicMock()
    mock_result.is_success.return_value = True
    mock_result.is_error.return_value = False
    mock_result.body = {"order": {"id": "test_order_id"}}
    mock_square_client.orders.create_order.return_value = mock_result

    result = await square_pos.push_order("test_restaurant", order_data)

    assert result == {"pos_order_id": "test_order_id", "success": True}
    mock_square_client.orders.create_order.assert_called_once()

    call_args = mock_square_client.orders.create_order.call_args[0][0]
    assert call_args["order"]["location_id"] == "test_location"
    assert len(call_args["order"]["line_items"]) == 2
    assert call_args["order"]["line_items"][0]["name"] == "Burger"
    assert call_args["order"]["line_items"][0]["quantity"] == "2"
    assert call_args["order"]["line_items"][0]["base_price_money"]["amount"] == 1000

@pytest.mark.asyncio
async def test_push_order_api_error(square_pos, mock_square_client):
    order_data = {"items": [{"name": "Burger", "qty": 1, "price_cents": 1000}]}

    mock_result = MagicMock()
    mock_result.is_success.return_value = False
    mock_result.is_error.return_value = True
    mock_result.errors = [{"detail": "Invalid item"}]
    mock_square_client.orders.create_order.return_value = mock_result

    with pytest.raises(POSError, match="Square API Error"):
        await square_pos.push_order("test_restaurant", order_data)

@pytest.mark.asyncio
async def test_push_order_exception(square_pos, mock_square_client):
    order_data = {"items": [{"name": "Burger", "qty": 1, "price_cents": 1000}]}

    mock_square_client.orders.create_order.side_effect = Exception("Network failure")

    with pytest.raises(POSError, match="Exception: Network failure"):
        await square_pos.push_order("test_restaurant", order_data)

@pytest.mark.asyncio
async def test_push_order_empty_items(square_pos, mock_square_client):
    order_data = {"items": []}

    mock_result = MagicMock()
    mock_result.is_success.return_value = True
    mock_result.body = {"order": {"id": "test_order_id"}}
    mock_square_client.orders.create_order.return_value = mock_result

    result = await square_pos.push_order("test_restaurant", order_data)

    assert result == {"pos_order_id": "test_order_id", "success": True}

    call_args = mock_square_client.orders.create_order.call_args[0][0]
    assert call_args["order"]["line_items"] == []

@pytest.mark.asyncio
async def test_check_status_success(square_pos, mock_square_client):
    mock_result = MagicMock()
    mock_result.is_success.return_value = True
    mock_result.body = {"order": {"state": "COMPLETED"}}
    mock_square_client.orders.retrieve_order.return_value = mock_result

    status = await square_pos.check_status("test_order_id")

    assert status == "COMPLETED"
    mock_square_client.orders.retrieve_order.assert_called_once_with("test_order_id")

@pytest.mark.asyncio
async def test_check_status_api_error(square_pos, mock_square_client):
    mock_result = MagicMock()
    mock_result.is_success.return_value = False
    mock_result.errors = [{"detail": "Order not found"}]
    mock_square_client.orders.retrieve_order.return_value = mock_result

    with pytest.raises(POSError, match="Square API Error"):
        await square_pos.check_status("test_order_id")

@pytest.mark.asyncio
async def test_check_status_exception(square_pos, mock_square_client):
    mock_square_client.orders.retrieve_order.side_effect = Exception("Timeout")

    with pytest.raises(POSError, match="Timeout"):
        await square_pos.check_status("test_order_id")

@pytest.mark.asyncio
async def test_push_order_unknown_error(square_pos, mock_square_client):
    order_data = {"items": []}

    mock_result = MagicMock()
    mock_result.is_success.return_value = False
    mock_result.is_error.return_value = False
    mock_square_client.orders.create_order.return_value = mock_result

    with pytest.raises(POSError, match="Unknown error during Square push"):
        await square_pos.push_order("test_restaurant", order_data)

@pytest.mark.asyncio
async def test_push_order_missing_item_fields(square_pos, mock_square_client):
    # This should raise KeyError due to missing "name", "qty" or "price_cents"
    order_data = {"items": [{"name": "Burger"}]} # Missing qty and price_cents

    with pytest.raises(KeyError):
        await square_pos.push_order("test_restaurant", order_data)
