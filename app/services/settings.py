"""ProstudioX settings service.

Manages user-editable app settings (LLM provider, API key, model, base URL).

Persistence (highest priority first, kept in sync):
  1. Supabase ``settings`` table  — when ``SUPABASE_URL`` and a service-role key
     (``SUPABASE_SERVICE_ROLE_KEY`` / ``SUPABASE_SERVICE_KEY``) are present.
  2. ``config.toml`` (via ``config.app``) — always, as the local fallback.

The runtime LLM pipeline reads ``config.app`` directly, so applying settings to
``config.app`` makes them take effect for the next generation with no extra wiring.
"""

from __future__ import annotations

import os
from typing import Any

from loguru import logger

from app.config import config
from app.models.llm_provider import LLM_PROVIDERS, LLM_PROVIDER_REGISTRY

_MASK_CHARS = 4
DEFAULT_FALLBACK_PROVIDER = "openrouter"
DEFAULT_FALLBACK_MODEL = "openrouter/free"


def _supabase_url() -> str:
    return (os.getenv("SUPABASE_URL") or "").strip()


def _supabase_key() -> str:
    return (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_KEY")
        or os.getenv("SUPABASE_KEY")
        or ""
    ).strip()


def supabase_enabled() -> bool:
    return bool(_supabase_url() and _supabase_key())


def _sb_headers() -> dict:
    key = _supabase_key()
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _sb_get_settings() -> dict:
    import requests

    url = f"{_supabase_url().rstrip('/')}/rest/v1/settings?select=key,value"
    resp = requests.get(url, headers=_sb_headers(), timeout=15)
    resp.raise_for_status()
    rows = resp.json()
    return {row["key"]: row["value"] for row in rows}


def _sb_upsert_settings(settings: dict) -> None:
    import requests

    url = f"{_supabase_url().rstrip('/')}/rest/v1/settings"
    rows = [{"key": k, "value": v} for k, v in settings.items()]
    headers = _sb_headers()
    headers["Prefer"] = "resolution=merge-duplicates"
    resp = requests.post(url, json=rows, headers=headers, timeout=15)
    resp.raise_for_status()


def list_providers() -> list[dict]:
    """Return the LLM provider registry as UI-friendly dicts."""
    return [
        {
            "id": p.provider_id,
            "label": p.default_label,
            "default_model": p.default_model,
            "requires_api_key": p.requires_api_key,
            "requires_base_url": p.requires_base_url,
        }
        for p in LLM_PROVIDER_REGISTRY
    ]


def _mask_secret(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    if len(value) <= _MASK_CHARS:
        return "****"
    return f"{value[:_MASK_CHARS]}…{value[-_MASK_CHARS:]}"


def _read_local() -> dict:
    provider = (config.app.get("llm_provider") or "").strip() or "gemini"
    return {
        "llm_provider": provider,
        "llm_api_key": config.app.get(f"{provider}_api_key", "") or "",
        "llm_model_name": config.app.get(f"{provider}_model_name", "") or "",
        "llm_base_url": config.app.get(f"{provider}_base_url", "") or "",
    }


def get_settings() -> dict:
    """Return current effective settings (masked key + provider list)."""
    settings = _read_local()

    if supabase_enabled():
        try:
            sb = _sb_get_settings()
            if sb.get("llm_provider"):
                settings["llm_provider"] = sb["llm_provider"]
            if sb.get("llm_api_key"):
                settings["llm_api_key"] = sb["llm_api_key"]
            if sb.get("llm_model_name"):
                settings["llm_model_name"] = sb["llm_model_name"]
            if sb.get("llm_base_url"):
                settings["llm_base_url"] = sb["llm_base_url"]
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"supabase settings read failed: {exc}")

    settings["llm_fallback_provider"] = (
        config.app.get("llm_fallback_provider") or DEFAULT_FALLBACK_PROVIDER
    )
    settings["llm_fallback_model"] = (
        config.app.get("llm_fallback_model") or DEFAULT_FALLBACK_MODEL
    )
    settings["llm_api_key_masked"] = _mask_secret(settings["llm_api_key"])
    settings["providers"] = list_providers()
    settings["supabase_enabled"] = supabase_enabled()
    return settings


