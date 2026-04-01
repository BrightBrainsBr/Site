# shared/utils/langfuse_utils.py
"""Langfuse tracing integration for LangChain / LangGraph.

Provides a singleton CallbackHandler and a config-injection helper so
both LangSmith (env-based auto-tracing) and Langfuse (callback-based)
can run in parallel.

Env vars consumed (all optional — if missing, Langfuse is silently disabled):
  LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST
  LANGFUSE_ENABLED  — set to "false" to explicitly disable even when keys exist
"""

from __future__ import annotations

import os
from typing import Any

from shared.configurations.logging_config import get_logger

logger = get_logger()

_handler: Any | None = None
_initialised = False


def _is_enabled() -> bool:
    if os.getenv("LANGFUSE_ENABLED", "true").lower() in ("false", "0", "no"):
        return False
    return bool(os.getenv("LANGFUSE_PUBLIC_KEY")) and bool(os.getenv("LANGFUSE_SECRET_KEY"))


def get_langfuse_handler():
    """Return a shared LangchainCallbackHandler, or None if disabled."""
    global _handler, _initialised
    if _initialised:
        return _handler

    _initialised = True
    if not _is_enabled():
        logger.info("[langfuse] Disabled — missing keys or LANGFUSE_ENABLED=false")
        return None

    try:
        from langfuse.langchain import CallbackHandler

        _handler = CallbackHandler()
        host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")
        logger.info(f"[langfuse] CallbackHandler initialised → {host}")
    except Exception as exc:
        logger.warning(f"[langfuse] Failed to initialise: {exc}")
        _handler = None

    return _handler


def get_current_trace_id() -> str | None:
    """Return the current LangFuse trace ID from the singleton handler, or None.

    LangFuse CallbackHandler exposes last_trace_id after a traced run completes.
    Returns None if handler is disabled, not yet populated, or on any error.
    """
    try:
        handler = get_langfuse_handler()
        if handler is None:
            return None
        trace_id = getattr(handler, "last_trace_id", None)
        return str(trace_id) if trace_id else None
    except Exception:
        return None


def inject_langfuse_callbacks(config: dict[str, Any]) -> dict[str, Any]:
    """Return a *new* config dict with the Langfuse handler appended to callbacks.

    If Langfuse is disabled or config already contains the handler, the
    original config is returned unchanged.
    """
    handler = get_langfuse_handler()
    if handler is None:
        return config

    existing: list = list(config.get("callbacks") or [])
    if handler in existing:
        return config

    return {**config, "callbacks": existing + [handler]}
