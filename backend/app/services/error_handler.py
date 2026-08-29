"""Global exception handlers for TalkByte."""

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.models.exception import TalkByteException

log = structlog.get_logger()


def create_error_response(exc: TalkByteException, request_id: str = ""):
    """Create standardized error response."""
    return {
        "error": exc.code,
        "message": str(exc),
        "details": {
            "request_id": request_id,
        },
    }


def register_exception_handlers(app: FastAPI):
    """Register global exception handlers."""

    @app.exception_handler(TalkByteException)
    async def talkbyte_exception_handler(request: Request, exc: TalkByteException):
        log.error(
            "talkbyte_exception",
            code=exc.code,
            message=str(exc),
            path=request.url.path,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=create_error_response(exc),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        log.error(
            "unhandled_exception",
            message=str(exc),
            path=request.url.path,
            type=type(exc).__name__,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
            },
        )
