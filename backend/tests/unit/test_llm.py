"""
System prompt assembly.

The prompt is three layers: static persona (cacheable), restaurant context,
and per-turn call state. These tests pin the parts that change behaviour
mid-call, and the guardrails that stop the model inventing menu items.
"""

from app.models.call import CallSession, CallState
from app.models.restaurant import MenuItem, Restaurant
from app.services.llm import build_system_prompt


def _session(**overrides) -> CallSession:
    defaults = dict(
        call_id="call-1",
        restaurant_id="rest-1",
        caller_number="+61400000000",
    )
    return CallSession(**{**defaults, **overrides})


def _menu() -> list[MenuItem]:
    return [
        MenuItem(
            restaurant_id="rest-1",
            name="Margherita Pizza",
            description="Classic tomato, mozzarella, basil",
            price_cents=1800,
            category="Pizza",
        ),
        MenuItem(
            restaurant_id="rest-1",
            name="Tiramisu",
            price_cents=1000,
            category="Dessert",
            available=False,
        ),
    ]


# ── Restaurant context ───────────────────────────────────────────────────────

def test_prompt_names_the_restaurant():
    prompt = build_system_prompt(_session(), restaurant=Restaurant(name="Nonna's"))

    assert "Nonna's" in prompt


def test_prompt_includes_real_menu_when_items_are_supplied():
    prompt = build_system_prompt(_session(), menu_items=_menu())

    assert "Margherita Pizza" in prompt
    assert "$18.00" in prompt


def test_prompt_excludes_unavailable_items():
    prompt = build_system_prompt(_session(), menu_items=_menu())

    assert "Tiramisu" not in prompt


def test_prompt_falls_back_to_the_test_menu_when_none_supplied():
    """Sprint 1 runs without a database; the fallback keeps the pipeline testable."""
    prompt = build_system_prompt(_session())

    assert "MENU" in prompt


def test_prompt_includes_restaurant_ai_instructions():
    restaurant = Restaurant(name="Nonna's", ai_instructions="Always offer garlic bread.")

    prompt = build_system_prompt(_session(), restaurant=restaurant)

    assert "Always offer garlic bread." in prompt


def test_prompt_omits_the_instructions_block_when_there_are_none():
    prompt = build_system_prompt(_session(), restaurant=Restaurant(name="Nonna's"))

    assert "Special instructions" not in prompt


# ── Guardrails ───────────────────────────────────────────────────────────────

def test_prompt_forbids_inventing_menu_items():
    """The single most expensive failure mode: an order for a dish that does not exist."""
    prompt = build_system_prompt(_session(), menu_items=_menu())

    assert "never make up items" in prompt.lower()


# ── Per-turn call state ──────────────────────────────────────────────────────

def test_prompt_reports_the_current_state():
    session = _session()
    session.transition(CallState.TAKING_ORDER)

    assert "TAKING_ORDER" in build_system_prompt(session)


def test_prompt_lists_items_captured_so_far():
    session = _session(
        order_items=[{"name": "Margherita Pizza", "qty": 2, "price_cents": 1800}]
    )

    prompt = build_system_prompt(session)

    assert "Margherita Pizza" in prompt
    assert "2" in prompt


def test_prompt_says_none_yet_for_an_empty_order():
    assert "none yet" in build_system_prompt(_session())


def test_prompt_reports_the_mishear_count_for_the_transfer_rule():
    session = _session(mishear_count=2)

    assert "2" in build_system_prompt(session)
