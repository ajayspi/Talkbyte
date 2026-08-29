"""
Order capture logic — the functions the LLM calls mid-call to build an order.

Money is integer cents everywhere. No floats: 0.1 + 0.2 != 0.3 and a
restaurant order that is one cent off is a support ticket.
"""

import pytest

from app.models.exception import NotFound, ValidationError
from app.models.order import (
    OrderItem,
    add_item,
    calculate_total,
    format_cents,
    remove_item,
    summarise_order,
)


# ── OrderItem validation ─────────────────────────────────────────────────────

def test_order_item_holds_name_qty_and_price():
    item = OrderItem(name="Margherita Pizza", qty=2, price_cents=1800)

    assert item.name == "Margherita Pizza"
    assert item.qty == 2
    assert item.price_cents == 1800


def test_order_item_subtotal_multiplies_qty_by_price():
    item = OrderItem(name="Garlic Bread", qty=3, price_cents=700)

    assert item.subtotal_cents == 2100


def test_order_item_rejects_zero_or_negative_qty():
    with pytest.raises(ValueError):
        OrderItem(name="Tiramisu", qty=0, price_cents=1000)

    with pytest.raises(ValueError):
        OrderItem(name="Tiramisu", qty=-1, price_cents=1000)


def test_order_item_rejects_negative_price():
    with pytest.raises(ValueError):
        OrderItem(name="Tiramisu", qty=1, price_cents=-1)


def test_order_item_allows_free_item():
    """Comped items are legitimate — zero is allowed, negative is not."""
    item = OrderItem(name="Birthday Tiramisu", qty=1, price_cents=0)

    assert item.subtotal_cents == 0


# ── add_item ─────────────────────────────────────────────────────────────────

def test_add_item_appends_to_empty_order():
    items = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)

    assert len(items) == 1
    assert items[0].name == "Margherita Pizza"
    assert items[0].qty == 1


def test_add_item_merges_quantity_for_same_item():
    """Caller says 'a pizza' then later 'actually make it two' — one line, qty 3."""
    items = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)
    items = add_item(items, name="Margherita Pizza", qty=2, price_cents=1800)

    assert len(items) == 1
    assert items[0].qty == 3


def test_add_item_matches_name_case_insensitively():
    """STT casing varies between utterances; it is still the same pizza."""
    items = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)
    items = add_item(items, name="margherita pizza", qty=1, price_cents=1800)

    assert len(items) == 1
    assert items[0].qty == 2


def test_add_item_keeps_distinct_items_separate():
    items = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)
    items = add_item(items, name="Garlic Bread", qty=1, price_cents=700)

    assert len(items) == 2


def test_add_item_does_not_mutate_the_input_list():
    """Call state is snapshotted into Redis; in-place mutation loses history."""
    original = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)

    add_item(original, name="Garlic Bread", qty=1, price_cents=700)

    assert len(original) == 1


# ── remove_item ──────────────────────────────────────────────────────────────

def test_remove_item_decrements_quantity():
    items = add_item([], name="Margherita Pizza", qty=3, price_cents=1800)
    items = remove_item(items, name="Margherita Pizza", qty=1)

    assert items[0].qty == 2


def test_remove_item_drops_line_when_quantity_reaches_zero():
    items = add_item([], name="Margherita Pizza", qty=2, price_cents=1800)
    items = remove_item(items, name="Margherita Pizza", qty=2)

    assert items == []


def test_remove_item_drops_line_when_removing_more_than_present():
    """'Take the pizzas off' should clear the line, not go negative."""
    items = add_item([], name="Margherita Pizza", qty=2, price_cents=1800)
    items = remove_item(items, name="Margherita Pizza", qty=5)

    assert items == []


def test_remove_item_raises_not_found_for_absent_item():
    items = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)

    with pytest.raises(NotFound):
        remove_item(items, name="Pad Thai", qty=1)


def test_remove_item_rejects_non_positive_qty():
    items = add_item([], name="Margherita Pizza", qty=1, price_cents=1800)

    with pytest.raises(ValidationError):
        remove_item(items, name="Margherita Pizza", qty=0)


def test_remove_item_does_not_mutate_the_input_list():
    original = add_item([], name="Margherita Pizza", qty=2, price_cents=1800)

    remove_item(original, name="Margherita Pizza", qty=2)

    assert len(original) == 1


# ── calculate_total ──────────────────────────────────────────────────────────

def test_calculate_total_of_empty_order_is_zero():
    assert calculate_total([]) == 0


def test_calculate_total_sums_subtotals():
    items = add_item([], name="Margherita Pizza", qty=2, price_cents=1800)
    items = add_item(items, name="Garlic Bread", qty=1, price_cents=700)

    assert calculate_total(items) == 4300


# ── format_cents ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "cents,expected",
    [
        (0, "$0.00"),
        (5, "$0.05"),
        (700, "$7.00"),
        (1850, "$18.50"),
        (123456, "$1234.56"),
    ],
)
def test_format_cents_renders_dollars_for_speech(cents, expected):
    assert format_cents(cents) == expected


# ── summarise_order ──────────────────────────────────────────────────────────

def test_summarise_order_reads_back_items_and_total():
    """This string is spoken to the caller at the CONFIRMING step."""
    items = add_item([], name="Margherita Pizza", qty=2, price_cents=1800)
    items = add_item(items, name="Garlic Bread", qty=1, price_cents=700)

    summary = summarise_order(items)

    assert "2x Margherita Pizza" in summary
    assert "1x Garlic Bread" in summary
    assert "$43.00" in summary


def test_summarise_empty_order_is_explicit():
    assert summarise_order([]) == "No items in the order yet."
