"""
Call state machine — TalkByte AI
All valid state transitions are defined here.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


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
    order_items: list[dict] = []
    mishear_count: int = 0
    started_at: datetime = datetime.utcnow()
    transcript: list[dict] = []

    def transition(self, new_state: CallState) -> None:
        allowed = VALID_TRANSITIONS.get(self.state, [])
        if new_state not in allowed:
            raise ValueError(
                f"Invalid transition: {self.state} → {new_state}. "
                f"Allowed: {[s.value for s in allowed]}"
            )
        self.state = new_state
