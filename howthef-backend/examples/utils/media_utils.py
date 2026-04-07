# shared/utils/media_utils.py
"""Utilities for converting Slack file attachments to LLM-compatible content parts."""

import asyncio
import base64
import re
from typing import Any

from shared.configurations.llm_models import ModelTier, get_model_config
from shared.configurations.logging_config import get_logger
from shared.models.content_extraction_bundle import ContentExtractionBundle

logger = get_logger()

IMAGE_MIMETYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
}

SUPPORTED_SLACK_FILETYPES = {"png", "jpg", "jpeg", "gif", "webp"}

TEXT_MIMETYPES = {
    "text/plain",
    "text/markdown",
    "text/x-python",
    "text/csv",
    "application/json",
    "application/x-yaml",
    "text/yaml",
    "text/x-sql",
    "text/javascript",
    "text/typescript",
    "text/html",
    "text/css",
    "application/toml",
}

TEXT_SLACK_FILETYPES = {
    "md",
    "py",
    "json",
    "txt",
    "yaml",
    "yml",
    "toml",
    "sql",
    "tsx",
    "ts",
    "js",
    "css",
    "html",
    "csv",
    "env",
}


def filter_text_files(files: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    """Filter Slack file objects to supported text file types."""
    if not files:
        return []
    return [
        f
        for f in files
        if f.get("mimetype", "") in TEXT_MIMETYPES or f.get("filetype", "").lower() in TEXT_SLACK_FILETYPES
    ]


def filter_image_files(files: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    """Filter Slack file objects to only supported image types."""
    if not files:
        return []
    return [
        f
        for f in files
        if f.get("mimetype", "") in IMAGE_MIMETYPES or f.get("filetype", "").lower() in SUPPORTED_SLACK_FILETYPES
    ]


async def slack_files_to_content_parts(
    files: list[dict[str, Any]],
    slack_service=None,
) -> list[dict[str, Any]]:
    """
    Download Slack image files and convert to LangChain-compatible content parts.

    Returns a list of dicts like:
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    """
    if not files or not slack_service:
        return []

    image_files = filter_image_files(files)
    if not image_files:
        return []

    parts = []
    for f in image_files:
        url_private = f.get("url_private")
        if not url_private:
            continue

        try:
            file_bytes, mimetype = await slack_service.download_file(url_private)
            if mimetype not in IMAGE_MIMETYPES:
                mimetype = f"image/{f.get('filetype', 'png')}"

            b64_data = base64.b64encode(file_bytes).decode("utf-8")
            parts.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mimetype};base64,{b64_data}"},
                }
            )
            logger.info(f"[MediaUtils] Downloaded image: {f.get('name', 'unknown')} ({len(file_bytes)} bytes)")
        except Exception as e:
            logger.warning(f"[MediaUtils] Failed to download Slack file '{f.get('name', '')}': {e}")

    return parts


