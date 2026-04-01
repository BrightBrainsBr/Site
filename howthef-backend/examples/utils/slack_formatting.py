# shared/utils/slack_formatting.py
"""
Markdown → Slack mrkdwn converter.

Slack uses its own mrkdwn format which differs from standard Markdown:
- Bold: *text* (not **text**)
- Italic: _text_ (not *text*)
- Strikethrough: ~text~ (same)
- Code: `code` (same)
- Code block: ```code``` (same)
- Lists: works with - or •
- Headers: no # support — use *Bold* on its own line
- Links: <url|text> (not [text](url))
"""

import os
import re
from datetime import UTC, datetime
from typing import Any


def markdown_to_slack(text: str) -> str:
    """
    Convert standard Markdown to Slack mrkdwn format.

    Handles: headers, bold, italic, links, images, horizontal rules.
    Preserves code blocks (``` ```) as-is.
    """
    if not text:
        return text

    # Split on code blocks to preserve them
    parts = re.split(r"(```[\s\S]*?```)", text)
    converted_parts = []

    for i, part in enumerate(parts):
        if part.startswith("```"):
            converted_parts.append(part)
        else:
            converted_parts.append(_convert_markdown_segment(part))

    return "".join(converted_parts)


def _convert_markdown_segment(text: str) -> str:
    """Convert a non-code-block segment of Markdown to Slack mrkdwn."""
    # Headers: ### Title → *Title*
    text = re.sub(r"^#{1,6}\s+(.+)$", r"*\1*", text, flags=re.MULTILINE)

    # Bold+Italic: ***text*** or ___text___ → *_text_*
    text = re.sub(r"\*{3}(.+?)\*{3}", r"*_\1_*", text)
    text = re.sub(r"_{3}(.+?)_{3}", r"*_\1_*", text)

    # Bold: **text** → *text*
    text = re.sub(r"\*{2}(.+?)\*{2}", r"*\1*", text)

    # Italic: *text* that isn't already bold → _text_
    # Only convert single * that aren't part of ** or surrounded by word chars
    # This is tricky — Slack bold IS * so we skip this to avoid conflicts

    # Links: [text](url) → <url|text>
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"<\2|\1>", text)

    # Images: ![alt](url) → <url|alt> (best we can do in Slack)
    text = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r"<\2|\1>", text)

    # Horizontal rules: --- or *** or ___ → ───
    text = re.sub(r"^[-*_]{3,}\s*$", "───", text, flags=re.MULTILINE)

    # Arrow entities
    text = text.replace("→", "→").replace("&rarr;", "→")

    return text


def format_progress_message(
    agent_name: str,
    started_at: datetime | None,
    iteration: int = 0,
    tool_count: int = 0,
    current_action: str | None = None,
) -> str:
    """
    Build a CTO-style progress message for Slack status updates.

    Returns something like:
      "CMO working — 45s elapsed | 3 tool calls | Delegating to Research..."
    """
    parts: list[str] = []

    if started_at:
        elapsed = (datetime.now(tz=UTC) - started_at).total_seconds()
        if elapsed < 120:
            parts.append(f"{int(elapsed)}s elapsed")
        else:
            parts.append(f"{elapsed / 60:.1f}m elapsed")

    if iteration > 0:
        parts.append(f"iteration {iteration}")

    if tool_count > 0:
        parts.append(f"{tool_count} tool call{'s' if tool_count > 1 else ''}")

    detail = " | ".join(parts) if parts else ""
    header = f"{agent_name} working"

    if detail and current_action:
        return f"{header} — {detail} | {current_action}"
    elif detail:
        return f"{header} — {detail}"
    elif current_action:
        return f"{header} — {current_action}"
    return header




def build_response_blocks(
    response_text: str,
    agent_name: str = "",
    iteration_count: int = 0,
    cumulative_tokens: int = 0,
    tool_count: int = 0,
    model_name: str = "",
    cumulative_cost: float = 0.0,
) -> list[dict[str, Any]]:
    """
    Build Slack blocks from a response, with proper formatting and stats footer.

    Handles:
    - Converting markdown to mrkdwn
    - Splitting long text into multiple sections (Slack 3000 char limit)
    - Adding a stats context footer with tokens, cost, iterations, tools, model
    """
    MAX_BLOCK_LEN = 2900
    blocks: list[dict[str, Any]] = []

    formatted_text = markdown_to_slack(response_text)

    if not formatted_text:
        return blocks

    if len(formatted_text) <= MAX_BLOCK_LEN:
        blocks.append(
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": formatted_text},
            }
        )
    else:
        remaining = formatted_text
        while remaining:
            chunk = remaining[:MAX_BLOCK_LEN]
            if len(remaining) > MAX_BLOCK_LEN:
                nl_pos = chunk.rfind("\n")
                if nl_pos > MAX_BLOCK_LEN // 2:
                    chunk = remaining[:nl_pos]
            blocks.append(
                {
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": chunk},
                }
            )
            remaining = remaining[len(chunk) :].lstrip("\n")

    # Stats footer
    if cumulative_tokens > 0 or iteration_count > 0 or cumulative_cost > 0:
        stats_parts = []
        if cumulative_tokens > 0:
            stats_parts.append(f"{cumulative_tokens:,} tokens")
        if cumulative_cost > 0:
            if cumulative_cost < 0.01:
                stats_parts.append(f"${cumulative_cost:.4f}")
            else:
                stats_parts.append(f"${cumulative_cost:.3f}")
        if iteration_count > 0:
            stats_parts.append(f"{iteration_count} iteration{'s' if iteration_count > 1 else ''}")
        if tool_count > 0:
            stats_parts.append(f"{tool_count} tool call{'s' if tool_count > 1 else ''}")
        if model_name:
            stats_parts.append(model_name)
        env = os.getenv("ENVIRONMENT", "local")
        stats_parts.append(env)

        label = f"{agent_name} Agent" if agent_name else "Agent"
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"_{label}: {' | '.join(stats_parts)}_",
                    }
                ],
            }
        )

    return blocks
