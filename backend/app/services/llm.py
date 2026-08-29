"""
GPT-4.1 integration with call context injection.
Sprint 1: hardcoded menu. Sprint 2: replace with RAG (rag.py).
"""

from app.models.call import CallSession

# Hardcoded test menu for Sprint 1 only — replaced by pgvector RAG in Sprint 2
SPRINT1_TEST_MENU = """
MENU:
- Margherita Pizza — $18.00 — Classic tomato, mozzarella, basil
- BBQ Chicken Pizza — $22.00 — BBQ sauce, chicken, red onion
- Garlic Bread — $7.00 — Toasted sourdough with garlic butter
- Tiramisu — $10.00 — Classic Italian dessert
- Soft Drink (can) — $4.00 — Coke, Sprite, Fanta
"""


def build_system_prompt(session: CallSession, restaurant_name: str = "Test Restaurant") -> str:
    """
    Builds the LLM system prompt for the current call turn.
    Three-layer structure: static cached | restaurant context | call state.
    """

    # Layer 1 — static (cache this at session start for token savings)
    static = f"""You are an AI phone ordering assistant for {restaurant_name}.
You speak naturally and clearly. You take orders one item at a time.
Always confirm the complete order before finalising.
If you cannot understand the customer after 2 attempts, offer to transfer to a human.
Never make up items — only take orders from the menu provided.
Do not discuss pricing or discounts not listed on the menu."""

    # Layer 2 — restaurant context (swap SPRINT1_TEST_MENU for RAG results in Sprint 2)
    context = SPRINT1_TEST_MENU

    # Layer 3 — dynamic call state
    items_str = ", ".join(
        f"{item['name']} x{item['qty']}" for item in session.order_items
    ) if session.order_items else "none yet"

    state_block = f"""
CURRENT STATE: {session.state.value}
ITEMS IN ORDER SO FAR: {items_str}
MISHEAR COUNT: {session.mishear_count}/3 (transfer to human at 3)
"""

    return f"{static}\n\n{context}\n{state_block}"
