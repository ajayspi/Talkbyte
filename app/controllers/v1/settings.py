from fastapi import Request

from app.controllers.v1.base import new_router
from app.models.schema import ApiKeyRequest, SettingsRequest
from app.services import llm, settings as settings_service
from app.utils import utils

router = new_router()


@router.get(
    "/settings",
    summary="Get current app settings (LLM provider, model, masked key)",
)
def get_settings(request: Request):
    return utils.get_response(200, settings_service.get_settings())


@router.put(
    "/settings",
    summary="Save app settings (LLM provider, key, model, base URL)",
)
def put_settings(request: Request, body: SettingsRequest):
    saved = settings_service.save_settings(body.model_dump(exclude_none=True))
    return utils.get_response(200, saved, "Settings saved")


@router.post(
    "/settings/test",
    summary="Test the currently-saved LLM provider connection",
)
def test_settings(request: Request):
    ok, message, elapsed = llm.test_connection()
    return utils.get_response(
        200,
        {"ok": ok, "message": message, "elapsed": elapsed},
    )


@router.get(
    "/settings/keys",
    summary="List all API keys (masked) used by the app",
)
def get_api_keys(request: Request):
    return utils.get_response(200, settings_service.list_api_keys())


@router.put(
    "/settings/keys",
    summary="Set a single API key",
)
def put_api_key(request: Request, body: ApiKeyRequest):
    result = settings_service.save_api_key(body.key, body.value)
    return utils.get_response(200, result, "API key saved")
