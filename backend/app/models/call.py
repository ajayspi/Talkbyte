"""
Call state machine — TalkByte AI
All valid state transitions are defined here.
"""

from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class CallState(str, Enum):
    GREETING       = "GREETING"
    TAKING_ORDER   = "TAKING_ORDER"
    CONFIRMING     = "CONFIRMING"
    CONFIRMED      = "CONFIRMED"
    PAYMENT_SENT   = "PAYMENT_SENT"
    COMPLETE       = "COMPLETE"

    # Error / exit states
    TRANSFER_TO_HUMAN = "TRANSFER_TO_HUMAN"   # caller requests human / 3× mishear
    CALL_DROPPED      = "CALL_DROPPED"         # WebSocket disconnect mid-call
    POS_FAILED        = "POS_FAILED"           # Square push failed after retries
    PAYMENT_EXPIRED   = "PAYMENT_EXPIRED"      # Stripe link not opened in 30min


VALID_TRANSITIONS: dict[CallState, list[CallState]] = {
    CallState.GREETING:          [CallState.TAKING_ORDER, CallState.TRANSFER_TO_HUMAN, CallState.CALL_DROPPED],
    CallState.TAKING_ORDER:      [CallState.CONFIRMING,   CallState.TRANSFER_TO_HUMAN, CallState.CALL_DROPPED],
    CallState.CONFIRMING:        [CallState.TAKING_ORDER, CallState.CONFIRMED,          CallState.TRANSFER_TO_HUMAN, CallState.CALL_DROPPED],
    CallState.CONFIRMED:         [CallState.PAYMENT_SENT, CallState.POS_FAILED],
    CallState.PAYMENT_SENT:      [CallState.COMPLETE,     CallState.PAYMENT_EXPIRED],
    CallState.COMPLETE:          [],
    CallState.TRANSFER_TO_HUMAN: [],
    CallState.CALL_DROPPED:      [],
    CallState.POS_FAILED:        [],
    CallState.PAYMENT_EXPIRED:   [],
}


class CallSession(BaseModel):
    call_id: str
    restaurant_id: str
    caller_number: str
    state: CallState = CallState.GREETING
    order_items: list[dict] = Field(default_factory=list)
    mishear_count: int = 0
    # default_factory, not `= datetime.utcnow()`: a bare default is evaluated
    # once at import, giving every call in the process the same start time.
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    transcript: list[dict] = Field(default_factory=list)

    # ── Redis serialisation ──────────────────────────────────────────────
    # The Redis layer stores plain JSON dicts; the LLM layer wants a
    # CallSession. These two are the bridge.

    def to_redis(self) -> dict:
        """JSON-safe dict for save_session(). Datetimes become ISO strings."""
        return self.model_dump(mode="json")

    @classmethod
    def from_redis(cls, data: dict) -> "CallSession":
        """Rebuild a session from get_session() output."""
        return cls.model_validate(data)

    def transition(self, new_state: CallState) -> None:
        allowed = VALID_TRANSITIONS.get(self.state, [])
        if new_state not in allowed:
            raise ValueError(
                f"Invalid transition: {self.state} → {new_state}. "
                f"Allowed: {[s.value for s in allowed]}"
            )
        self.state = new_state
