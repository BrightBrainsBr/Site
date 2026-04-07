"""LangGraph invocation helpers.

Provides typed graph invocation with structured output (GraphOutput)
that separates state from interrupts.  All helpers auto-inject Langfuse
callbacks when enabled so both LangSmith (env-based) and Langfuse
(callback-based) tracing run in parallel.
"""

from __future__ import annotations

from typing import Any

from langgraph.graph.state import CompiledStateGraph
from langgraph.types import Interrupt

from shared.utils.langfuse_utils import inject_langfuse_callbacks


async def ainvoke_v2(
    graph: CompiledStateGraph,
    input: Any,
    config: dict[str, Any],
    **kwargs: Any,
) -> tuple[dict[str, Any], tuple[Interrupt, ...]]:
    """Invoke a compiled LangGraph with version='v2'.

    Returns ``(state, interrupts)`` so callers can keep using
    ``state.get(...)`` while also inspecting interrupts cleanly.

    When the graph's state schema is a Pydantic model, LangGraph 1.1.0
    returns the model instance directly; we normalise to dict here so
    callers don't need to care.
    """
    config = inject_langfuse_callbacks(config)
    output = await graph.ainvoke(input, config, version="v2", **kwargs)
    value = output.value
    if not isinstance(value, dict):
        value = value.model_dump() if hasattr(value, "model_dump") else dict(value)
    return value, output.interrupts


async def ainvoke_traced(
    graph: CompiledStateGraph,
    input: Any,
    config: dict[str, Any],
    **kwargs: Any,
) -> dict[str, Any]:
    """Invoke a compiled LangGraph (v1-style) with Langfuse tracing.

    Drop-in replacement for ``graph.ainvoke(input, config)`` that
    injects Langfuse callbacks.  Returns the state dict.
    """
    config = inject_langfuse_callbacks(config)
    result = await graph.ainvoke(input, config, **kwargs)
    if not isinstance(result, dict):
        result = result.model_dump() if hasattr(result, "model_dump") else dict(result)
    return result
