import pytest

from app.models.restaurant import RestaurantCreate


def test_restaurant_create_allows_valid_fields():
    rest_create = RestaurantCreate(
        name="Secure Burger", phone_number="+15551234567"
    )
    assert rest_create.name == "Secure Burger"
    assert rest_create.phone_number == "+15551234567"
    assert rest_create.timezone == "Australia/Sydney"


def test_restaurant_create_rejects_extra_fields():
    with pytest.raises(ValueError):
        RestaurantCreate(
            name="Hacker Pizza", active=True, plan_id="enterprise"
        )
