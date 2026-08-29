"""
POS integration interface (Strategy pattern).
All POS integrations implement this base class.
Swap Square → Lightspeed → Kounta without changing order logic.
"""

from abc import ABC, abstractmethod
from typing import Any


class POSBase(ABC):

    @abstractmethod
    async def push_order(self, restaurant_id: str, order: dict) -> dict:
        """
        Push order to POS system.
        Returns: {"pos_order_id": str, "success": bool}
        Raises: POSError on failure (caller should retry via Celery)
        """
        ...

    @abstractmethod
    async def check_status(self, pos_order_id: str) -> str:
        """Returns order status string from POS."""
        ...


class POSError(Exception):
    """Raised when POS push fails. Celery worker catches and retries 3×."""
    pass
