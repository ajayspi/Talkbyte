"""
Call session state machine and its Redis round-trip.

Covers two defects found in review:
  1. started_at was evaluated once at import, so every call shared a timestamp.
  2. Redis stores plain dicts, but the LLM layer expects a CallSession —
     nothing bridged the two.
"""

import time

import pytest

from app.models.call import CallSession, CallState


def _session(**overrides) -> CallSession:
    defaults = dict(
        call_id="call-1",
        restaurant_id="rest-1",
        caller_number="+61400000000",
    )
    return CallSession(**{**defaults, **overrides})


# ── started_at defect ────────────────────────────────────────────────────────

def test_started_at_uses_a_factory_not_an_import_time_constant():
    """A plain `= datetime.utcnow()` default freezes at import for every session."""
    field = CallSession.model_fields["started_at"]

    assert field.default_factory is not None, (
        "started_at must use default_factory, or all calls share one timestamp"
    )


def test_two_sessions_get_distinct_start_times():
    first = _session(call_id="call-1")
    time.sleep(0.01)
    second = _session(call_id="call-2")

    assert first.started_at != second.started_at


def test_started_at_is_timezone_aware():
    """Naive UTC timestamps compare wrongly against Postgres timestamptz."""
    assert _session().started_at.tzinfo is not None


# ── State machine ────────────────────────────────────────────────────────────

def test_new_session_starts_in_greeting():
    assert _session().state is CallState.GREETING


def test_happy_path_transitions_through_to_confirmed():
    session = _session()

    session.transition(CallState.TAKING_ORDER)
    session.transition(CallState.CONFIRMING)
    session.transition(CallState.CONFIRMED)

    assert session.state is CallState.CONFIRMED


def test_confirming_can_return_to_taking_order():
    """Caller changes their mind during read-back."""
    session = _session()
    session.transition(CallState.TAKING_ORDER)
    session.transition(CallState.CONFIRMING)

    session.transition(CallState.TAKING_ORDER)

    assert session.state is CallState.TAKING_ORDER


def test_invalid_transition_is_rejected():
    session = _session()

    with pytest.raises(ValueError):
        session.transition(CallState.COMPLETE)


def test_state_is_unchanged_after_a_rejected_transition():
    session = _session()

    with pytest.raises(ValueError):
        session.transition(CallState.COMPLETE)

    assert session.state is CallState.GREETING


@pytest.mark.parametrize(
    "terminal",
    [
        CallState.COMPLETE,
        CallState.TRANSFER_TO_HUMAN,
        CallState.CALL_DROPPED,
        CallState.POS_FAILED,
        CallState.PAYMENT_EXPIRED,
    ],
)
def test_terminal_states_permit_no_further_transitions(terminal):
    session = _session()
    session.state = terminal

    with pytest.raises(ValueError):
        session.transition(CallState.TAKING_ORDER)


def test_a_dropped_call_is_reachable_from_greeting():
    """Callers hang up during the greeting more than anywhere else."""
    session = _session()

    session.transition(CallState.CALL_DROPPED)

    assert session.state is CallState.CALL_DROPPED


# ── Redis round-trip ─────────────────────────────────────────────────────────

def test_session_round_trips_through_a_redis_dict():
    session = _session(
        order_items=[{"name": "Margherita Pizza", "qty": 2, "price_cents": 1800}],
        mishear_count=1,
    )
    session.transition(CallState.TAKING_ORDER)

    restored = CallSession.from_redis(session.to_redis())

    assert restored.call_id == session.call_id
    assert restored.state is CallState.TAKING_ORDER
    assert restored.order_items == session.order_items
    assert restored.mishear_count == 1
    assert restored.started_at == session.started_at


def test_to_redis_produces_json_safe_primitives():
    """json.dumps runs on this in the Redis layer — datetimes must be strings."""
    import json

    payload = _session().to_redis()

    json.dumps(payload)  # raises TypeError if a datetime leaked through
    assert isinstance(payload["started_at"], str)
    assert isinstance(payload["state"], str)


def test_to_redis_includes_call_id_for_the_cache_key():
    """save_session() keys on session_data['call_id']."""
    assert _session(call_id="abc").to_redis()["call_id"] == "abc"
