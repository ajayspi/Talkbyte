"""
GPT-4.1 system prompt assembly with call context injection.

Three layers, in the order the model sees them:
  1. static persona   — identical every turn, cacheable at session start
  2. restaurant context — menu and per-restaurant instructions
  3. call state       — rewritten each turn

Sprint 1 passes the restaurant's full menu. Sprint 2 passes the pgvector
RAG top-5 for the current utterance instead; only the caller changes, not
this module.
"""

from app.models.call import CallSession
from app.models.restaurant import MenuItem, Restaurant, format_menu_for_prompt

# Fallback menu for running the pipeline before any database exists.
# Superseded the moment real menu_items are passed in.
SPRINT1_TEST_MENU = """MENU:
- Margherita Pizza — $18.00 — Classic tomato, mozzarella, basil
- BBQ Chicken Pizza — $22.00 — BBQ sauce, chicken, red onion
- Garlic Bread — $7.00 — Toasted sourdough with garlic butter
- Tiramisu — $10.00 — Classic Italian dessert
- Soft Drink (can) — $4.00 — Coke, Sprite, Fanta"""


def build_system_prompt(
    session: CallSession,
    restaurant: Restaurant | None = None,
    menu_items: list[MenuItem] | None = None,
) -> str:
    """
    Build the system prompt for the current turn.

    restaurant and menu_items are optional so the voice pipeline can be
    exercised without a database; when omitted, a generic name and the
    fallback menu are used.
    """
    restaurant_name = restaurant.name if restaurant else "Test Restaurant"

    # Layer 1 — static persona. Cache this at session start.
    static = f"""You are an AI phone ordering assistant for {restaurant_name}.
You speak naturally and clearly. You take orders one item at a time.
Always confirm the complete order before finalising.
If you cannot understand the customer after 2 attempts, offer to transfer to a human.
Never make up items — only take orders from the menu provided.
Do not discuss pricing or discounts not listed on the menu."""

    # Layer 2 — restaurant context.
    menu = format_menu_for_prompt(menu_items) if menu_items is not None else SPRINT1_TEST_MENU

    context = menu
    if restaurant and restaurant.ai_instructions:
        context += f"\n\nSpecial instructions: {restaurant.ai_instructions}"

    # Layer 3 — dynamic call state, rewritten every turn.
    items_str = (
        ", ".join(f"{item['name']} x{item['qty']}" for item in session.order_items)
        if session.order_items
        else "none yet"
    )

    state_block = f"""
CURRENT STATE: {session.state.value}
ITEMS IN ORDER SO FAR: {items_str}
MISHEAR COUNT: {session.mishear_count}/3 (transfer to human at 3)
"""

    return f"{static}\n\n{context}\n{state_block}"
