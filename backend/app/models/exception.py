"""Custom exceptions for TalkByte."""


class TalkByteException(Exception):
    """Base exception for TalkByte."""
    code: str = "INTERNAL_ERROR"
    status_code: int = 500


class CallDropped(TalkByteException):
    """WebSocket disconnected mid-call."""
    code = "CALL_DROPPED"
    status_code = 503


class POSIntegrationError(TalkByteException):
    """POS order push failed."""
    code = "POS_FAILED"
    status_code = 500


class ServiceUnavailable(TalkByteException):
    """External service (Deepgram, OpenAI, etc.) unavailable."""
    code = "SERVICE_UNAVAILABLE"
    status_code = 503


class ValidationError(TalkByteException):
    """Invalid input."""
    code = "VALIDATION_ERROR"
    status_code = 400


class NotFound(TalkByteException):
    """Resource not found."""
    code = "NOT_FOUND"
    status_code = 404
