"""
Order models and capture logic.

The mutating helpers (add_item / remove_item) are pure: they return a new
list rather than editing in place. Call state is snapshotted into Redis
after every turn, so in-place edits would quietly rewrite history.

Money is integer cents throughout, matching orders.total_cents in the
schema. Floats never touch a price.
"""

from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field

from app.models.exception import NotFound, ValidationError


class OrderState(str, Enum):
    CONFIRMED  = "CONFIRMED"     # caller confirmed, not yet pushed to POS
    POS_PUSHED = "POS_PUSHED"    # accepted by Square / Lightspeed
    POS_FAILED = "POS_FAILED"    # push failed after retries → email fallback
    CANCELLED  = "CANCELLED"


class OrderItem(BaseModel):
    """One line of an order. Serialises to the {name, qty, price_cents} jsonb shape."""

    name: str
    qty: int = Field(gt=0, description="Always at least 1; remove the line instead of going to 0")
    price_cents: int = Field(ge=0, description="Unit price. 0 is allowed (comped item)")

    @property
    def subtotal_cents(self) -> int:
        return self.qty * self.price_cents


class Order(BaseModel):
    """Matches the orders table."""

    id: str | None = None
    call_id: str | None = None
    restaurant_id: str
    items: list[OrderItem] = Field(default_factory=list)
    total_cents: int = 0
    state: OrderState = OrderState.CONFIRMED
    pos_order_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ── Capture logic ────────────────────────────────────────────────────────────

def _matches(item: OrderItem, name: str) -> bool:
    """STT casing and spacing drift between utterances; the pizza is the same pizza."""
    return item.name.strip().lower() == name.strip().lower()


def add_item(
    items: list[OrderItem],
    name: str,
    qty: int,
    price_cents: int,
) -> list[OrderItem]:
    """
    Add qty of an item, merging into an existing line if already ordered.

    Returns a new list. Raises pydantic ValidationError on qty <= 0 or
    price_cents < 0 via the OrderItem constraints.
    """
    new_item = OrderItem(name=name, qty=qty, price_cents=price_cents)

    updated: list[OrderItem] = []
    merged = False
    for item in items:
        if not merged and _matches(item, name):
            updated.append(item.model_copy(update={"qty": item.qty + qty}))
            merged = True
        else:
            updated.append(item.model_copy())

    if not merged:
        updated.append(new_item)

    return updated


def remove_item(items: list[OrderItem], name: str, qty: int) -> list[OrderItem]:
    """
    Remove qty of an item. Removing at least as many as present drops the
    whole line — "take the pizzas off" should clear it, never go negative.

    Returns a new list. Raises NotFound if the item was never ordered.
    """
    if qty <= 0:
        raise ValidationError(f"remove qty must be positive, got {qty}")

    if not any(_matches(item, name) for item in items):
        raise NotFound(f"'{name}' is not in the order")

    updated: list[OrderItem] = []
    removed = False
    for item in items:
        if not removed and _matches(item, name):
            removed = True
            if item.qty > qty:
                updated.append(item.model_copy(update={"qty": item.qty - qty}))
            # else: drop the line entirely
        else:
            updated.append(item.model_copy())

    return updated


def calculate_total(items: list[OrderItem]) -> int:
    return sum(item.subtotal_cents for item in items)


# ── Speech helpers ───────────────────────────────────────────────────────────

def format_cents(cents: int) -> str:
    """Render cents as dollars for the TTS layer to speak."""
    return f"${cents / 100:.2f}"


def summarise_order(items: list[OrderItem]) -> str:
    """The read-back spoken to the caller at the CONFIRMING step."""
    if not items:
        return "No items in the order yet."

    lines = [f"{item.qty}x {item.name}" for item in items]
    return f"{', '.join(lines)}. Total {format_cents(calculate_total(items))}."
