import structlog
import sys
import logging as stdlib_logging

def setup_logging(debug: bool = False):
    """Initialize structured logging with structlog."""

    # Set up stdlib logging level based on debug flag
    log_level = stdlib_logging.DEBUG if debug else stdlib_logging.INFO
    stdlib_logging.basicConfig(
        level=log_level,
        format="%(message)s",
        stream=sys.stdout,
    )

    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
    )

    return structlog.get_logger()
