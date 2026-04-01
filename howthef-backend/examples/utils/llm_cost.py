# howthef-backend/shared/utils/llm_cost.py
"""LLM cost calculation from token usage.

Pricing is per 1M tokens. Vertex AI pricing (March 2026).
Keep this table updated when adding new models.
"""

from __future__ import annotations

MODEL_PRICING: dict[str, tuple[float, float]] = {
    # (input_cost_per_1M, output_cost_per_1M)
    # Gemini 3.x preview
    "gemini-3.1-pro-preview": (2.00, 12.00),
    "gemini-3-flash-preview": (0.50, 3.00),
    "gemini-3.1-flash-lite-preview": (0.25, 1.50),
    "gemini-3-pro-preview": (2.00, 12.00),
    # Gemini 2.5 GA
    "gemini-2.5-pro": (1.25, 10.00),
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash-lite": (0.10, 0.40),
    # Gemini 2.0 GA
    "gemini-2.0-flash": (0.15, 0.60),
    "gemini-2.0-flash-lite": (0.075, 0.30),
    # Anthropic
    "claude-opus-4-6": (5.00, 25.00),
    "claude-sonnet-4-6": (3.00, 15.00),
    "claude-sonnet-4-5": (3.00, 15.00),
    "claude-haiku-4-5": (1.00, 5.00),
    # OpenAI
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
}


def calculate_llm_cost(
    model_name: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
) -> float:
    """Calculate cost in USD for a single LLM call."""
    pricing = MODEL_PRICING.get(model_name)
    if not pricing:
        for key, val in MODEL_PRICING.items():
            if key in model_name or model_name in key:
                pricing = val
                break
    if not pricing:
        return 0.0
    input_cost, output_cost = pricing
    return (input_tokens * input_cost + output_tokens * output_cost) / 1_000_000


def calculate_cost_from_usage(llm_usage: list[dict]) -> float:
    """Calculate total cost from a list of llm_usage dicts.

    Each dict should have: model, input_tokens, output_tokens.
    This is the format already used by CRO/CMO/CoFounder/Research agents.
    """
    total = 0.0
    for entry in llm_usage:
        total += calculate_llm_cost(
            model_name=entry.get("model", ""),
            input_tokens=entry.get("input_tokens", 0),
            output_tokens=entry.get("output_tokens", 0),
        )
    return total