AUDIO_MIMETYPES = {"audio/webm", "audio/ogg", "audio/mp3", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a"}
AUDIO_FILETYPES = {"webm", "ogg", "mp3", "m4a", "wav", "mp4a"}
PDF_MIMETYPES = {"application/pdf"}
PDF_FILETYPES = {"pdf"}


def _is_image_file(f: dict[str, Any]) -> bool:
    return f.get("mimetype", "") in IMAGE_MIMETYPES or f.get("filetype", "").lower() in SUPPORTED_SLACK_FILETYPES


def _is_text_file(f: dict[str, Any]) -> bool:
    return f.get("mimetype", "") in TEXT_MIMETYPES or f.get("filetype", "").lower() in TEXT_SLACK_FILETYPES


def _is_rich_media_file(f: dict[str, Any]) -> bool:
    """Audio, PDF, or any other file type that needs content_ingestion_service."""
    mime = f.get("mimetype", "").lower()
    ext = f.get("filetype", "").lower()
    return (
        mime in AUDIO_MIMETYPES
        or ext in AUDIO_FILETYPES
        or mime in PDF_MIMETYPES
        or ext in PDF_FILETYPES
    )


async def process_slack_attachments(
    files: list[dict[str, Any]],
    slack_service=None,
    include_text_files: bool = True,
    max_text_file_size: int = 100_000,
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    """
    Process all Slack file attachments — images for multimodal LLM, text files for context.
    Audio, PDF, and other rich media files are extracted via content_ingestion_service.

    Returns:
        (image_content_parts, text_file_contents)
        - image_content_parts: for LLM multimodal messages (existing format from slack_files_to_content_parts)
        - text_file_contents: [{"filename": str, "content": str}] for injection into conversation
    """
    if not files:
        return [], []

    image_parts = await slack_files_to_content_parts(files, slack_service=slack_service)

    text_file_contents: list[dict[str, str]] = []
    if not include_text_files or not slack_service:
        return image_parts, text_file_contents

    text_files = filter_text_files(files)
    for f in text_files:
        url_private = f.get("url_private")
        if not url_private:
            continue
        try:
            file_bytes, _ = await slack_service.download_file(url_private)
            if len(file_bytes) > max_text_file_size:
                logger.warning(
                    f"[MediaUtils] Text file '{f.get('name', '')}' too large "
                    f"({len(file_bytes)} bytes > {max_text_file_size}), skipping"
                )
                continue
            decoded = file_bytes.decode("utf-8", errors="replace")
            text_file_contents.append(
                {
                    "filename": f.get("name", "unknown"),
                    "content": decoded,
                }
            )
            logger.info(f"[MediaUtils] Downloaded text file: {f.get('name', 'unknown')} ({len(file_bytes)} bytes)")
        except Exception as e:
            logger.warning(f"[MediaUtils] Failed to download text file '{f.get('name', '')}': {e}")

    rich_media_files = [f for f in files if _is_rich_media_file(f)]
    if rich_media_files:
        try:
            from shared.services.content_ingestion_service import content_ingestion_service

            result = await content_ingestion_service.extract(
                slack_files=rich_media_files,
                slack_service=slack_service,
            )
            if result.primary_content:
                text_file_contents.append(
                    {
                        "filename": result.title or rich_media_files[0].get("name", "attachment"),
                        "content": result.primary_content,
                    }
                )
                logger.info(
                    f"[MediaUtils] Extracted {result.source_type} content via content_ingestion_service "
                    f"({result.content_length} chars, {result.extraction_duration_ms}ms)"
                )
            if result.errors:
                for err in result.errors:
                    logger.warning(f"[MediaUtils] Content ingestion warning: {err}")
        except Exception as e:
            logger.warning(f"[MediaUtils] Content ingestion failed for rich media files: {e}")

    return image_parts, text_file_contents


CONTENT_SUMMARY_THRESHOLD = 30_000
_SLACK_URL_PATTERN = re.compile(r"<(https?://[^|>]+)(?:\|[^>]*)?>")
_PLAIN_URL_PATTERN = re.compile(r'https?://[^\s\)\]\}>"\']+')


def _extract_urls_from_text(text: str) -> list[str]:
    """Extract clean URLs from text that may contain Slack formatting (<url|display>)."""
    urls: list[str] = []
    slack_urls = _SLACK_URL_PATTERN.findall(text)
    urls.extend(slack_urls)
    cleaned = _SLACK_URL_PATTERN.sub("", text)
    plain_urls = _PLAIN_URL_PATTERN.findall(cleaned)
    urls.extend(plain_urls)
    return list(dict.fromkeys(urls))


async def extract_all_content(
    files: list[dict] | None,
    user_message: str,
    slack_service: Any | None = None,
    extract_urls: bool = True,
    max_content_length: int = 50_000,
) -> ContentExtractionBundle:
    """Unified content extraction for all coordinator init nodes.

    Runs image/text extraction, audio/PDF extraction, and URL extraction in parallel.
    Returns a ContentExtractionBundle with all extracted content.
    """
    if not files and not user_message:
        return ContentExtractionBundle([], [], [], None, None)

    files = files or []

    # Task 1: process images + text files (existing behavior)
    async def _process_slack():
        if not files:
            return [], []
        return await process_slack_attachments(files, slack_service=slack_service)

    # Task 2: extract rich media (audio, PDF) via ContentIngestionService
    rich_media_files = [f for f in files if _is_rich_media_file(f)]

    async def _extract_rich_media():
        if not rich_media_files or not slack_service:
            return []
        try:
            from shared.services.content_ingestion_service import content_ingestion_service
            result = await content_ingestion_service.extract(
                slack_files=rich_media_files,
                slack_service=slack_service,
            )
            entries = []
            if result.primary_content:
                source = rich_media_files[0].get("name", "attachment") if rich_media_files else "attachment"
                entries.append({
                    "source": source,
                    "type": result.source_type or "unknown",
                    "content": result.primary_content,
                })
            return entries
        except Exception as e:
            logger.warning(f"[MediaUtils] Rich media extraction failed: {e}")
            return []

    # Task 3: extract URLs from user_message
    async def _extract_urls():
        if not extract_urls or not user_message:
            return []
        urls = _extract_urls_from_text(user_message)
        if not urls:
            return []
        try:
            from shared.services.content_ingestion_service import content_ingestion_service
            result = await asyncio.wait_for(
                content_ingestion_service.extract(urls=urls[:5]),
                timeout=40,
            )
            entries = []
            if result.primary_content:
                entries.append({
                    "source": urls[0],
                    "type": result.source_type or "url:article",
                    "content": result.primary_content,
                })
            return entries
        except asyncio.TimeoutError:
            logger.warning(f"[MediaUtils] URL extraction timed out for {urls[:2]}")
            return []
        except Exception as e:
            logger.warning(f"[MediaUtils] URL extraction failed: {e}")
            return []

    results = await asyncio.gather(
        _process_slack(),
        _extract_rich_media(),
        _extract_urls(),
        return_exceptions=True,
    )

    # Unpack with exception handling
    image_parts, text_file_contents = [], []
    if isinstance(results[0], tuple):
        image_parts, text_file_contents = results[0]
    elif isinstance(results[0], Exception):
        logger.warning(f"[MediaUtils] Slack attachment processing failed: {results[0]}")

    rich_content: list[dict] = []
    if isinstance(results[1], list):
        rich_content.extend(results[1])
    elif isinstance(results[1], Exception):
        logger.warning(f"[MediaUtils] Rich media extraction failed: {results[1]}")

    if isinstance(results[2], list):
        rich_content.extend(results[2])
    elif isinstance(results[2], Exception):
        logger.warning(f"[MediaUtils] URL extraction failed: {results[2]}")

    # Build content_summary
    content_summary = None
    content_type = None
    all_text_parts = []
    for tf in text_file_contents:
        all_text_parts.append(f"[{tf.get('filename', 'file')}]\n{tf.get('content', '')}")
    for rc in rich_content:
        all_text_parts.append(f"[{rc.get('source', 'source')} ({rc.get('type', 'content')})]\n{rc.get('content', '')}")

    if all_text_parts:
        full_text = "\n\n".join(all_text_parts)
        if len(full_text) > CONTENT_SUMMARY_THRESHOLD:
            try:
                from features.llm.services.llm_service import llm_service

                llm = llm_service.get_llm_instance(
                    get_model_config(ModelTier.GOOGLE_FLASH, temperature=0.1)
                )
                from langchain_core.messages import HumanMessage as _HM
                resp = await asyncio.wait_for(
                    llm.ainvoke([_HM(
                        content=f"Extract the key insights and main points from this content in under 2000 characters. "
                        f"Focus on actionable information:\n\n{full_text[:max_content_length]}"
                    )]),
                    timeout=30,
                )
                raw = resp.content
                content_summary = raw if isinstance(raw, str) else str(raw)
                content_summary = content_summary[:3000]
                logger.info(f"[MediaUtils] Content summarized via LLM ({len(full_text)} → {len(content_summary)} chars)")
            except asyncio.TimeoutError:
                logger.warning("[MediaUtils] LLM summarization timed out after 30s, using truncated")
                content_summary = full_text[:CONTENT_SUMMARY_THRESHOLD]
            except Exception as e:
                logger.warning(f"[MediaUtils] LLM summarization failed, using truncated: {e}")
                content_summary = full_text[:CONTENT_SUMMARY_THRESHOLD]
        else:
            content_summary = full_text

        # Determine primary content_type
        if rich_content:
            first_type = rich_content[0].get("type", "unknown")
            content_type = first_type
        elif text_file_contents:
            first_name = text_file_contents[0].get("filename", "")
            ext = first_name.rsplit(".", 1)[-1] if "." in first_name else "text"
            content_type = f"file:{ext}"

    return ContentExtractionBundle(
        image_parts=image_parts,
        text_file_contents=text_file_contents,
        rich_content=rich_content,
        content_summary=content_summary,
        content_type=content_type,
    )


def get_reply_thread_ts(state: dict[str, Any]) -> str | None:
    """
    Resolve the thread_ts to use when replying in Slack.
    Falls back to message_ts so that the first response to a top-level message
    creates a thread on that message (instead of posting a separate top-level reply).
    All agents should use this instead of raw state.get("thread_ts").
    """
    return state.get("thread_ts") or state.get("message_ts") or None


def build_multimodal_content(text: str, image_parts: list[dict[str, Any]]) -> Any:
    """
    Build a content list suitable for LangChain HumanMessage.
    If there are image parts, returns a list of content dicts.
    Otherwise returns the plain text string.
    """
    if not image_parts:
        return text

    content = []
    if text:
        content.append({"type": "text", "text": text})
    content.extend(image_parts)
    return content
