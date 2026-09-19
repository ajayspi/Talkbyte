"""
Restaurant and menu models.

format_menu_for_prompt() is what replaces llm.py's hardcoded
SPRINT1_TEST_MENU once a restaurant's real menu is loaded. In Sprint 2 the
item list it receives comes from the pgvector RAG search instead of the
full menu, but the rendering stays the same.

The `embedding` column is deliberately absent from MenuItem: 1536 floats
have no business in an API response or an LLM prompt.
"""

from datetime import datetime, timezone

from pydantic import BaseModel, Field


class Restaurant(BaseModel):
    """Matches the restaurants table. Defaults mirror supabase_schema.sql."""

    id: str | None = None
    name: str
    phone_number: str | None = None      # the restaurant's real line
    telnyx_number: str | None = None     # the AI-answered number
    plan_id: str = "starter"
    active: bool = False
    ai_instructions: str | None = None   # injected into the system prompt
    timezone: str = "Australia/Sydney"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MenuItem(BaseModel):
    """Matches menu_items, minus the pgvector embedding column."""

    id: str | None = None
    restaurant_id: str
    name: str
    description: str | None = None
    price_cents: int = Field(ge=0)
    category: str | None = None
    available: bool = True


# ── Prompt rendering ─────────────────────────────────────────────────────────

def format_menu_for_prompt(items: list[MenuItem]) -> str:
    """
    Render available items as the MENU block of the system prompt, grouped by
    category in first-seen order.

    An empty result says so explicitly rather than returning a blank block —
    a bare "MENU:" heading invites the model to invent items.
    """
    available = [item for item in items if item.available]
    if not available:
        return "MENU:\n(There are currently no items available to order.)"

    by_category: dict[str, list[MenuItem]] = {}
    for item in available:
        by_category.setdefault(item.category or "Other", []).append(item)

    lines = ["MENU:"]
    for category, group in by_category.items():
        lines.append(f"\n{category}:")
        for item in group:
            price = f"${item.price_cents / 100:.2f}"
            suffix = f" — {item.description}" if item.description else ""
            lines.append(f"- {item.name} — {price}{suffix}")

    return "\n".join(lines)


def find_menu_item(items: list[MenuItem], name: str) -> MenuItem | None:
    """
    Look up an item the caller named. Unavailable items never match — a hit
    there would put an 86'd dish on the order at a real price.
    """
    target = name.strip().lower()
    for item in items:
        if item.available and item.name.strip().lower() == target:
            return item
    return None
