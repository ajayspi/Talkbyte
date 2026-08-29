import structlog
import sys
from pythonjsonlogger import jsonlogger

def setup_logging(debug: bool = False):
    """Initialize structured logging with structlog."""

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger()