def save_settings(settings: dict[str, Any]) -> dict:
    """Merge + persist a (possibly partial) settings update.

    For each field, an explicit value in ``settings`` wins; otherwise the NEW
    provider's existing value from ``config.app`` is kept (so switching provider
    picks up that provider's own key/model, never the previous provider's).
    An empty string clears the value (empty = use provider default).
    """
    current = _read_local()

    provider = (settings.get("llm_provider") or current["llm_provider"]).strip()
    if provider not in LLM_PROVIDERS:
        raise ValueError(f"unsupported llm provider: {provider}")

    api_key = (
        (settings.get("llm_api_key") or "").strip()
        if "llm_api_key" in settings
        else (config.app.get(f"{provider}_api_key") or "")
    )
    model_name = (
        (settings.get("llm_model_name") or "").strip()
        if "llm_model_name" in settings
        else (config.app.get(f"{provider}_model_name") or "")
    )
    base_url = (
        (settings.get("llm_base_url") or "").strip()
        if "llm_base_url" in settings
        else (config.app.get(f"{provider}_base_url") or "")
    )
    fallback_provider = (
        (settings.get("llm_fallback_provider") or "").strip()
        if "llm_fallback_provider" in settings
        else (config.app.get("llm_fallback_provider") or "")
    )
    fallback_model = (
        (settings.get("llm_fallback_model") or "").strip()
        if "llm_fallback_model" in settings
        else (config.app.get("llm_fallback_model") or "")
    )

    # Apply to runtime config (config.app is the [app] TOML section).
    config.app["llm_provider"] = provider
    config.app[f"{provider}_api_key"] = api_key
    config.app[f"{provider}_model_name"] = model_name
    config.app[f"{provider}_base_url"] = base_url
    config.app["llm_fallback_provider"] = fallback_provider
    config.app["llm_fallback_model"] = fallback_model

    try:
        config.save_config()
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"failed to save config.toml: {exc}")

    if supabase_enabled():
        try:
            _sb_upsert_settings(
                {
                    "llm_provider": provider,
                    "llm_api_key": api_key,
                    "llm_model_name": model_name,
                    "llm_base_url": base_url,
                    "llm_fallback_provider": fallback_provider,
                    "llm_fallback_model": fallback_model,
                }
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"supabase settings write failed: {exc}")

    return get_settings()


def _canonical_keys() -> list[dict]:
    """The API keys the app uses (LLM providers + stock media)."""
    keys = [
        {"key": p.config_key("api_key"), "label": p.default_label, "kind": "llm"}
        for p in LLM_PROVIDER_REGISTRY
        if p.requires_api_key
    ]
    keys.append({"key": "pexels_api_keys", "label": "Pexels (stock)", "kind": "stock"})
    keys.append({"key": "pixabay_api_keys", "label": "Pixabay (stock)", "kind": "stock"})
    return keys


def _key_to_str(value: Any) -> str:
    if isinstance(value, (list, tuple)):
        return ",".join(str(x) for x in value)
    return str(value or "")


def _str_to_key_value(key: str, value: str):
    value = (value or "").strip()
    if key in ("pexels_api_keys", "pixabay_api_keys"):
        return [x.strip() for x in value.split(",") if x.strip()]
    return value


def list_api_keys() -> dict:
    """Return every API key (masked) for the settings table."""
    sb = {}
    if supabase_enabled():
        try:
            sb = _sb_get_settings()
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"supabase settings read failed: {exc}")

    keys = []
    for item in _canonical_keys():
        key = item["key"]
        value = sb.get(key) if key in sb else config.app.get(key, "")
        value_str = _key_to_str(value)
        keys.append(
            {
                "key": key,
                "label": item["label"],
                "kind": item["kind"],
                "masked": _mask_secret(value_str),
                "has_value": bool(value_str),
            }
        )
    return {"keys": keys, "supabase_enabled": supabase_enabled()}


def save_api_key(key: str, value: str) -> dict:
    """Save one API key (validated against the canonical key list)."""
    valid = {item["key"] for item in _canonical_keys()}
    if key not in valid:
        raise ValueError(f"unknown api key: {key}")

    new_value = _str_to_key_value(key, value)
    config.app[key] = new_value

    try:
        config.save_config()
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"failed to save config.toml: {exc}")

    if supabase_enabled():
        try:
            _sb_upsert_settings({key: _key_to_str(new_value)})
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"supabase settings write failed: {exc}")

    return list_api_keys()
