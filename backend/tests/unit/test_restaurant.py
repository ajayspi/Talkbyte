"""
Restaurant and menu models, plus the menu-to-prompt renderer that replaces
llm.py's hardcoded SPRINT1_TEST_MENU with real data.
"""

import pytest

from app.models.restaurant import (
    MenuItem,
    Restaurant,
    find_menu_item,
    format_menu_for_prompt,
)


def _item(**overrides) -> MenuItem:
    defaults = dict(
        restaurant_id="rest-1",
        name="Margherita Pizza",
        description="Classic tomato, mozzarella, basil",
        price_cents=1800,
        category="Pizza",
    )
    return MenuItem(**{**defaults, **overrides})


# ── Restaurant ───────────────────────────────────────────────────────────────

def test_restaurant_requires_only_a_name():
    restaurant = Restaurant(name="Nonna's")

    assert restaurant.name == "Nonna's"


def test_restaurant_defaults_match_the_schema():
    """These defaults are duplicated in supabase_schema.sql — keep them in step."""
    restaurant = Restaurant(name="Nonna's")

    assert restaurant.plan_id == "starter"
    assert restaurant.active is False
    assert restaurant.timezone == "Australia/Sydney"


def test_restaurant_carries_ai_instructions_for_the_prompt():
    restaurant = Restaurant(name="Nonna's", ai_instructions="Upsell garlic bread.")

    assert restaurant.ai_instructions == "Upsell garlic bread."


# ── MenuItem ─────────────────────────────────────────────────────────────────

def test_menu_item_defaults_to_available():
    assert _item().available is True


def test_menu_item_rejects_negative_price():
    with pytest.raises(ValueError):
        _item(price_cents=-1)


def test_menu_item_excludes_the_embedding_vector():
    """1536 floats must never ride along in an API response or a prompt."""
    assert "embedding" not in _item().model_dump()


# ── format_menu_for_prompt ───────────────────────────────────────────────────

def test_format_menu_renders_name_price_and_description():
    rendered = format_menu_for_prompt([_item()])

    assert "Margherita Pizza" in rendered
    assert "$18.00" in rendered
    assert "Classic tomato, mozzarella, basil" in rendered


def test_format_menu_omits_unavailable_items():
    """The AI must never take an order for something that is 86'd."""
    items = [_item(), _item(name="Tiramisu", price_cents=1000, available=False)]

    rendered = format_menu_for_prompt(items)

    assert "Margherita Pizza" in rendered
    assert "Tiramisu" not in rendered


def test_format_menu_groups_by_category():
    items = [
        _item(name="Margherita Pizza", category="Pizza"),
        _item(name="Tiramisu", price_cents=1000, category="Dessert"),
    ]

    rendered = format_menu_for_prompt(items)

    assert "Pizza" in rendered
    assert "Dessert" in rendered
    assert rendered.index("Margherita Pizza") < rendered.index("Tiramisu")


def test_format_menu_handles_an_item_with_no_description():
    rendered = format_menu_for_prompt([_item(description=None)])

    assert "Margherita Pizza" in rendered


def test_format_empty_menu_is_explicit_rather_than_blank():
    """A blank menu block would let the LLM invent items."""
    rendered = format_menu_for_prompt([])

    assert "no items" in rendered.lower()


def test_format_menu_with_everything_unavailable_is_also_explicit():
    rendered = format_menu_for_prompt([_item(available=False)])

    assert "no items" in rendered.lower()


# ── find_menu_item ───────────────────────────────────────────────────────────

def test_find_menu_item_matches_case_insensitively():
    found = find_menu_item([_item()], "margherita pizza")

    assert found is not None
    assert found.price_cents == 1800


def test_find_menu_item_returns_none_when_absent():
    assert find_menu_item([_item()], "Pad Thai") is None


def test_find_menu_item_ignores_unavailable_items():
    """Matching an 86'd item would let it onto the order at a real price."""
    assert find_menu_item([_item(available=False)], "Margherita Pizza") is None
