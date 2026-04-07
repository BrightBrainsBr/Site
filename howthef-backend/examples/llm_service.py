# features/llm/services/llm_service.py

# --- Assume previous imports are correct ---
import asyncio
import datetime  # Add datetime for log filenames
import json
import os
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from google import genai  # Use the import specified in the google-genai README
from google.genai import types as genai_types
from langchain_anthropic import ChatAnthropic

# LangChain Imports
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from langchain_xai import ChatXAI
from langsmith import traceable
from openai import AsyncOpenAI
from pydantic import BaseModel, ValidationError

# Local Imports
from features.llm.models.llm_models import LLMConfig, LLMProvider, StructuredOutputError
from features.llm.utils.llm_output_parser import validate_and_fix_json

# Use correct shared path
from shared.configurations.logging_config import get_logger
from shared.utils.langfuse_utils import inject_langfuse_callbacks
from shared.utils.langsmith_utils import LangSmithService

logger = get_logger()
load_dotenv()

import logging as _stdlib_logging

_stdlib_logging.getLogger("google_genai._api_client").setLevel(_stdlib_logging.WARNING)
_stdlib_logging.getLogger("google_genai.models").setLevel(_stdlib_logging.WARNING)

try:
    from anthropic import AsyncAnthropic
except Exception:
    AsyncAnthropic = None

try:
    from anthropic import AsyncAnthropicVertex
except Exception:
    AsyncAnthropicVertex = None

try:
    from anthropic import AsyncAnthropicBedrock
except Exception:
    AsyncAnthropicBedrock = None

# ============================================================
# CLOUD PLATFORM ROUTING
# ============================================================

_PLATFORM_ENV_VARS = {
    LLMProvider.ANTHROPIC: "ANTHROPIC_PLATFORM",
    LLMProvider.GOOGLE: "GOOGLE_PLATFORM",
}

_BEDROCK_MODEL_MAP = {
    "claude-sonnet-4-6": "us.anthropic.claude-sonnet-4-6-v1:0",
    "claude-opus-4-6": "us.anthropic.claude-opus-4-6-v1:0",
    "claude-haiku-3-5": "us.anthropic.claude-3-5-haiku-20241022-v1:0",
}


def resolve_platform(provider: LLMProvider, config_dict: dict[str, Any] | None = None) -> str:
    """Resolve which cloud platform to use for a given provider.

    Priority: config_dict["platform"] > env var > "direct"
    """
    if config_dict and config_dict.get("platform"):
        return config_dict["platform"]
    env_var = _PLATFORM_ENV_VARS.get(provider, "")
    return os.getenv(env_var, "direct")


def get_bedrock_model_id(model_name: str) -> str:
    """Map standard Anthropic model names to Bedrock model IDs."""
    if model_name in _BEDROCK_MODEL_MAP:
        return _BEDROCK_MODEL_MAP[model_name]
    return f"us.anthropic.{model_name}-v1:0"


GEMINI_UNSUPPORTED_SCHEMA_KEYS = {"additionalProperties", "$defs", "title", "default"}


def _sanitize_schema_for_gemini(schema: dict) -> dict:
    """
    Recursively strip keys that Gemini's response_schema does not support
    (additionalProperties, $defs, title, default).  Also inline any $ref
    pointers using the top-level $defs before removing $defs itself.

    IMPORTANT: Keys inside "properties" dicts are actual property names and
    must NOT be stripped even if they collide with metadata key names (e.g.
    a model field literally called "title").
    """
    defs = schema.get("$defs", {})

    def _resolve(node, *, is_properties_dict: bool = False):
        if not isinstance(node, dict):
            return node

        if "$ref" in node:
            ref_path = node["$ref"]  # e.g. "#/$defs/Foo"
            ref_name = ref_path.rsplit("/", 1)[-1]
            if ref_name in defs:
                resolved = _resolve(defs[ref_name].copy())
                for k, v in node.items():
                    if k != "$ref":
                        resolved[k] = v
                return resolved
            return node

        cleaned: dict = {}
        for key, value in node.items():
            if not is_properties_dict and key in GEMINI_UNSUPPORTED_SCHEMA_KEYS:
                continue
            if key == "properties" and isinstance(value, dict):
                cleaned[key] = _resolve(value, is_properties_dict=True)
            elif isinstance(value, dict):
                cleaned[key] = _resolve(value)
            elif isinstance(value, list):
                cleaned[key] = [_resolve(item) if isinstance(item, dict) else item for item in value]
            else:
                cleaned[key] = value
        return cleaned

    return _resolve(schema)


class LLMService:
    """
    Service responsible for instantiating LangChain ChatModel clients
    based on configuration. API keys are primarily loaded from environment variables.

    COST TRACKING USAGE:

    # Set cost context before AI calls in your agent/service:
    llm_service.set_cost_context(
        edition_id="edition_123",
        operation_type="personalization",
        job_id="job_456",
        user_id="user_789"
    )

    # All subsequent AI calls will automatically include this metadata in LangSmith
    result, model = await llm_service.invoke_structured_output(...)

    # Clear context when done (optional, but good practice)
    llm_service.clear_cost_context()

    # LangSmith will now show costs grouped by edition_id, operation_type, etc.

    INTEGRATION EXAMPLE:

    # In news_personalization_agent_nodes_enhanced.py, line ~617:

    # BEFORE:
    # response = await llm_service.invoke_structured_output(...)

    # AFTER:
    # llm_service.set_cost_context(
    #     edition_id=state.edition_id,
    #     operation_type="personalization",
    #     job_id=state.job_id,
    #     user_id=user['id']
    # )
    # response = await llm_service.invoke_structured_output(...)
    # # Context automatically clears when function ends or you can call clear_cost_context()
    """

    def __init__(self):
        self.langsmith_tracer = None
        # NEW: Cost tracking context
        self._cost_context = {"edition_id": None, "operation_type": None, "job_id": None, "user_id": None}
        try:
            self.langsmith_tracer = LangSmithService.get_client(raise_error=False)
        except Exception as e:
            logger.warning(f"Failed to initialize LangSmith tracer: {e}")

    def set_cost_context(
        self, edition_id: str = None, operation_type: str = None, job_id: str = None, user_id: str = None
    ):
        """Set cost tracking context for all subsequent AI calls"""
        self._cost_context.update(
            {"edition_id": edition_id, "operation_type": operation_type, "job_id": job_id, "user_id": user_id}
        )
        logger.debug(f"Cost context updated: {self._cost_context}")

    def clear_cost_context(self):
        """Clear cost tracking context"""
        self._cost_context = {"edition_id": None, "operation_type": None, "job_id": None, "user_id": None}

    def _get_cost_metadata(self, step_name: str = None):
        """Get current cost tracking metadata for LangSmith"""
        metadata = {k: v for k, v in self._cost_context.items() if v is not None}
        if step_name:
            metadata["step_name"] = step_name
        return metadata

    # v2 langsmith run
    @asynccontextmanager
    async def _create_langsmith_run(self, name: str, inputs: dict[str, Any], run_type: str = "llm"):
        """Context manager for LangSmith run lifecycle management"""
        if not self.langsmith_client:
            yield None
            return

        run = None
        try:
            run = self.langsmith_client.create_run(
                name=name,
                run_type=run_type,
                inputs=inputs,
                project_name=os.getenv("LANGSMITH_PROJECT", "Default Project"),
            )
            logger.debug(f"Created LangSmith run: {run.id} for {name}")
            yield run
        except Exception as e:
            logger.warning(f"Failed to create LangSmith run for {name}: {e}")
            yield None
        finally:
            if run:
                try:
                    if not hasattr(run, "end_time") or run.end_time is None:
                        run.end()
                    if hasattr(run, "post"):
                        run.post()
                except Exception as e:
                    logger.warning(f"Failed to properly close LangSmith run {run.id}: {e}")

    # v1 langsmith run
    def _log_to_langsmith(
        self, step_name: str, inputs: dict[str, Any], outputs: dict[str, Any], metadata: dict[str, Any] = None
    ):
        """Manually log to LangSmith if tracer is available"""
        if not self.langsmith_tracer:
            return
        try:
            logger.debug(f"Would log to LangSmith: {step_name}")
        except Exception as e:
            logger.warning(f"Failed to log to LangSmith: {e}")

    def _prepare_llm_config(self, config_dict: dict[str, Any]) -> LLMConfig:
        logger.debug(f"Preparing LLM config from dict: {config_dict}")
        provider_str_or_enum = config_dict.get("provider")
        if not provider_str_or_enum:
            raise ValueError("LLM provider must be specified in config_dict.")
        try:
            provider = LLMProvider(str(provider_str_or_enum))
            logger.debug(f"Provider coerced to Enum: {provider}")
        except ValueError:
            logger.error(f"Invalid LLM provider value during coercion: {provider_str_or_enum}")
            raise ValueError(f"Invalid LLM provider value: {provider_str_or_enum}")

        final_config_data = config_dict.copy()
        final_config_data["provider"] = provider

        platform = resolve_platform(provider, config_dict)
        final_config_data["platform"] = platform
        uses_cloud_platform = platform in ("vertex", "bedrock")

        api_key_env_vars = {
            LLMProvider.OPENAI: "OPENAI_API_KEY",
            LLMProvider.ANTHROPIC: "ANTHROPIC_API_KEY",
            LLMProvider.AZURE_OPENAI: "AZURE_OPENAI_API_KEY",
            LLMProvider.GROQ: "GROQ_API_KEY",
            LLMProvider.GOOGLE: "GEMINI_API_KEY",
            LLMProvider.GROK: "GROK_API_KEY",
            LLMProvider.PERPLEXITY: "PERPLEXITY_API_KEY",
            LLMProvider.CUSTOM: None,
        }
        api_key = final_config_data.get("api_key")
        api_key_env_var = api_key_env_vars.get(provider)

        if not api_key and api_key_env_var:
            api_key = os.environ.get(api_key_env_var)
            if api_key:
                logger.debug(f"Using API key from env var '{api_key_env_var}' for {provider.value}.")

        # Cloud platforms (Vertex AI, Bedrock) use IAM auth, not API keys
        if uses_cloud_platform:
            logger.debug(f"Platform '{platform}' uses cloud IAM auth — skipping API key requirement for {provider.value}")
        elif provider == LLMProvider.GOOGLE and not api_key:
            raise ValueError(f"API key for {provider.value} not found in config_dict or env var '{api_key_env_var}'.")
        elif provider == LLMProvider.GROK and not api_key:
            raise ValueError(f"API key for {provider.value} not found in config_dict or env var '{api_key_env_var}'.")
        elif provider == LLMProvider.PERPLEXITY and not api_key:
            raise ValueError(f"API key for {provider.value} not found in config_dict or env var '{api_key_env_var}'.")
        elif (
            provider != LLMProvider.GOOGLE
            and provider != LLMProvider.CUSTOM
            and provider != LLMProvider.GROK
            and provider != LLMProvider.PERPLEXITY
            and not api_key
        ):
            raise ValueError(f"API key for {provider.value} not found in config_dict or env var '{api_key_env_var}'.")

        final_config_data["api_key"] = api_key

        try:
            llm_config_obj = LLMConfig(**final_config_data)
            logger.debug(f"LLMConfig prepared successfully for provider: {llm_config_obj.provider} (platform: {platform})")
            return llm_config_obj
        except (ValidationError, TypeError, Exception) as e:
            logger.error(f"Invalid LLM configuration dictionary: {final_config_data}. Error: {e}", exc_info=True)
            raise ValueError(f"Invalid LLM configuration: {e}") from e

    def get_llm_instance(self, config_dict: dict[str, Any]) -> BaseChatModel:
        """
        Instantiates and returns a LangChain BaseChatModel based on the provider config.
        Handles API key loading from environment variables.
        """
        logger.debug(f"Getting LangChain LLM instance for config: {config_dict}")
        config: LLMConfig = self._prepare_llm_config(config_dict)

        try:
            common_params = {
                "temperature": config.temperature,
                "max_output_tokens": config.max_tokens,  # Renamed for Gemini
                # "max_tokens": config.max_tokens, # Keep original if needed for others
            }
            # Filter out None values, adjust key names if needed per provider
            common_params_filtered = {k: v for k, v in common_params.items() if v is not None}

            model_kwargs = {}
            if config.top_p is not None:
                model_kwargs["top_p"] = config.top_p
            # Add other common kwargs if needed

            # Handle JSON mode for providers that support it via LangChain wrappers
            if config.json_mode and config.provider in [
                LLMProvider.OPENAI,
                LLMProvider.AZURE_OPENAI,
                LLMProvider.GROQ,
                LLMProvider.GROK,
            ]:
                model_kwargs["response_format"] = {"type": "json_object"}
            #  logger.info(f"Enabling JSON mode via model_kwargs for LangChain {config.provider.value} model.")
            # NOTE: LangChain's ChatGoogleGenerativeAI handles JSON mode differently (via structured output usually)
            # or specific prompting, not typically via model_kwargs['response_format'].

            if config.provider == LLMProvider.OPENAI:
                logger.info(f"Instantiating ChatOpenAI: {config.model_name}")
                # Ensure max_tokens is used if present, not max_output_tokens for OpenAI
                openai_params = common_params_filtered.copy()
                if "max_output_tokens" in openai_params:
                    openai_params["max_tokens"] = openai_params.pop("max_output_tokens")
                return ChatOpenAI(
                    model=config.model_name, api_key=config.api_key, model_kwargs=model_kwargs, **openai_params
                )

            elif config.provider == LLMProvider.AZURE_OPENAI:
                logger.info(f"Instantiating AzureChatOpenAI deployment: {config.deployment_id or config.model_name}")
                if not config.api_base:
                    raise ValueError("Azure OpenAI requires 'api_base' (endpoint).")
                # Ensure max_tokens is used if present, not max_output_tokens for Azure
                azure_params = common_params_filtered.copy()
                if "max_output_tokens" in azure_params:
                    azure_params["max_tokens"] = azure_params.pop("max_output_tokens")
                return AzureChatOpenAI(
                    azure_deployment=config.deployment_id or config.model_name,
                    openai_api_version=config.api_version or "2024-02-01",
                    azure_endpoint=config.api_base,
                    api_key=config.api_key,
                    model_kwargs=model_kwargs,
                    **azure_params,
                )
            elif config.provider == LLMProvider.ANTHROPIC:
                platform = config.platform or resolve_platform(LLMProvider.ANTHROPIC, config_dict)
                anthropic_params = common_params_filtered.copy()
                if "max_output_tokens" in anthropic_params:
                    anthropic_params["max_tokens"] = anthropic_params.pop("max_output_tokens")

                if "max_tokens" not in anthropic_params:
                    anthropic_params["max_tokens"] = 4096
                if config.top_p is not None:
                    anthropic_params["top_p"] = config.top_p

                enable_cache = config_dict.get("enable_cache", True)
                if enable_cache:
                    logger.debug(f"Anthropic prompt caching enabled for {config.model_name}")

                if platform == "vertex":
                    from langchain_google_vertexai import ChatAnthropicVertex

                    gcp_project = os.getenv("GCP_PROJECT_ID")
                    gcp_location = os.getenv("GCP_LOCATION", "us-east5")
                    logger.info(f"Instantiating ChatAnthropicVertex: {config.model_name} (project={gcp_project}, location={gcp_location})")
                    return ChatAnthropicVertex(
                        model_name=config.model_name,
                        project=gcp_project,
                        location=gcp_location,
                        **anthropic_params,
                    )
                elif platform == "bedrock":
                    from langchain_aws import ChatBedrockConverse

                    bedrock_model_id = get_bedrock_model_id(config.model_name)
                    aws_region = os.getenv("AWS_REGION", "us-east-1")
                    logger.info(f"Instantiating ChatBedrockConverse: {bedrock_model_id} (region={aws_region})")
                    return ChatBedrockConverse(
                        model=bedrock_model_id,
                        region_name=aws_region,
                        **anthropic_params,
                    )
                else:
                    logger.info(f"Instantiating ChatAnthropic: {config.model_name} (platform=direct)")
                    return ChatAnthropic(model=config.model_name, anthropic_api_key=config.api_key, **anthropic_params)
            elif config.provider == LLMProvider.GROQ:
                logger.info(f"Instantiating ChatGroq: {config.model_name}")
                # Ensure max_tokens is used if present, not max_output_tokens for Groq
                groq_params = common_params_filtered.copy()
                if "max_output_tokens" in groq_params:
                    groq_params["max_tokens"] = groq_params.pop("max_output_tokens")
                return ChatGroq(
                    model=config.model_name, groq_api_key=config.api_key, model_kwargs=model_kwargs, **groq_params
                )

            elif config.provider == LLMProvider.GROK:
                logger.info(f"Instantiating ChatXAI (Grok): {config.model_name}")
                # Ensure max_tokens is used if present, not max_output_tokens for Grok
                grok_params = common_params_filtered.copy()
                if "max_output_tokens" in grok_params:
                    grok_params["max_tokens"] = grok_params.pop("max_output_tokens")

                # REMOVE max_tokens completely if None for unlimited generation
                if grok_params.get("max_tokens") is None:
                    grok_params.pop("max_tokens", None)
                    logger.info("Grok: Removing max_tokens limit for unlimited generation")

                return ChatXAI(
                    model=config.model_name, api_key=config.api_key, model_kwargs=model_kwargs, **grok_params
                )

            elif config.provider == LLMProvider.GOOGLE:
                platform = config.platform or resolve_platform(LLMProvider.GOOGLE, config_dict)
                google_params = common_params_filtered.copy()
                if config.top_p is not None:
                    google_params["top_p"] = config.top_p

                if platform == "vertex":
                    gcp_project = os.getenv("GCP_PROJECT_ID")
                    gcp_location = os.getenv("GCP_LOCATION", "us-central1")
                    sa_json = os.getenv("HOWTHEF_VERTEX_SERVICE_ACCOUNT_JSON") or os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
                    vertex_kwargs: dict[str, Any] = {
                        "model": config.model_name,
                        "project": gcp_project,
                        "location": gcp_location,
                        **google_params,
                    }
                    if sa_json:
                        import json as _json
                        from google.oauth2 import service_account as _sa
                        sa_info = _json.loads(sa_json)
                        creds = _sa.Credentials.from_service_account_info(
                            sa_info, scopes=["https://www.googleapis.com/auth/cloud-platform"]
                        )
                        vertex_kwargs["credentials"] = creds
                        logger.info(f"Instantiating ChatGoogleGenerativeAI (Vertex): {config.model_name} (project={gcp_project}, location={gcp_location}, SA credentials)")
                    else:
                        logger.info(f"Instantiating ChatGoogleGenerativeAI (Vertex): {config.model_name} (project={gcp_project}, location={gcp_location}, ADC)")
                    return ChatGoogleGenerativeAI(**vertex_kwargs)
                else:
                    logger.info(f"Instantiating ChatGoogleGenerativeAI: {config.model_name} (platform=direct)")
                    if not config.api_key:
                        logger.warning(
                            f"API key for {config.provider.value} not found in config, relying on env var GOOGLE_API_KEY or ADC."
                        )
                    return ChatGoogleGenerativeAI(
                        model=config.model_name,
                        google_api_key=config.api_key,
                        **google_params,
                    )

            elif config.provider == LLMProvider.PERPLEXITY:
                logger.info(f"Instantiating Perplexity (OpenAI-compatible): {config.model_name}")
                perplexity_params = common_params_filtered.copy()
                if "max_output_tokens" in perplexity_params:
                    perplexity_params["max_tokens"] = perplexity_params.pop("max_output_tokens")
                return ChatOpenAI(
                    model=config.model_name,
                    api_key=config.api_key,
                    base_url="https://api.perplexity.ai",
                    **perplexity_params,
                )

            else:
                raise NotImplementedError(
                    f"LangChain LLM instance for provider '{config.provider.value}' not implemented in get_llm_instance."
                )

        except ImportError as ie:
            logger.error(f"Missing LangChain integration package for provider {config.provider.value}: {ie}")
            raise ValueError(f"Missing package for {config.provider.value}.") from ie
        except Exception as e:
            logger.exception(
                f"Unexpected error getting LangChain LLM instance for {config.provider.value}: {e}", exc_info=True
            )
            raise ValueError(f"Failed to get LangChain LLM instance for {config.provider.value}: {e}") from e

    ### CODE CHANGES START ###
    @traceable(run_type="llm", name="Perplexity Native API")
    async def _invoke_perplexity_native_structured(
        self,
        config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        run_tree_override: Any | None = None,
    ) -> str:
        step_name_for_logs = f"Perplexity Native ({config.model_name})"
        run_tree = run_tree_override
        run_id_for_log = (
            str(run_tree.id) if run_tree and hasattr(run_tree, "id") else "N/A (LS run not provided/active)"
        )

        logger.info(
            f"Invoking {step_name_for_logs} - Run: {run_id_for_log}. JSON output requested (will validate against {output_schema.__name__} post-call)."
        )

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        log_dir = "debug_logs"
        os.makedirs(log_dir, exist_ok=True)

        # Log full prompt messages to file only (not console to avoid log pollution)
        prompt_content_for_file_lines = []
        total_prompt_chars = 0
        for i, msg in enumerate(prompt_messages):
            if isinstance(msg.content, list):
                content_log = json.dumps(
                    [part if isinstance(part, dict) else {"type": "text", "text": str(part)} for part in msg.content],
                    indent=2,
                )
            else:
                content_log = str(msg.content)
            total_prompt_chars += len(content_log)
            prompt_content_for_file_lines.append(
                f"Message {i+1} ({type(msg).__name__}):\n{content_log}\n--- END OF MESSAGE {i+1} ---\n\n"
            )
        logger.debug(
            f"[{step_name_for_logs}] Prompt prepared: {len(prompt_messages)} messages, {total_prompt_chars:,} chars"
        )

        # Debug file writing
        try:
            debug_prompt_filename = f"{log_dir}/prompt_{timestamp}_{step_name_for_logs.replace('(', '').replace(')', '').replace(' ', '_')}.txt"
            with open(debug_prompt_filename, "w") as f_prompt_debug:
                f_prompt_debug.write(
                    f"PERPLEXITY NATIVE PROMPT - {config.model_name} - {timestamp}\nRUN_ID_FOR_LOG: {run_id_for_log}\n\n"
                )
                f_prompt_debug.writelines(prompt_content_for_file_lines)
            logger.debug(f"Debug prompt saved to {debug_prompt_filename}")
        except Exception as e_file_prompt_debug:
            logger.debug(f"Failed to write debug log file for prompt: {e_file_prompt_debug}")

        if not config.api_key:
            error_msg_apikey_native = "Perplexity API Key is missing for native SDK call."
            raise ValueError(error_msg_apikey_native)

        # Initialize OpenAI client with Perplexity endpoint
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=config.api_key, base_url="https://api.perplexity.ai")
            logger.debug(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] OpenAI client initialized successfully for Perplexity endpoint."
            )
        except Exception as client_init_err:
            error_msg_client = f"Failed to initialize OpenAI client for Perplexity: {str(client_init_err)}"
            logger.exception(error_msg_client, exc_info=True)
            raise ValueError(error_msg_client) from client_init_err

        # Convert LangChain messages to OpenAI format
        openai_messages = []
        for msg in prompt_messages:
            role = "user"
            if isinstance(msg, AIMessage):
                role = "assistant"
            elif isinstance(msg, SystemMessage):
                role = "system"

            content = msg.content
            if isinstance(content, list):
                # Handle multimodal content
                formatted_content = []
                for part in content:
                    if isinstance(part, dict):
                        if part.get("type") == "text":
                            formatted_content.append({"type": "text", "text": part.get("text", "")})
                        elif part.get("type") == "image_url":
                            formatted_content.append(part)  # Pass through image content
                    else:
                        formatted_content.append({"type": "text", "text": str(part)})
                content = formatted_content

            openai_messages.append({"role": role, "content": content})

        # Prepare request parameters
        request_params = {
            "model": config.model_name,
            "messages": openai_messages,
        }

        if config.temperature is not None:
            request_params["temperature"] = config.temperature
        if config.max_tokens is not None:
            request_params["max_tokens"] = config.max_tokens
        if config.top_p is not None:
            request_params["top_p"] = config.top_p

        # Add JSON mode if requested (some Perplexity models support this)
        if config.json_mode:
            request_params["response_format"] = {"type": "json_object"}

        llm_output_content = None
        sdk_response = None

        try:
            logger.debug(f"[{step_name_for_logs} - Run: {run_id_for_log}] Sending request via Perplexity API...")

            sdk_response = await client.chat.completions.create(**request_params)

            # Response processing
            if not sdk_response.choices:
                error_msg_no_choices = "Perplexity API returned no choices."
                logger.error(
                    f"[{step_name_for_logs} - Run: {run_id_for_log}] {error_msg_no_choices}. Full response: {sdk_response}"
                )
                raise ValueError(error_msg_no_choices)

            first_choice = sdk_response.choices[0]
            if first_choice.message and first_choice.message.content:
                llm_output_content = first_choice.message.content

            finish_reason = first_choice.finish_reason or "UNKNOWN"

            if llm_output_content is None or not llm_output_content.strip():
                error_msg_empty_content = f"Perplexity API returned no non-empty text. Finish Reason: {finish_reason}."
                if finish_reason == "length":
                    error_msg_empty_content += " Stopped due to max token limit. Response may be truncated."
                elif finish_reason == "content_filter":
                    error_msg_empty_content += " Content possibly blocked due to content filters."
                logger.error(
                    f"[{step_name_for_logs} - Run: {run_id_for_log}] {error_msg_empty_content}. Full choice: {first_choice}"
                )
                raise ValueError(error_msg_empty_content)

            logger.info(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Perplexity native SDK call successful. Raw response length: {len(llm_output_content)}. Finish Reason: {finish_reason}"
            )
            if finish_reason == "length":
                logger.warning(
                    f"[{step_name_for_logs} - Run: {run_id_for_log}] POTENTIAL TRUNCATION: Perplexity response finished due to length limit. Output may be incomplete."
                )

            # Response logging (shortened for cleaner logs)
            response_preview = llm_output_content[:200] + "..." if len(llm_output_content) > 200 else llm_output_content
            logger.info(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Response: {len(llm_output_content)} chars. Preview: {response_preview}"
            )

            debug_response_filename = f"{log_dir}/response_{timestamp}_{step_name_for_logs.replace('(', '').replace(')', '').replace(' ', '_')}.txt"
            try:
                with open(debug_response_filename, "w") as f_resp_debug:
                    f_resp_debug.write(
                        f"PERPLEXITY NATIVE RESPONSE - {config.model_name} - {timestamp}\nRUN_ID_FOR_LOG: {run_id_for_log}\nFINISH_REASON: {finish_reason}\n\n"
                    )
                    f_resp_debug.write(llm_output_content)
                logger.debug(f"Debug response saved to {debug_response_filename}")
            except Exception as e_file_resp_debug:
                logger.debug(f"Failed to write debug log file for response: {e_file_resp_debug}")

            return llm_output_content

        except ValueError as ve:
            logger.error(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Caught ValueError during Perplexity native SDK call: {ve}"
            )
            raise ve
        except Exception as e_sdk:
            error_type_sdk = type(e_sdk).__name__
            error_message_sdk = f"Perplexity native SDK call failed ({error_type_sdk}): {str(e_sdk)}"
            logger.exception(f"[{step_name_for_logs} - Run: {run_id_for_log}] {error_message_sdk}", exc_info=True)
            raise ValueError(error_message_sdk) from e_sdk

    ### CODE CHANGES FINISH ###

    # @traceable(run_type="llm", name="Google GenAI Native Call")
    @traceable(run_type="llm", name="Google Gemini Native API")
    async def _invoke_google_native_structured(
        self,
        config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        run_tree_override: Any | None = None,
    ) -> str:
        step_name_for_logs = f"Google Native ({config.model_name})"
        run_tree = run_tree_override
        run_id_for_log = (
            str(run_tree.id) if run_tree and hasattr(run_tree, "id") else "N/A (LS run not provided/active)"
        )

        logger.info(
            f"Invoking {step_name_for_logs} - Run: {run_id_for_log}. JSON output requested (will validate against {output_schema.__name__} post-call)."
        )

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        log_dir = "debug_logs"
        os.makedirs(log_dir, exist_ok=True)

        # Log full prompt messages to file only (not console to avoid log pollution)
        prompt_content_for_file_lines = []
        total_prompt_chars = 0
        for i, msg in enumerate(prompt_messages):
            if isinstance(msg.content, list):
                content_log = json.dumps(
                    [part if isinstance(part, dict) else {"type": "text", "text": str(part)} for part in msg.content],
                    indent=2,
                )
            else:
                content_log = str(msg.content)
            total_prompt_chars += len(content_log)
            prompt_content_for_file_lines.append(
                f"Message {i+1} ({type(msg).__name__}):\n{content_log}\n--- END OF MESSAGE {i+1} ---\n\n"
            )
        logger.debug(
            f"[{step_name_for_logs}] Prompt prepared: {len(prompt_messages)} messages, {total_prompt_chars:,} chars"
        )

        # Debug file writing (unchanged)
        try:
            debug_prompt_filename = f"{log_dir}/prompt_{timestamp}_{step_name_for_logs.replace('(', '').replace(')', '').replace(' ', '_')}.txt"
            with open(debug_prompt_filename, "w") as f_prompt_debug:
                f_prompt_debug.write(
                    f"GOOGLE NATIVE PROMPT - {config.model_name} - {timestamp}\nRUN_ID_FOR_LOG: {run_id_for_log}\n\n"
                )
                f_prompt_debug.writelines(prompt_content_for_file_lines)
            logger.debug(f"Debug prompt saved to {debug_prompt_filename}")
        except Exception as e_file_prompt_debug:
            logger.debug(f"Failed to write debug log file for prompt: {e_file_prompt_debug}")

        platform = config.platform or resolve_platform(LLMProvider.GOOGLE)

        if platform != "vertex" and not config.api_key:
            error_msg_apikey_native = "Google API Key is missing for native SDK call."
            raise ValueError(error_msg_apikey_native)

        try:
            if platform == "vertex":
                gcp_project = os.getenv("GCP_PROJECT_ID")
                gcp_location = os.getenv("GCP_LOCATION", "us-central1")
                sa_json = os.getenv("HOWTHEF_VERTEX_SERVICE_ACCOUNT_JSON") or os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
                if sa_json:
                    import json as _json
                    from google.oauth2 import service_account as _sa
                    sa_info = _json.loads(sa_json)
                    creds = _sa.Credentials.from_service_account_info(
                        sa_info, scopes=["https://www.googleapis.com/auth/cloud-platform"]
                    )
                    client = genai.Client(vertexai=True, project=gcp_project, location=gcp_location, credentials=creds)
                    logger.debug(f"[{step_name_for_logs}] genai.Client initialized for Vertex AI (SA JSON, project={gcp_project})")
                else:
                    client = genai.Client(vertexai=True, project=gcp_project, location=gcp_location)
                    logger.debug(f"[{step_name_for_logs}] genai.Client initialized for Vertex AI (ADC, project={gcp_project}, location={gcp_location})")
            else:
                client = genai.Client(api_key=config.api_key)
                logger.debug(f"[{step_name_for_logs} - Run: {run_id_for_log}] genai.Client initialized (platform=direct)")
        except Exception as client_init_err:
            error_msg_client = f"Failed to initialize genai.Client: {str(client_init_err)}"
            logger.exception(error_msg_client, exc_info=True)
            raise ValueError(error_msg_client) from client_init_err

        # Convert LangChain messages to Google format (unchanged)
        google_formatted_messages = []
        system_instruction_parts = []

        for msg in prompt_messages:
            role = "user"
            content_parts = []
            current_msg_content = msg.content

            if isinstance(current_msg_content, str):
                if current_msg_content.strip():
                    content_parts.append(genai_types.Part.from_text(text=current_msg_content))
            elif isinstance(current_msg_content, list):
                for part_item in current_msg_content:
                    if isinstance(part_item, dict):
                        if part_item.get("type") == "text":
                            text_val = part_item.get("text", "")
                            if text_val.strip():
                                content_parts.append(genai_types.Part.from_text(text=text_val))
                        elif part_item.get("type") == "image_url":
                            img_url = part_item.get("image_url", {}).get("url", "")
                            if img_url.startswith("data:"):
                                import base64 as _b64

                                header, b64_data = img_url.split(",", 1)
                                mime = header.split(":")[1].split(";")[0]
                                content_parts.append(
                                    genai_types.Part.from_bytes(
                                        data=_b64.b64decode(b64_data),
                                        mime_type=mime,
                                    )
                                )
                    elif isinstance(part_item, str):
                        if part_item.strip():
                            content_parts.append(genai_types.Part.from_text(text=part_item))
            else:
                content_str = str(current_msg_content)
                if content_str.strip():
                    ### CODE CHANGES START ###
                    content_parts.append(genai_types.Part.from_text(text=content_str))
                    ### CODE CHANGES FINISH ###

            if not content_parts:
                logger.warning(f"Skipping message of type {type(msg).__name__} due to empty content after processing.")
                continue

            if isinstance(msg, AIMessage):
                role = "model"
            elif isinstance(msg, SystemMessage):
                system_instruction_parts.extend(content_parts)
                continue

            google_formatted_messages.append(genai_types.Content(role=role, parts=content_parts))

        ### CODE CHANGES START ###
        # FIXED: Use correct GenerateContentConfig instead of GenerationConfig
        generation_config_args = {}
        if config.temperature is not None:
            generation_config_args["temperature"] = config.temperature
        if config.max_tokens is not None:
            generation_config_args["max_output_tokens"] = config.max_tokens
        if config.top_p is not None:
            generation_config_args["top_p"] = config.top_p
        # Always use JSON mode for Gemini structured output — this method is only
        # called from _invoke_structured_output_core, so an output_schema is always present.
        generation_config_args["response_mime_type"] = "application/json"
        raw_schema = output_schema.model_json_schema()
        generation_config_args["response_schema"] = _sanitize_schema_for_gemini(raw_schema)

        final_gen_config_args = {k: v for k, v in generation_config_args.items() if v is not None}
        generation_config = genai_types.GenerateContentConfig(**final_gen_config_args)

        # Add system instruction if present
        if system_instruction_parts:
            generation_config.system_instruction = genai_types.Content(parts=system_instruction_parts, role="system")
        ### CODE CHANGES FINISH ###

        llm_output_content = None
        sdk_response = None

        try:
            logger.debug(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Sending request via client.models.generate_content..."
            )

            ### CODE CHANGES START ###
            # FIXED: Use the correct client.aio.models.generate_content API
            sdk_response = await client.aio.models.generate_content(
                model=config.model_name,
                contents=google_formatted_messages,
                config=generation_config,
            )
            ### CODE CHANGES FINISH ###

            # Response processing (unchanged)
            if not sdk_response.candidates:
                error_msg_no_candidates = "Gemini API returned no candidates."
                prompt_feedback = getattr(sdk_response, "prompt_feedback", None)
                if prompt_feedback and getattr(prompt_feedback, "block_reason", None):
                    reason = prompt_feedback.block_reason_message or prompt_feedback.block_reason
                    error_msg_no_candidates = f"Gemini API request potentially blocked. Reason: {reason}"
                logger.error(
                    f"[{step_name_for_logs} - Run: {run_id_for_log}] {error_msg_no_candidates}. Full response: {sdk_response}"
                )
                raise ValueError(error_msg_no_candidates)

            first_candidate = sdk_response.candidates[0]
            if first_candidate.content and first_candidate.content.parts:
                for part in first_candidate.content.parts:
                    if hasattr(part, "text") and part.text:
                        llm_output_content = part.text
                        break

            finish_reason_val = str(getattr(first_candidate, "finish_reason", "UNKNOWN")).upper()

            if llm_output_content is None or not llm_output_content.strip():
                safety_ratings_val = str(getattr(first_candidate, "safety_ratings", "N/A"))
                error_msg_empty_content = f"Gemini API returned no non-empty text. Finish Reason: {finish_reason_val}."
                if finish_reason_val == "SAFETY":
                    error_msg_empty_content += " Content possibly blocked due to safety filters."
                elif finish_reason_val == "RECITATION":
                    error_msg_empty_content += " Blocked due to potential recitation."
                elif finish_reason_val == "MAX_TOKENS":
                    error_msg_empty_content += " Stopped due to max token limit. Response may be truncated."
                elif finish_reason_val == "OTHER":
                    error_msg_empty_content += " Response blocked for other reasons."
                logger.error(
                    f"[{step_name_for_logs} - Run: {run_id_for_log}] {error_msg_empty_content}. Safety Ratings: {safety_ratings_val}. Full candidate: {first_candidate}"
                )
                raise ValueError(error_msg_empty_content)

            logger.info(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Google native SDK call successful. Raw response length: {len(llm_output_content)}. Finish Reason: {finish_reason_val}"
            )
            if finish_reason_val == "MAX_TOKENS":
                logger.warning(
                    f"[{step_name_for_logs} - Run: {run_id_for_log}] POTENTIAL TRUNCATION: Gemini response finished due to MAX_TOKENS. Output may be incomplete."
                )

            # logger.info(f"[{step_name_for_logs} - Run: {run_id_for_log}] ===== START FULL UNTRUNCATED RESPONSE =====")
            # logger.info(f"{llm_output_content}")
            # logger.info(f"[{step_name_for_logs} - Run: {run_id_for_log}] ===== END FULL UNTRUNCATED RESPONSE =====")
            # # Response logging (shortened for cleaner logs)
            response_preview = llm_output_content[:200] + "..." if len(llm_output_content) > 200 else llm_output_content
            logger.info(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Response: {len(llm_output_content)} chars. Preview: {response_preview}"
            )

            debug_response_filename = f"{log_dir}/response_{timestamp}_{step_name_for_logs.replace('(', '').replace(')', '').replace(' ', '_')}.txt"
            try:
                with open(debug_response_filename, "w") as f_resp_debug:
                    f_resp_debug.write(
                        f"GOOGLE NATIVE RESPONSE - {config.model_name} - {timestamp}\nRUN_ID_FOR_LOG: {run_id_for_log}\nFINISH_REASON: {finish_reason_val}\n\n"
                    )
                    f_resp_debug.write(llm_output_content)
                logger.debug(f"Debug response saved to {debug_response_filename}")
            except Exception as e_file_resp_debug:
                logger.debug(f"Failed to write debug log file for response: {e_file_resp_debug}")

            return llm_output_content

        except ValueError as ve:
            logger.error(
                f"[{step_name_for_logs} - Run: {run_id_for_log}] Caught ValueError during Google native SDK call: {ve}"
            )
            raise ve
        except Exception as e_sdk:
            error_type_sdk = type(e_sdk).__name__
            error_message_sdk = f"Google native SDK call failed ({error_type_sdk}): {str(e_sdk)}"
            logger.exception(f"[{step_name_for_logs} - Run: {run_id_for_log}] {error_message_sdk}", exc_info=True)
            if sdk_response and hasattr(sdk_response, "prompt_feedback") and sdk_response.prompt_feedback:
                if getattr(sdk_response.prompt_feedback, "block_reason", None):
                    blocked_reason_sdk = (
                        sdk_response.prompt_feedback.block_reason_message or sdk_response.prompt_feedback.block_reason
                    )
                    raise ValueError(f"Gemini API request potentially blocked. Reason: {blocked_reason_sdk}") from e_sdk
            raise ValueError(error_message_sdk) from e_sdk

    # =========================================================================
    # ANTHROPIC NATIVE API - WITH EXTENDED THINKING + PROMPT CACHING SUPPORT
    # =========================================================================

    @traceable(run_type="llm", name="Anthropic Native API (Enhanced)")
    async def _invoke_anthropic_native_structured(
        self,
        llm_config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        enable_thinking: bool = False,
        thinking_budget_tokens: int = 8000,
        enable_cache: bool = False,
        cache_ttl: str = "5m",
        step_name: str = "anthropic_native",
    ) -> str:
        """
        Invoke Anthropic Messages API with optional extended thinking and prompt caching.

        This is the unified Anthropic method - all features are opt-in with sensible defaults.
        Existing callers don't need to change anything.

        Args:
            config: LLM configuration (must have provider=anthropic)
            prompt_messages: LangChain messages
            output_schema: Pydantic model for reference (not forced - use JSON instructions in prompt)
            enable_thinking: Enable extended thinking for complex reasoning (default: False)
            thinking_budget_tokens: Token budget for thinking, min 1024 (default: 8000)
            enable_cache: Enable prompt caching for system messages (default: False)
            cache_ttl: Cache TTL - "5m" (default) or "1h" (extended, requires beta)
            step_name: Name for logging and debug files

        Returns:
            Raw text response from Claude (may contain JSON if prompted)

        Notes:
            - Extended thinking CANNOT use forced tool_choice - only "auto" or "none"
            - When thinking enabled, max_tokens must exceed thinking_budget_tokens
            - When thinking enabled, temperature is forced to 1.0 by API
            - Cache requires minimum tokens: 1024 (Sonnet), 4096 (Opus/Haiku)
            - First request with caching costs 1.25x (write), subsequent 0.1x (read)
        """
        if AsyncAnthropic is None:
            raise ValueError("anthropic SDK not installed. Run: pip install anthropic")

        step_name_for_logs = f"Anthropic Native ({llm_config.model_name})"

        # Validate thinking configuration
        if enable_thinking:
            if thinking_budget_tokens < 1024:
                logger.warning(
                    f"[{step_name_for_logs}] thinking_budget_tokens ({thinking_budget_tokens}) below minimum 1024, adjusting"
                )
                thinking_budget_tokens = 1024

            # max_tokens must exceed thinking budget
            effective_max_tokens = llm_config.max_tokens or 4096
            if effective_max_tokens <= thinking_budget_tokens:
                effective_max_tokens = thinking_budget_tokens + 4096
                logger.info(
                    f"[{step_name_for_logs}] Adjusted max_tokens to {effective_max_tokens} (must exceed thinking budget)"
                )
        else:
            effective_max_tokens = llm_config.max_tokens or 4096

        logger.info(
            f"Invoking {step_name_for_logs} | "
            f"thinking={'enabled' if enable_thinking else 'disabled'} "
            f"(budget={thinking_budget_tokens if enable_thinking else 'N/A'}) | "
            f"cache={'enabled' if enable_cache else 'disabled'} | "
            f"max_tokens={effective_max_tokens}"
        )

        # Debug logging setup
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        log_dir = "debug_logs"
        os.makedirs(log_dir, exist_ok=True)

        # Initialize client based on platform
        platform = llm_config.platform or resolve_platform(LLMProvider.ANTHROPIC)
        if platform == "vertex":
            if AsyncAnthropicVertex is None:
                raise ValueError("anthropic[vertex] not installed. Run: pip install anthropic[vertex]")
            gcp_project = os.getenv("GCP_PROJECT_ID")
            gcp_region = os.getenv("GCP_LOCATION", "us-east5")
            client = AsyncAnthropicVertex(project_id=gcp_project, region=gcp_region)
            logger.info(f"[{step_name_for_logs}] Using AsyncAnthropicVertex (project={gcp_project}, region={gcp_region})")
        elif platform == "bedrock":
            if AsyncAnthropicBedrock is None:
                raise ValueError("anthropic[bedrock] not installed. Run: pip install anthropic[bedrock]")
            aws_region = os.getenv("AWS_REGION", "us-east-1")
            client = AsyncAnthropicBedrock(aws_region=aws_region)
            logger.info(f"[{step_name_for_logs}] Using AsyncAnthropicBedrock (region={aws_region})")
        else:
            client = AsyncAnthropic(api_key=llm_config.api_key)

        # Prepare messages with optional cache control
        system_parts: list[dict[str, Any]] = []
        messages_list: list[dict[str, Any]] = []

        for msg in prompt_messages:
            if isinstance(msg, SystemMessage):
                content_str = msg.content if isinstance(msg.content, str) else str(msg.content)
                if content_str.strip():
                    part = {"type": "text", "text": content_str}

                    # Add cache control to system messages if enabled
                    # Rough heuristic: 2000 chars ~ 500+ tokens, above 1024 minimum for Sonnet
                    if enable_cache and len(content_str) > 2000:
                        if cache_ttl == "1h":
                            part["cache_control"] = {"type": "ephemeral", "ttl": "1h"}
                        else:
                            part["cache_control"] = {"type": "ephemeral"}
                        logger.debug(f"Added cache_control to system message ({len(content_str)} chars)")

                    system_parts.append(part)
                continue

            # Determine role
            role = "user"
            if isinstance(msg, AIMessage):
                role = "assistant"

            # Build content blocks (text + image support)
            content_blocks: list[dict[str, Any]] = []
            if isinstance(msg.content, list):
                for part in msg.content:
                    if isinstance(part, dict):
                        if part.get("type") == "text":
                            text_val = part.get("text", "")
                            if text_val.strip():
                                content_blocks.append({"type": "text", "text": text_val})
                        elif part.get("type") == "image_url":
                            img_url = part.get("image_url", {}).get("url", "")
                            if img_url.startswith("data:"):
                                header, b64_data = img_url.split(",", 1)
                                mime = header.split(":")[1].split(";")[0]
                                content_blocks.append(
                                    {
                                        "type": "image",
                                        "source": {
                                            "type": "base64",
                                            "media_type": mime,
                                            "data": b64_data,
                                        },
                                    }
                                )
                    elif isinstance(part, str):
                        if part.strip():
                            content_blocks.append({"type": "text", "text": part})
            else:
                content_str = str(msg.content)
                if content_str.strip():
                    content_blocks.append({"type": "text", "text": content_str})

            if content_blocks:
                messages_list.append({"role": role, "content": content_blocks})

        system_content = system_parts if system_parts else None

        # Build request arguments — use Bedrock model ID when on Bedrock platform
        effective_model_name = (
            get_bedrock_model_id(llm_config.model_name) if platform == "bedrock" else llm_config.model_name
        )
        request_args: dict[str, Any] = {
            "model": effective_model_name,
            "messages": messages_list,
            "max_tokens": effective_max_tokens,
        }

        # Add system prompt if present
        if system_content:
            request_args["system"] = system_content

        # Add temperature if specified (will be ignored when thinking enabled)
        if llm_config.temperature is not None and not enable_thinking:
            request_args["temperature"] = llm_config.temperature

        # Add top_p if specified
        if llm_config.top_p is not None and not enable_thinking:
            request_args["top_p"] = llm_config.top_p

        # Configure extended thinking
        if enable_thinking:
            request_args["thinking"] = {"type": "enabled", "budget_tokens": thinking_budget_tokens}
            logger.debug(f"[{step_name_for_logs}] Extended thinking enabled with budget={thinking_budget_tokens}")

        # Build beta headers
        beta_headers = []
        if cache_ttl == "1h":
            beta_headers.append("extended-cache-ttl-2025-04-11")
        beta_headers.append("token-efficient-tools-2025-02-19")

        extra_headers = {}
        if beta_headers:
            extra_headers["anthropic-beta"] = ",".join(beta_headers)

        # Log prompt to debug file
        try:
            debug_prompt_filename = f"{log_dir}/prompt_{timestamp}_{step_name.replace(' ', '_')}_anthropic.txt"
            with open(debug_prompt_filename, "w") as f:
                f.write(f"ANTHROPIC NATIVE PROMPT - {llm_config.model_name} - {timestamp}\n")
                f.write(f"Thinking: {enable_thinking} (budget: {thinking_budget_tokens})\n")
                f.write(f"Cache: {enable_cache} (ttl: {cache_ttl})\n")
                f.write(f"Max Tokens: {effective_max_tokens}\n")
                f.write(f"Beta Headers: {beta_headers}\n\n")
                f.write(f"System:\n{json.dumps(system_content, indent=2)}\n\n")
                f.write(f"Messages:\n{json.dumps(messages_list, indent=2)}\n")
            logger.debug(f"Debug prompt saved to {debug_prompt_filename}")
        except Exception as e:
            logger.debug(f"Failed to write debug prompt: {e}")

        try:
            # Make the API call
            if extra_headers:
                response = await client.messages.create(**request_args, extra_headers=extra_headers)
            else:
                response = await client.messages.create(**request_args)

            # Extract response content
            text_parts: list[str] = []
            thinking_parts: list[str] = []

            for block in response.content:
                block_type = getattr(block, "type", "")
                if block_type == "thinking":
                    thinking_content = getattr(block, "thinking", "")
                    if thinking_content:
                        thinking_parts.append(thinking_content)
                elif block_type == "text":
                    text_content = getattr(block, "text", "")
                    if text_content:
                        text_parts.append(text_content)

            raw_text = "\n".join(text_parts).strip()

            if not raw_text:
                stop_reason = getattr(response, "stop_reason", "unknown")
                raise ValueError(f"Anthropic API returned no text content. Stop reason: {stop_reason}")

            # Log usage and cache statistics
            usage = getattr(response, "usage", None)
            if usage:
                input_tokens = getattr(usage, "input_tokens", 0)
                output_tokens = getattr(usage, "output_tokens", 0)
                cache_creation = getattr(usage, "cache_creation_input_tokens", 0)
                cache_read = getattr(usage, "cache_read_input_tokens", 0)

                logger.info(
                    f"[{step_name_for_logs}] Usage: "
                    f"input={input_tokens}, output={output_tokens}, "
                    f"cache_write={cache_creation}, cache_read={cache_read}"
                )

                # Log cache economics
                if cache_creation > 0:
                    logger.info(
                        f"[{step_name_for_logs}] Cache WRITE: {cache_creation} tokens (1.25x cost, will save 90% on next calls)"
                    )
                if cache_read > 0:
                    savings_pct = (cache_read / (cache_read + input_tokens)) * 100 if input_tokens else 0
                    logger.info(
                        f"[{step_name_for_logs}] Cache HIT: {cache_read} tokens ({savings_pct:.1f}% of input cached)"
                    )

            # Log thinking summary if present
            if thinking_parts:
                total_thinking_chars = sum(len(t) for t in thinking_parts)
                logger.info(
                    f"[{step_name_for_logs}] Thinking: {len(thinking_parts)} blocks, {total_thinking_chars} chars total"
                )
                logger.debug(f"[{step_name_for_logs}] Thinking preview: {thinking_parts[0][:300]}...")

            # Log response
            response_preview = raw_text[:300] + "..." if len(raw_text) > 300 else raw_text
            logger.info(f"[{step_name_for_logs}] Response: {len(raw_text)} chars. Preview: {response_preview}")

            # Save debug response
            try:
                debug_response_filename = f"{log_dir}/response_{timestamp}_{step_name.replace(' ', '_')}_anthropic.txt"
                with open(debug_response_filename, "w") as f:
                    f.write(f"ANTHROPIC NATIVE RESPONSE - {llm_config.model_name} - {timestamp}\n")
                    f.write(f"Stop Reason: {getattr(response, 'stop_reason', 'unknown')}\n")
                    if usage:
                        f.write(f"Input Tokens: {input_tokens}\n")
                        f.write(f"Output Tokens: {output_tokens}\n")
                        f.write(f"Cache Write: {cache_creation}\n")
                        f.write(f"Cache Read: {cache_read}\n")
                    f.write("\n")
                    if thinking_parts:
                        f.write("=== THINKING ===\n")
                        f.write("\n---\n".join(thinking_parts))
                        f.write("\n\n=== RESPONSE ===\n")
                    f.write(raw_text)
                logger.debug(f"Debug response saved to {debug_response_filename}")
            except Exception as e:
                logger.debug(f"Failed to write debug response: {e}")

            return raw_text

        except Exception as e:
            error_type = type(e).__name__
            error_msg = f"Anthropic native call failed ({error_type}): {str(e)}"
            logger.exception(f"[{step_name_for_logs}] {error_msg}", exc_info=True)
            raise ValueError(error_msg) from e

    # v2 improved logging attempt

    async def invoke_structured_output(
        self,
        prompt_messages: list[BaseMessage],
        output_model: type[BaseModel],
        primary_config_dict: dict[str, Any],
        fallback_config_dict: dict[str, Any] | None = None,
        fixer_config_dict: dict[str, Any] | None = None,
        step_name_for_logs: str = "structured_output",
        # Evals parameters (PRIMARY INTEGRATION POINT)
        enable_evals: bool = False,
        evals_config: dict[str, Any] | None = None,
    ) -> tuple[BaseModel, str | None]:
        ### CODE CHANGES START - LangSmith Cost Tracking Enhancement ###
        # Auto-add cost tracking metadata to current LangSmith run
        cost_metadata = self._get_cost_metadata(step_name_for_logs)

        if cost_metadata and self.langsmith_tracer:
            try:
                # Add metadata to current LangSmith context
                from langsmith import get_current_run_tree

                current_run = get_current_run_tree()
                if current_run:
                    # Update current run with cost metadata
                    current_run.extra = {**(current_run.extra or {}), **cost_metadata}

                    # Add structured tags for easy filtering in LangSmith
                    tags = []
                    if cost_metadata.get("edition_id"):
                        tags.append(f"edition:{cost_metadata['edition_id']}")
                    if cost_metadata.get("operation_type"):
                        tags.append(cost_metadata["operation_type"])
                    if cost_metadata.get("user_id"):
                        tags.append(f"user:{cost_metadata['user_id']}")
                    if cost_metadata.get("job_id"):
                        tags.append(f"job:{cost_metadata['job_id']}")

                    # Merge with existing tags
                    current_run.tags = list(set((current_run.tags or []) + tags))

                    logger.debug(f"Added cost tracking metadata to LangSmith run: {cost_metadata}")
            except Exception as e:
                logger.debug(f"Failed to add cost metadata to LangSmith run: {e}")
        ### CODE CHANGES END ###

        # Run the normal method
        result, model_used = await self._invoke_structured_output_core(
            prompt_messages,
            output_model,
            primary_config_dict,
            fallback_config_dict,
            fixer_config_dict,
            step_name_for_logs,
        )

        # Optional posterior evals (NON-BLOCKING, RESILIENT)
        if enable_evals and evals_config:
            try:
                # Import evals service (lazy import to avoid circular dependencies)
                from features.evals.evals_service import evals_service

                # Execute evals with rich operational context
                evals_result = await evals_service.evaluate_response(
                    content=result.model_dump_json(),
                    evals_type=evals_config.get("type", "content_quality"),
                    context=evals_config.get("context", {}),
                    reference_material=evals_config.get("reference", None),
                    # Rich operational context from evals_config
                    agent_name=evals_config.get("agent_name"),
                    agent_version=evals_config.get("agent_version"),
                    workflow_name=evals_config.get("workflow_name"),
                    prompt_version_id=evals_config.get("prompt_version_id"),
                    tags=evals_config.get("tags", []),
                )

                # Store evals results asynchronously (NON-BLOCKING)
                asyncio.create_task(evals_service.storage_service.store_evals_result(evals_result))

            except Exception as e:
                logger.warning(f"Post-evals failed, continuing without it: {e}")

        return result, model_used

    async def _invoke_structured_output_core(
        self,
        prompt_messages: list[BaseMessage],
        output_model: type[BaseModel],
        primary_config_dict: dict[str, Any],
        fallback_config_dict: dict[str, Any] | None,
        fixer_config_dict: dict[str, Any],
        step_name_for_logs: str = "structured_output",
    ) -> tuple[BaseModel, str | None]:
        llm_output_content = None
        last_provider_error = None
        model_used = None

        ### CODE CHANGES START ###
        # Remove all manual LangSmith run creation and management
        # Let LangChain's built-in tracing handle it instead
        ### CODE CHANGES FINISH ###

        primary_config: LLMConfig = self._prepare_llm_config(primary_config_dict)
        primary_provider = primary_config.provider
        primary_model_name = primary_config.model_name

        fallback_model_name = None
        fallback_config = None
        if fallback_config_dict:
            try:
                fallback_config = self._prepare_llm_config(fallback_config_dict)
                fallback_model_name = fallback_config.model_name
            except ValueError as prep_err:
                logger.warning(f"[{step_name_for_logs}] Fallback config invalid, disabling fallback: {prep_err}")
                fallback_config_dict = None
                fallback_config = None

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        log_dir = "debug_logs"
        os.makedirs(log_dir, exist_ok=True)

        # Debug File Writing for Prompt (Done once before any attempt)
        try:
            debug_prompt_filename = f"{log_dir}/prompt_{timestamp}_{step_name_for_logs.replace(' ', '_')}.txt"
            with open(debug_prompt_filename, "w") as f_prompt:
                f_prompt.write(f"STRUCTURED OUTPUT PROMPT - {step_name_for_logs} - {timestamp}\n\n")
                prompt_content_for_file_lines = []
                for i, msg in enumerate(prompt_messages):
                    if isinstance(msg.content, list):
                        content_write = json.dumps(
                            [
                                part if isinstance(part, dict) else {"type": "text", "text": str(part)}
                                for part in msg.content
                            ],
                            indent=2,
                        )
                    else:
                        content_write = str(msg.content)
                    prompt_content_for_file_lines.append(
                        f"Message {i+1} ({type(msg).__name__}):\n{content_write}\n--- END OF MESSAGE {i+1} ---\n\n"
                    )
                f_prompt.writelines(prompt_content_for_file_lines)
            logger.debug(f"Debug prompt saved to {debug_prompt_filename}")
        except Exception as e_file_prompt:
            logger.debug(f"Failed to write debug log file for prompt: {e_file_prompt}")

        ### CODE CHANGES START ###
        # Primary LLM Attempt with rate-limit-aware retry
        ### CODE CHANGES FINISH ###

        _RATE_LIMIT_PHRASES = ("429", "rate limit", "rate_limit", "resource_exhausted", "too many requests", "quota exceeded")
        _RATE_LIMIT_MAX_RETRIES = 3
        _RATE_LIMIT_BACKOFFS = [15, 30, 60]

        for _attempt in range(_RATE_LIMIT_MAX_RETRIES + 1):
            try:
                model_used = primary_model_name
                if _attempt == 0:
                    logger.info(
                        f"[{step_name_for_logs}] Attempting primary LLM: {primary_model_name} ({primary_provider.value})"
                    )

                run_name_prefixed = f"[{primary_provider.value}:{primary_model_name}] {step_name_for_logs}"

                if primary_provider == LLMProvider.GOOGLE:
                    llm_output_content = await self._invoke_google_native_structured(
                        primary_config, prompt_messages, output_model
                    )
                elif primary_provider == LLMProvider.PERPLEXITY:
                    llm_output_content = await self._invoke_perplexity_native_structured(
                        primary_config, prompt_messages, output_model
                    )
                elif primary_provider == LLMProvider.ANTHROPIC:
                    enable_thinking = primary_config_dict.get("enable_thinking", False)
                    enable_cache = primary_config_dict.get("enable_cache", False)

                    if enable_thinking or enable_cache:
                        thinking_budget = primary_config_dict.get("thinking_budget_tokens", 8000)
                        cache_ttl = primary_config_dict.get("cache_ttl", "5m")

                        logger.info(
                            f"[{step_name_for_logs}] Using Anthropic native API (thinking={enable_thinking}, cache={enable_cache})"
                        )

                        llm_output_content = await self._invoke_anthropic_native_structured(
                            llm_config=primary_config,
                            prompt_messages=prompt_messages,
                            output_schema=output_model,
                            enable_thinking=enable_thinking,
                            thinking_budget_tokens=thinking_budget,
                            enable_cache=enable_cache,
                            cache_ttl=cache_ttl,
                            step_name=step_name_for_logs,
                        )
                    else:
                        primary_llm_instance = self.get_llm_instance(primary_config_dict)
                        llm_response = await primary_llm_instance.ainvoke(
                            prompt_messages, config=inject_langfuse_callbacks({"run_name": run_name_prefixed})
                        )
                        llm_output_content = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
                else:
                    primary_llm_instance = self.get_llm_instance(primary_config_dict)
                    llm_response = await primary_llm_instance.ainvoke(
                        prompt_messages, config=inject_langfuse_callbacks({"run_name": run_name_prefixed})
                    )
                    llm_output_content = llm_response.content if hasattr(llm_response, "content") else str(llm_response)

                logger.info(f"[{step_name_for_logs}] Primary LLM call ({model_used}) successful.")
                if llm_output_content:
                    try:
                        debug_response_filename_primary = (
                            f"{log_dir}/response_{timestamp}_{step_name_for_logs.replace(' ', '_')}_PRIMARY.txt"
                        )
                        with open(debug_response_filename_primary, "w") as f_resp_pri:
                            f_resp_pri.write(
                                f"STRUCTURED OUTPUT RESPONSE (PRIMARY) - {step_name_for_logs} - {model_used} - {timestamp}\n\n"
                            )
                            f_resp_pri.write(llm_output_content)
                        logger.debug(f"Primary debug response saved to {debug_response_filename_primary}")
                    except Exception as e_file_resp_pri:
                        logger.debug(f"Failed to write debug log file for primary response: {e_file_resp_pri}")
                last_provider_error = None
                break

            except Exception as primary_error:
                error_str = str(primary_error).lower()
                is_rate_limited = any(phrase in error_str for phrase in _RATE_LIMIT_PHRASES)

                if is_rate_limited:
                    if fallback_config:
                        logger.warning(
                            f"[{step_name_for_logs}] Rate limited on {primary_model_name}, "
                            f"switching to fallback {fallback_model_name}"
                        )
                        last_provider_error = primary_error
                        model_used = None
                        break
                    elif _attempt < _RATE_LIMIT_MAX_RETRIES:
                        backoff = _RATE_LIMIT_BACKOFFS[min(_attempt, len(_RATE_LIMIT_BACKOFFS) - 1)]
                        logger.warning(
                            f"[{step_name_for_logs}] Rate limited on {primary_model_name}, "
                            f"no fallback — cooling down {backoff}s (attempt {_attempt + 1}/{_RATE_LIMIT_MAX_RETRIES})..."
                        )
                        await asyncio.sleep(backoff)
                        continue

                logger.warning(f"[{step_name_for_logs}] Primary LLM ({primary_model_name}) failed: {primary_error}")
                last_provider_error = primary_error
                model_used = None
                break

        ### Fallback LLM Attempt — runs after primary loop exits on error ###
        if last_provider_error and fallback_config:
            try:
                model_used = fallback_model_name
                logger.info(
                    f"[{step_name_for_logs}] Attempting fallback LLM: {fallback_model_name} ({fallback_config.provider.value})"
                )

                run_name_fallback_prefixed = (
                    f"[{fallback_config.provider.value}:{fallback_model_name}] {step_name_for_logs}"
                )

                if fallback_config.provider == LLMProvider.GOOGLE:
                    llm_output_content = await self._invoke_google_native_structured(
                        fallback_config, prompt_messages, output_model
                    )
                elif fallback_config.provider == LLMProvider.PERPLEXITY:
                    llm_output_content = await self._invoke_perplexity_native_structured(
                        fallback_config, prompt_messages, output_model
                    )
                elif fallback_config.provider == LLMProvider.ANTHROPIC:
                    fb_enable_thinking = fallback_config_dict.get("enable_thinking", False)
                    fb_enable_cache = fallback_config_dict.get("enable_cache", False)

                    if fb_enable_thinking or fb_enable_cache:
                        fb_thinking_budget = fallback_config_dict.get("thinking_budget_tokens", 8000)
                        fb_cache_ttl = fallback_config_dict.get("cache_ttl", "5m")

                        logger.info(
                            f"[{step_name_for_logs}] Using Anthropic native API for fallback (thinking={fb_enable_thinking}, cache={fb_enable_cache})"
                        )

                        llm_output_content = await self._invoke_anthropic_native_structured(
                            llm_config=fallback_config,
                            prompt_messages=prompt_messages,
                            output_schema=output_model,
                            enable_thinking=fb_enable_thinking,
                            thinking_budget_tokens=fb_thinking_budget,
                            enable_cache=fb_enable_cache,
                            cache_ttl=fb_cache_ttl,
                            step_name=f"{step_name_for_logs}_fallback",
                        )
                    else:
                        fallback_llm_instance = self.get_llm_instance(fallback_config_dict)
                        llm_response = await fallback_llm_instance.ainvoke(
                            prompt_messages, config=inject_langfuse_callbacks({"run_name": run_name_fallback_prefixed})
                        )
                        llm_output_content = (
                            llm_response.content if hasattr(llm_response, "content") else str(llm_response)
                        )
                else:
                    fallback_llm_instance = self.get_llm_instance(fallback_config_dict)
                    llm_response = await fallback_llm_instance.ainvoke(
                        prompt_messages, config=inject_langfuse_callbacks({"run_name": run_name_fallback_prefixed})
                    )
                    llm_output_content = (
                        llm_response.content if hasattr(llm_response, "content") else str(llm_response)
                    )

                logger.info(f"[{step_name_for_logs}] Fallback LLM call ({model_used}) successful.")
                if llm_output_content:
                    try:
                        debug_response_filename_fallback = (
                            f"{log_dir}/response_{timestamp}_{step_name_for_logs.replace(' ', '_')}_FALLBACK.txt"
                        )
                        with open(debug_response_filename_fallback, "w") as f_resp_fall:
                            f_resp_fall.write(
                                f"STRUCTURED OUTPUT RESPONSE (FALLBACK) - {step_name_for_logs} - {model_used} - {timestamp}\n\n"
                            )
                            f_resp_fall.write(llm_output_content)
                        logger.debug(f"Fallback debug response saved to {debug_response_filename_fallback}")
                    except Exception as e_file_resp_fall:
                        logger.debug(f"Failed to write debug log file for fallback response: {e_file_resp_fall}")
                last_provider_error = None

            except Exception as fallback_error:
                logger.error(
                    f"[{step_name_for_logs}] Fallback LLM ({fallback_model_name}) failed: {fallback_error}"
                )
                last_provider_error = ValueError(
                    f"Primary ({primary_model_name} error: {last_provider_error}) AND Fallback ({fallback_model_name} error: {fallback_error}) failed."
                )
                model_used = None
        elif last_provider_error:
            logger.error(f"[{step_name_for_logs}] Primary LLM failed, and no valid fallback was configured.")

        # Check for Content & Provider Errors
        if llm_output_content is None or not llm_output_content.strip() or last_provider_error:
            last_attempted_model_for_error = model_used
            if last_provider_error and not model_used:
                last_attempted_model_for_error = primary_model_name if not fallback_config else fallback_model_name

            error_detail_msg = f"LLM ({last_attempted_model_for_error or 'unknown'}) returned empty or no response."
            if last_provider_error:
                error_detail_msg = f"No successful LLM response. Last error from {last_attempted_model_for_error or 'unknown'}: {last_provider_error}"

            logger.error(f"[{step_name_for_logs}] Failed: {error_detail_msg}")
            raise StructuredOutputError(
                message=f"{step_name_for_logs} failed: {error_detail_msg}",
                raw_output=llm_output_content,
                model_used=last_attempted_model_for_error,
            ) from last_provider_error

        # Validate and Fix JSON
        try:
            logger.info(
                f"[{step_name_for_logs}] Validating/fixing output from model '{model_used}' against {output_model.__name__}"
            )
            logger.debug(
                f"---- Raw Output to Validate from {model_used} ----\n{llm_output_content}\n---- End Raw Output ----"
            )

            # Fast path: try parsing without instantiating the fixer LLM.
            # If the output is already valid JSON matching the schema, return immediately.
            try:
                _fast = llm_output_content.strip()
                if _fast.startswith("```json"):
                    _fast = _fast[7:]
                elif _fast.startswith("```"):
                    _fast = _fast[3:]
                if _fast.endswith("```"):
                    _fast = _fast[:-3]
                _fast = _fast.strip()

                if not (_fast.startswith("{") or _fast.startswith("[")):
                    _brace = _fast.find("{")
                    _bracket = _fast.find("[")
                    _start = -1
                    if _brace != -1 and _bracket != -1:
                        _start = min(_brace, _bracket)
                    elif _brace != -1:
                        _start = _brace
                    elif _bracket != -1:
                        _start = _bracket
                    if _start != -1:
                        _end = _fast.rfind("}" if _fast[_start] == "{" else "]")
                        if _end > _start:
                            _fast = _fast[_start : _end + 1]

                _fast_json = json.loads(_fast)
                _fast_result = output_model.model_validate(_fast_json)
                logger.info(f"[{step_name_for_logs}] Validation successful (fast path). Final Model Used: {model_used}")
                return _fast_result, model_used
            except Exception:
                logger.debug(f"[{step_name_for_logs}] Fast-path validation failed, falling through to fixer pipeline")

            if fixer_config_dict is None:
                logger.error(f"[{step_name_for_logs}] Fixer configuration is missing. Cannot attempt to fix JSON.")
                raise StructuredOutputError(
                    message=f"{step_name_for_logs} validation failed: Fixer config missing.",
                    raw_output=llm_output_content,
                    model_used=model_used,
                )

            fixer_llm_instance = self.get_llm_instance(fixer_config_dict)
            fixer_config_prepared = self._prepare_llm_config(fixer_config_dict)
            fixer_model_name_for_log = fixer_config_prepared.model_name

            current_ls_run_id = None
            try:
                from langsmith import get_current_run_tree

                current_run = get_current_run_tree()
                if current_run and hasattr(current_run, "id"):
                    current_ls_run_id = str(current_run.id)
            except Exception:
                pass

            validated_result, validation_error_str = await validate_and_fix_json(
                llm_output=llm_output_content,
                pydantic_model=output_model,
                fixer_llm=fixer_llm_instance,
                max_retries=1,
                langsmith_parent_run_id=current_ls_run_id,
            )

            if validation_error_str:
                # Check if error is about missing required fields (LLM didn't generate them)
                if (
                    "Missing required fields" in validation_error_str
                    or "field required" in validation_error_str.lower()
                ):
                    logger.error(
                        f"[{step_name_for_logs}] CRITICAL: Primary LLM ({model_used}) did not generate required fields. "
                        f"Re-running primary LLM with stronger instructions."
                    )

                    # Try ONE more time with the primary LLM
                    logger.warning(
                        f"[{step_name_for_logs}] Retrying primary LLM ({primary_model_name}) due to missing required fields..."
                    )

                    try:
                        llm_output_content_retry, model_used_retry = await self._invoke_primary_llm(
                            primary_config, prompt_messages, output_model
                        )

                        if llm_output_content_retry:
                            logger.info(f"[{step_name_for_logs}] Retry successful. Validating retry output...")
                            validated_result_retry, validation_error_str_retry = await validate_and_fix_json(
                                llm_output=llm_output_content_retry,
                                pydantic_model=output_model,
                                fixer_llm=fixer_llm_instance,
                                max_retries=1,
                                langsmith_parent_run_id=current_ls_run_id,
                            )

                            if validated_result_retry and not validation_error_str_retry:
                                logger.info(f"[{step_name_for_logs}] Retry validation successful!")
                                return validated_result_retry, model_used_retry
                            else:
                                logger.error(
                                    f"[{step_name_for_logs}] Retry validation also failed: {validation_error_str_retry}"
                                )
                    except Exception as retry_err:
                        logger.error(f"[{step_name_for_logs}] Retry attempt failed: {retry_err}")

                logger.error(
                    f"[{step_name_for_logs}] Validation failed after fix attempt (Fixer: {fixer_model_name_for_log}, Source: {model_used}): {validation_error_str}"
                )
                raise StructuredOutputError(
                    message=f"{step_name_for_logs} validation failed after fix.",
                    validation_error=validation_error_str,
                    raw_output=llm_output_content,
                    model_used=model_used,
                )

            logger.info(f"[{step_name_for_logs}] Validation successful. Final Model Used: {model_used}")
            try:
                log_output_final = json.dumps(validated_result.model_dump(mode="json", by_alias=True), indent=2)
            except AttributeError:
                log_output_final = str(validated_result)
            logger.debug(
                f"[{step_name_for_logs}] Final Validated Output (first 1000 chars from {model_used}):\n{log_output_final[:1000]}..."
            )

            return validated_result, model_used

        except StructuredOutputError as soe_final:
            if not soe_final.model_used:
                soe_final.model_used = model_used
            logger.error(
                f"[{step_name_for_logs}] StructuredOutputError: {soe_final.message} (Model: {soe_final.model_used})"
            )
            raise soe_final
        except Exception as e_final_validation:
            logger.exception(
                f"[{step_name_for_logs}] Unexpected error during validation/fixing stage with model '{model_used}': {e_final_validation}",
                exc_info=True,
            )
            raise StructuredOutputError(
                message=f"{step_name_for_logs} validation/fixing stage failed: {str(e_final_validation)}",
                raw_output=llm_output_content,
                model_used=model_used,
            ) from e_final_validation

    # ! v2

    async def invoke_structured_output_with_web_search(
        self,
        prompt_messages: list[BaseMessage],
        output_model: type[BaseModel],
        primary_config_dict: dict[str, Any],
        fallback_config_dict: dict[str, Any] | None = None,
        fixer_config_dict: dict[str, Any] | None = None,
        search_queries: list[str] | None = None,
        step_name_for_logs: str = "structured_output_with_web_search",
    ) -> tuple[BaseModel, str | None]:
        """
        Invoke structured output with web search enhancement.
        Uses the web search service to supplement information before LLM call.
        """
        # Log cost metadata
        metadata = self._get_cost_metadata(step_name_for_logs)
        if metadata:
            logger.info(f"Cost tracking metadata for {step_name_for_logs}: {metadata}")

        config = self._prepare_llm_config(primary_config_dict)

        # Anthropic: call native Messages API with web_search tool
        if config.provider == LLMProvider.ANTHROPIC:
            logger.info(f"🔍 Using web search enhancement with {config.provider.value} {config.model_name}")

            # Safely extract config values (primary_config_dict may be a dict or LLMConfig)
            _cfg = primary_config_dict if isinstance(primary_config_dict, dict) else (
                primary_config_dict.model_dump() if hasattr(primary_config_dict, "model_dump") else {}
            )

            # Optionally enhance the last user message with extracted queries for guidance
            try:
                from features.llm.services.web_search_service import WebSearchService as _WSS

                _ws = _WSS(
                    max_searches_per_query=_cfg.get("max_searches_per_query", 3),
                    max_results_per_search=_cfg.get("max_results_per_search", 5),
                )
                enhanced_messages = await _ws.enhance_prompt_with_search_context(prompt_messages, search_queries or [])
            except Exception:
                enhanced_messages = prompt_messages

            # Route to Anthropic web search if provider is anthropic
            if config.provider == LLMProvider.ANTHROPIC:
                logger.info(f"🔍 Step 1: Getting web search context with {config.provider.value} {config.model_name}")

                # Step 1: Get web search context from Anthropic
                web_search_context = await self._invoke_anthropic_with_web_search(
                    config=config,
                    prompt_messages=enhanced_messages,
                    output_schema=output_model,
                    max_uses=_cfg.get("max_searches_per_query", 3),
                    step_name=f"{step_name_for_logs}_web_search",
                )

                logger.info("🔍 Step 2: Using web search context to enhance the original prompt")

                # Step 2: Enhance the original prompt with web search context
                enhanced_prompt_with_context = enhanced_messages.copy()

                # Find the last human message and enhance it with web search context
                for i in range(len(enhanced_prompt_with_context) - 1, -1, -1):
                    if isinstance(enhanced_prompt_with_context[i], HumanMessage):
                        original_content = enhanced_prompt_with_context[i].content
                        enhanced_content = f"""{original_content}

## ADDITIONAL CONTEXT FROM WEB SEARCH:
{web_search_context}

Use this additional context to enhance your response while maintaining the exact JSON format requested above."""
                        enhanced_prompt_with_context[i] = HumanMessage(content=enhanced_content)
                        break

                # Step 3: Use regular structured output with the enhanced prompt
                logger.info("🔍 Step 3: Generating structured output with enhanced context")
                result, error_msg = await self.invoke_structured_output(
                    prompt_messages=enhanced_prompt_with_context,
                    output_model=output_model,
                    primary_config_dict=primary_config_dict,
                    fallback_config_dict=fallback_config_dict,
                    fixer_config_dict=fixer_config_dict,
                    step_name_for_logs=f"{step_name_for_logs}_with_web_context",
                )

                if result is not None:
                    logger.info(f"✅ Successfully completed web search + structured output for {step_name_for_logs}")
                    return result, None
                else:
                    logger.warning(f"Web search enhanced structured output failed: {error_msg}")
                    # Fall through to fallback

        # Non-Anthropic: fall back to previous behavior
        logger.warning(
            f"Web search not supported natively for {config.provider.value} {config.model_name}, using standard structured output"
        )
        return await self.invoke_structured_output(
            prompt_messages=prompt_messages,
            output_model=output_model,
            primary_config_dict=primary_config_dict,
            fallback_config_dict=fallback_config_dict,
            fixer_config_dict=fixer_config_dict or primary_config_dict,
            step_name_for_logs=step_name_for_logs,
        )

    async def invoke_structured_output_with_tools(
        self,
        prompt_messages: list[BaseMessage],
        output_model: type[BaseModel],
        primary_config_dict: dict[str, Any],
        fallback_config_dict: dict[str, Any] | None,
        fixer_config_dict: dict[str, Any],
        step_name_for_logs: str = "structured_output_with_tools",
        available_tools: list[str] = None,
    ) -> tuple[BaseModel, str | None]:
        """Enhanced structured output method with Live Search for Grok."""

        # Auto-add cost tracking metadata
        cost_metadata = self._get_cost_metadata(step_name_for_logs)
        if available_tools:
            cost_metadata["tools_used"] = available_tools

        primary_config: LLMConfig = self._prepare_llm_config(primary_config_dict)
        primary_provider = primary_config.provider

        # For Grok with X search tools, use Live Search API
        if available_tools and primary_provider == LLMProvider.GROK:
            enable_x_search = any(tool in ["x_keyword_search", "x_semantic_search"] for tool in available_tools)

            if enable_x_search:
                logger.info(f"[{step_name_for_logs}] Using Grok Live Search with X data access")

                try:
                    # Use the CORRECT Live Search implementation
                    llm_output_content = await self._invoke_grok_with_live_search(
                        primary_config, prompt_messages, output_model, enable_x_search=True
                    )

                    # Validate the output
                    fixer_llm_instance = self.get_llm_instance(fixer_config_dict)
                    grok_ls_run_id = None
                    try:
                        from langsmith import get_current_run_tree

                        _run = get_current_run_tree()
                        if _run and hasattr(_run, "id"):
                            grok_ls_run_id = str(_run.id)
                    except Exception:
                        pass
                    validated_result, validation_error_str = await validate_and_fix_json(
                        llm_output=llm_output_content,
                        pydantic_model=output_model,
                        fixer_llm=fixer_llm_instance,
                        max_retries=1,
                        langsmith_parent_run_id=grok_ls_run_id,
                    )

                    if validation_error_str:
                        raise StructuredOutputError(
                            message=f"{step_name_for_logs} validation failed after Grok Live Search.",
                            validation_error=validation_error_str,
                            raw_output=llm_output_content,
                            model_used=primary_config.model_name,
                        )

                    logger.info(f"[{step_name_for_logs}] Grok Live Search successful with {primary_config.model_name}")
                    return validated_result, primary_config.model_name

                except Exception as e:
                    logger.error(f"[{step_name_for_logs}] Grok Live Search failed: {str(e)}")
                    # Fall back to regular structured output without search
                    logger.info(f"[{step_name_for_logs}] Falling back to regular Grok without search")

            # For Grok without X search or if X search failed
            return await self.invoke_structured_output(
                prompt_messages=prompt_messages,
                output_model=output_model,
                primary_config_dict=primary_config_dict,
                fallback_config_dict=fallback_config_dict,
                fixer_config_dict=fixer_config_dict,
                step_name_for_logs=f"{step_name_for_logs}_grok_standard",
            )
        else:
            # Fall back to regular structured output for non-Grok providers
            return await self.invoke_structured_output(
                prompt_messages=prompt_messages,
                output_model=output_model,
                primary_config_dict=primary_config_dict,
                fallback_config_dict=fallback_config_dict,
                fixer_config_dict=fixer_config_dict,
                step_name_for_logs=step_name_for_logs,
            )

    #! v1
    # async def invoke_structured_output_with_tools(
    #     self,
    #     prompt_messages: List[BaseMessage],
    #     output_model: Type[BaseModel],
    #     primary_config_dict: Dict[str, Any],
    #     fallback_config_dict: Optional[Dict[str, Any]],
    #     fixer_config_dict: Dict[str, Any],
    #     step_name_for_logs: str = "structured_output_with_tools",
    #     available_tools: List[str] = None
    # ) -> Tuple[BaseModel, Optional[str]]:
    #     """
    #     Enhanced structured output method that supports tool calling for Grok X search.

    #     Args:
    #         prompt_messages: Messages to send to the LLM
    #         output_model: Pydantic model for structured output
    #         primary_config_dict: Primary LLM configuration
    #         fallback_config_dict: Fallback LLM configuration
    #         fixer_config_dict: JSON fixer LLM configuration
    #         step_name_for_logs: Name for logging
    #         available_tools: List of tool names to enable (e.g., ["x_keyword_search", "x_semantic_search"])

    #     Returns:
    #         Tuple of (validated_result, model_used)
    #     """

    #     # Auto-add cost tracking metadata to current LangSmith run
    #     cost_metadata = self._get_cost_metadata(step_name_for_logs)
    #     if available_tools:
    #         cost_metadata["tools_used"] = available_tools

    #     if cost_metadata and self.langsmith_tracer:
    #         try:
    #             # Add metadata to current LangSmith context
    #             from langsmith import get_current_run_tree
    #             current_run = get_current_run_tree()
    #             if current_run:
    #                 # Update current run with cost metadata
    #                 current_run.extra = {**(current_run.extra or {}), **cost_metadata}
    #                 current_run.tags = list(set((current_run.tags or []) + [cost_metadata.get('operation_type', 'unknown'), 'tools']))
    #         except Exception as e:
    #             logger.debug(f"Failed to add cost metadata to LangSmith run: {e}")

    #     primary_config: LLMConfig = self._prepare_llm_config(primary_config_dict)
    #     primary_provider = primary_config.provider

    #     # For tool calling, we need to use native SDK implementations
    #     if available_tools and primary_provider == LLMProvider.GROK:
    #         logger.info(f"[{step_name_for_logs}] Using Grok with X search tools: {available_tools}")

    #         # Use native Grok API with tool calling
    #         try:
    #             llm_output_content = await self._invoke_grok_native_with_tools(
    #                 primary_config, prompt_messages, output_model, available_tools
    #             )

    #             # Validate the output
    #             fixer_llm_instance = self.get_llm_instance(fixer_config_dict)
    #             validated_result, validation_error_str = await validate_and_fix_json(
    #                 llm_output=llm_output_content,
    #                 pydantic_model=output_model,
    #                 fixer_llm=fixer_llm_instance,
    #                 max_retries=1
    #             )

    #             if validation_error_str:
    #                 raise StructuredOutputError(
    #                     message=f"{step_name_for_logs} validation failed after tool calling.",
    #                     validation_error=validation_error_str,
    #                     raw_output=llm_output_content,
    #                     model_used=primary_config.model_name
    #                 )

    #             return validated_result, primary_config.model_name

    #         except Exception as e:
    #             logger.error(f"[{step_name_for_logs}] Grok tool calling failed: {str(e)}")
    #             # Fall back to regular structured output without tools
    #             return await self.invoke_structured_output(
    #                 prompt_messages=prompt_messages,
    #                 output_model=output_model,
    #                 primary_config_dict=primary_config_dict,
    #                 fallback_config_dict=fallback_config_dict,
    #                 fixer_config_dict=fixer_config_dict,
    #                 step_name_for_logs=f"{step_name_for_logs}_fallback"
    #             )
    #     else:
    #         # Fall back to regular structured output for non-tool providers
    #         logger.info(f"[{step_name_for_logs}] No tools specified or unsupported provider, using regular structured output")
    #         return await self.invoke_structured_output(
    #             prompt_messages=prompt_messages,
    #             output_model=output_model,
    #             primary_config_dict=primary_config_dict,
    #             fallback_config_dict=fallback_config_dict,
    #             fixer_config_dict=fixer_config_dict,
    #             step_name_for_logs=step_name_for_logs
    #         )
    # !Anthropic web search tool

    @traceable(run_type="llm", name="Grok Live Search API")
    async def _invoke_grok_with_live_search(
        self,
        config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        enable_x_search: bool = True,
    ) -> str:
        """
        Invoke Grok API with Live Search using X.AI SDK (CORRECT API STRUCTURE)

        The X.AI SDK has a different API than OpenAI SDK!
        """
        step_name_for_logs = f"Grok Live Search ({config.model_name})"

        logger.info(f"Invoking {step_name_for_logs} with X search: {enable_x_search}")

        if not config.api_key:
            raise ValueError("Grok API Key is missing for Live Search")

        # Initialize X.AI SDK client
        try:
            from xai_sdk import AsyncClient as AsyncXAIClient

            client = AsyncXAIClient(api_key=config.api_key)
            logger.debug(f"[{step_name_for_logs}] X.AI SDK client initialized successfully.")
        except ImportError:
            error_msg = "xai-sdk not installed. Run: pip install xai-sdk"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as client_init_err:
            error_msg = f"Failed to initialize X.AI SDK client: {str(client_init_err)}"
            logger.exception(error_msg, exc_info=True)
            raise ValueError(error_msg) from client_init_err

        # Convert LangChain messages to X.AI SDK format
        try:
            from xai_sdk.chat import assistant, system, user

            xai_messages = []
            for msg in prompt_messages:
                if isinstance(msg, SystemMessage):
                    xai_messages.append(system(msg.content))
                elif isinstance(msg, AIMessage):
                    xai_messages.append(assistant(msg.content))
                else:  # HumanMessage or default
                    xai_messages.append(user(msg.content))

        except ImportError as import_err:
            logger.error(f"Failed to import X.AI SDK chat helpers: {import_err}")
            # Fallback to dict format
            xai_messages = []
            for msg in prompt_messages:
                if isinstance(msg, SystemMessage):
                    xai_messages.append({"role": "system", "content": msg.content})
                elif isinstance(msg, AIMessage):
                    xai_messages.append({"role": "assistant", "content": msg.content})
                else:
                    xai_messages.append({"role": "user", "content": msg.content})

        try:
            logger.debug(f"[{step_name_for_logs}] Sending request with Live Search...")

            # Build chat creation parameters
            chat_params = {
                "model": config.model_name,
                "messages": xai_messages,
            }

            # Add optional parameters
            if config.temperature is not None:
                chat_params["temperature"] = config.temperature
            if config.max_tokens is not None:
                chat_params["max_tokens"] = config.max_tokens
            if config.top_p is not None:
                chat_params["top_p"] = config.top_p

            # ADD LIVE SEARCH PARAMETERS (X.AI SDK WAY)
            if enable_x_search:
                # Try with SearchParameters first
                try:
                    from xai_sdk.chat import SearchParameters

                    search_params = SearchParameters(
                        mode="on",
                        sources=[{"type": "x"}, {"type": "web"}],
                        max_search_results=10,
                        return_citations=True,
                    )
                    chat_params["search_parameters"] = search_params
                    logger.info(f"[{step_name_for_logs}] Enabled Live Search with SearchParameters")

                except ImportError:
                    # Fallback to dict format
                    chat_params["search_parameters"] = {
                        "mode": "on",
                        "sources": [{"type": "x"}, {"type": "web"}],
                        "max_search_results": 10,
                        "return_citations": True,
                    }
                    logger.info(f"[{step_name_for_logs}] Enabled Live Search with dict format")

            # Use X.AI SDK's correct API structure
            chat = await client.chat.create(**chat_params)

            # Sample the response (X.AI SDK way)
            response = await chat.sample()

            if response and response.content:
                content = response.content
                logger.info(f"[{step_name_for_logs}] Got response: {len(content)} chars")

                # Log search info if available
                if hasattr(response, "usage") and hasattr(response.usage, "num_sources_used"):
                    sources_used = response.usage.num_sources_used
                    search_cost = sources_used * 0.025
                    logger.info(f"[{step_name_for_logs}] Live Search used {sources_used} sources (${search_cost:.3f})")

                # Log a preview for debugging
                preview = content[:300] + "..." if len(content) > 300 else content
                logger.debug(f"[{step_name_for_logs}] Content preview: {preview}")

                return content
            else:
                raise ValueError("X.AI SDK returned no content")

        except Exception as e:
            error_msg = f"X.AI SDK call failed: {str(e)}"
            logger.exception(f"[{step_name_for_logs}] {error_msg}", exc_info=True)
            raise ValueError(error_msg) from e

    @traceable(run_type="llm", name="Grok Live Search (OpenAI SDK)")
    async def _invoke_grok_with_live_search_openai_sdk(
        self,
        config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        enable_x_search: bool = True,
    ) -> str:
        """
        Alternative: Use OpenAI SDK with X.AI endpoint for Live Search
        (X.AI claims OpenAI compatibility)
        """
        step_name_for_logs = f"Grok Live Search via OpenAI SDK ({config.model_name})"

        logger.info(f"Invoking {step_name_for_logs} with X search: {enable_x_search}")

        if not config.api_key:
            raise ValueError("Grok API Key is missing for Live Search")

        try:
            # Use X.AI endpoint with OpenAI SDK (per X.AI docs: "compatible with OpenAI SDK")
            client = AsyncOpenAI(api_key=config.api_key, base_url="https://api.x.ai/v1")
            logger.debug(f"[{step_name_for_logs}] OpenAI SDK with X.AI endpoint initialized.")

        except Exception as client_init_err:
            error_msg = f"Failed to initialize OpenAI SDK for X.AI: {str(client_init_err)}"
            logger.exception(error_msg, exc_info=True)
            raise ValueError(error_msg) from client_init_err

        # Convert LangChain messages
        openai_messages = []
        for msg in prompt_messages:
            role = "user"
            if isinstance(msg, AIMessage):
                role = "assistant"
            elif isinstance(msg, SystemMessage):
                role = "system"
            openai_messages.append({"role": role, "content": msg.content})

        try:
            # Build request parameters
            request_params = {
                "model": config.model_name,
                "messages": openai_messages,
            }

            if config.temperature is not None:
                request_params["temperature"] = config.temperature
            if config.max_tokens is not None:
                request_params["max_tokens"] = config.max_tokens
            if config.top_p is not None:
                request_params["top_p"] = config.top_p
            if config.json_mode:
                request_params["response_format"] = {"type": "json_object"}

            # ADD LIVE SEARCH VIA OPENAI SDK (might work since X.AI claims compatibility)
            if enable_x_search:
                request_params["search_parameters"] = {
                    "mode": "on",
                    "sources": [{"type": "x"}, {"type": "web"}],
                    "max_search_results": 10,
                    "return_citations": True,
                }
                logger.info(f"[{step_name_for_logs}] Added search_parameters to OpenAI SDK request")

            response = await client.chat.completions.create(**request_params)

            if response.choices and response.choices[0].message.content:
                content = response.choices[0].message.content
                logger.info(f"[{step_name_for_logs}] Got response: {len(content)} chars")
                return content
            else:
                raise ValueError("No content in X.AI response via OpenAI SDK")

        except Exception as e:
            error_msg = f"X.AI via OpenAI SDK failed: {str(e)}"
            logger.exception(f"[{step_name_for_logs}] {error_msg}", exc_info=True)
            raise ValueError(error_msg) from e

    # v2

    # features/llm/services/llm_service.py - FIXED _invoke_grok_native_with_tools method

    @traceable(run_type="llm", name="Grok Native API with Tools")
    async def _invoke_grok_native_with_tools(
        self,
        config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        available_tools: list[str] = None,
    ) -> str:
        """
        Invoke Grok API with X search tool calling support.

        Args:
            config: Grok LLM configuration
            prompt_messages: Messages to send
            output_schema: Expected output schema
            available_tools: List of X search tools to enable

        Returns:
            Raw JSON string response from Grok
        """
        step_name_for_logs = f"Grok Native Tools ({config.model_name})"

        logger.info(f"Invoking {step_name_for_logs} with tools: {available_tools}")

        if not config.api_key:
            raise ValueError("Grok API Key is missing for tool calling")

        # Initialize Grok client
        try:
            client = AsyncOpenAI(api_key=config.api_key, base_url="https://api.x.ai/v1")
            logger.debug(f"[{step_name_for_logs}] Grok client initialized successfully.")
        except Exception as client_init_err:
            error_msg = f"Failed to initialize Grok client: {str(client_init_err)}"
            logger.exception(error_msg, exc_info=True)
            raise ValueError(error_msg) from client_init_err

        # Convert LangChain messages to OpenAI format
        openai_messages = []
        for msg in prompt_messages:
            role = "user"
            if isinstance(msg, AIMessage):
                role = "assistant"
            elif isinstance(msg, SystemMessage):
                role = "system"

            openai_messages.append({"role": role, "content": msg.content})

        # Define X search tools (Grok's native tools)
        tools = []
        if available_tools:
            if "x_keyword_search" in available_tools:
                tools.append(
                    {
                        "type": "function",
                        "function": {
                            "name": "x_keyword_search",
                            "description": "Search X (Twitter) for posts using specific keywords and filters. Grok has native access to X data.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "query": {
                                        "type": "string",
                                        "description": "Search query with keywords. Can include operators like 'from:username', 'since:YYYY-MM-DD', tweet IDs, etc.",
                                    },
                                    "limit": {
                                        "type": "integer",
                                        "description": "Maximum number of posts to return (1-20)",
                                        "default": 10,
                                    },
                                    "mode": {
                                        "type": "string",
                                        "enum": ["Latest", "Top"],
                                        "description": "Sort mode for results",
                                        "default": "Latest",
                                    },
                                },
                                "required": ["query"],
                            },
                        },
                    }
                )

            if "x_semantic_search" in available_tools:
                tools.append(
                    {
                        "type": "function",
                        "function": {
                            "name": "x_semantic_search",
                            "description": "Search X (Twitter) for conceptually related posts using semantic understanding. Grok has native semantic search capabilities.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "query": {
                                        "type": "string",
                                        "description": "Semantic search query describing the concept or topic",
                                    },
                                    "usernames": {
                                        "type": "array",
                                        "items": {"type": "string"},
                                        "description": "Optional list of usernames to filter results",
                                    },
                                    "limit": {
                                        "type": "integer",
                                        "description": "Maximum number of posts to return (1-20)",
                                        "default": 10,
                                    },
                                },
                                "required": ["query"],
                            },
                        },
                    }
                )

        # Prepare request parameters
        request_params = {
            "model": config.model_name,
            "messages": openai_messages,
        }

        if config.temperature is not None:
            request_params["temperature"] = config.temperature
        if config.max_tokens is not None:
            request_params["max_tokens"] = config.max_tokens
        if config.top_p is not None:
            request_params["top_p"] = config.top_p

        # Add tools if available
        if tools:
            request_params["tools"] = tools
            request_params["tool_choice"] = "auto"

        # Add JSON mode if requested
        if config.json_mode:
            request_params["response_format"] = {"type": "json_object"}

        try:
            logger.debug(f"[{step_name_for_logs}] Sending request with {len(tools)} tools...")

            # FIRST REQUEST: Let Grok use its native X search tools
            response = await client.chat.completions.create(**request_params)

            if not response.choices:
                raise ValueError("Grok API returned no choices.")

            first_choice = response.choices[0]

            # Handle tool calls if present - LET GROK HANDLE THEM NATIVELY
            if first_choice.message.tool_calls:
                logger.info(f"[{step_name_for_logs}] Grok made {len(first_choice.message.tool_calls)} tool calls")

                # Log what tools Grok called (for debugging)
                for tool_call in first_choice.message.tool_calls:
                    logger.info(f"Tool call: {tool_call.function.name} with args: {tool_call.function.arguments}")

                # DON'T INTERFERE WITH GROK'S TOOL CALLS
                # Grok handles X search natively - we don't need to simulate anything

                # The response should contain the tool call message
                # We need to continue the conversation to get the final response

                # Add the assistant's tool calls to the conversation
                updated_messages = openai_messages + [
                    {
                        "role": "assistant",
                        "content": first_choice.message.content or "",
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                            }
                            for tc in first_choice.message.tool_calls
                        ],
                    }
                ]

                # CRITICAL: Let Grok's backend handle the tool execution
                # We don't add fake tool results - Grok does this internally

                # Request the final response after tool execution
                final_request = {**request_params, "messages": updated_messages}

                # Remove tools from final request since they've been used
                if "tools" in final_request:
                    del final_request["tools"]
                if "tool_choice" in final_request:
                    del final_request["tool_choice"]

                logger.debug(f"[{step_name_for_logs}] Requesting final response after tool execution...")
                final_response = await client.chat.completions.create(**final_request)

                if final_response.choices and final_response.choices[0].message.content:
                    final_content = final_response.choices[0].message.content
                    logger.info(f"[{step_name_for_logs}] Got final response after X search: {len(final_content)} chars")
                    return final_content
                else:
                    raise ValueError("No final content after tool calling")

            # Regular response without tool calls
            if first_choice.message and first_choice.message.content:
                logger.info(f"[{step_name_for_logs}] Got direct response: {len(first_choice.message.content)} chars")
                return first_choice.message.content
            else:
                raise ValueError("Grok API returned no content")

        except Exception as e:
            error_msg = f"Grok tool calling failed: {str(e)}"
            logger.exception(f"[{step_name_for_logs}] {error_msg}", exc_info=True)
            raise ValueError(error_msg) from e

    # v1
    # async def _invoke_grok_native_with_tools(
    #     self,
    #     config: LLMConfig,
    #     prompt_messages: List[BaseMessage],
    #     output_schema: Type[BaseModel],
    #     available_tools: List[str] = None
    # ) -> str:
    #     """
    #     Invoke Grok API with X search tool calling support.

    #     Args:
    #         config: Grok LLM configuration
    #         prompt_messages: Messages to send
    #         output_schema: Expected output schema
    #         available_tools: List of X search tools to enable

    #     Returns:
    #         Raw JSON string response
    #     """
    #     step_name_for_logs = f"Grok Native Tools ({config.model_name})"

    #     logger.info(f"Invoking {step_name_for_logs} with tools: {available_tools}")

    #     if not config.api_key:
    #         raise ValueError("Grok API Key is missing for tool calling")

    #     # Initialize Grok client
    #     try:
    #         from openai import AsyncOpenAI
    #         client = AsyncOpenAI(
    #             api_key=config.api_key,
    #             base_url="https://api.x.ai/v1"
    #         )
    #         logger.debug(f"[{step_name_for_logs}] Grok client initialized successfully.")
    #     except Exception as client_init_err:
    #         error_msg = f"Failed to initialize Grok client: {str(client_init_err)}"
    #         logger.exception(error_msg, exc_info=True)
    #         raise ValueError(error_msg) from client_init_err

    #     # Convert LangChain messages to OpenAI format
    #     openai_messages = []
    #     for msg in prompt_messages:
    #         role = "user"
    #         if isinstance(msg, AIMessage):
    #             role = "assistant"
    #         elif isinstance(msg, SystemMessage):
    #             role = "system"

    #         openai_messages.append({"role": role, "content": msg.content})

    #     # Define X search tools
    #     tools = []
    #     if available_tools:
    #         if "x_keyword_search" in available_tools:
    #             tools.append({
    #                 "type": "function",
    #                 "function": {
    #                     "name": "x_keyword_search",
    #                     "description": "Search X (Twitter) for posts using specific keywords and filters",
    #                     "parameters": {
    #                         "type": "object",
    #                         "properties": {
    #                             "query": {
    #                                 "type": "string",
    #                                 "description": "Search query with keywords. Can include operators like 'from:username', 'since:YYYY-MM-DD', etc."
    #                             },
    #                             "limit": {
    #                                 "type": "integer",
    #                                 "description": "Maximum number of posts to return (1-20)",
    #                                 "default": 10
    #                             },
    #                             "mode": {
    #                                 "type": "string",
    #                                 "enum": ["Latest", "Top"],
    #                                 "description": "Sort mode for results",
    #                                 "default": "Latest"
    #                             }
    #                         },
    #                         "required": ["query"]
    #                     }
    #                 }
    #             })

    #         if "x_semantic_search" in available_tools:
    #             tools.append({
    #                 "type": "function",
    #                 "function": {
    #                     "name": "x_semantic_search",
    #                     "description": "Search X (Twitter) for conceptually related posts using semantic understanding",
    #                     "parameters": {
    #                         "type": "object",
    #                         "properties": {
    #                             "query": {
    #                                 "type": "string",
    #                                 "description": "Semantic search query describing the concept or topic"
    #                             },
    #                             "usernames": {
    #                                 "type": "array",
    #                                 "items": {"type": "string"},
    #                                 "description": "Optional list of usernames to filter results"
    #                             },
    #                             "limit": {
    #                                 "type": "integer",
    #                                 "description": "Maximum number of posts to return (1-20)",
    #                                 "default": 10
    #                             }
    #                         },
    #                         "required": ["query"]
    #                     }
    #                 }
    #             })

    #     # Prepare request parameters
    #     request_params = {
    #         "model": config.model_name,
    #         "messages": openai_messages,
    #     }

    #     if config.temperature is not None:
    #         request_params["temperature"] = config.temperature
    #     if config.max_tokens is not None:
    #         request_params["max_tokens"] = config.max_tokens
    #     if config.top_p is not None:
    #         request_params["top_p"] = config.top_p

    #     # Add tools if available
    #     if tools:
    #         request_params["tools"] = tools
    #         request_params["tool_choice"] = "auto"

    #     # Add JSON mode if requested
    #     if config.json_mode:
    #         request_params["response_format"] = {"type": "json_object"}

    #     try:
    #         logger.debug(f"[{step_name_for_logs}] Sending request with {len(tools)} tools...")

    #         response = await client.chat.completions.create(**request_params)

    #         if not response.choices:
    #             raise ValueError("Grok API returned no choices.")

    #         first_choice = response.choices[0]

    #         # Handle tool calls if present
    #         if first_choice.message.tool_calls:
    #             logger.info(f"[{step_name_for_logs}] Received {len(first_choice.message.tool_calls)} tool calls")

    #             # Process tool calls (in a real implementation, these would be executed)
    #             tool_results = []
    #             for tool_call in first_choice.message.tool_calls:
    #                 logger.info(f"Tool call: {tool_call.function.name} with args: {tool_call.function.arguments}")

    #                 # For now, simulate tool results since we don't have actual X API integration
    #                 if tool_call.function.name == "x_keyword_search":
    #                     tool_results.append({
    #                         "tool_call_id": tool_call.id,
    #                         "content": "Mock X search results: Found 5 recent AI-related posts with relevant content."
    #                     })
    #                 elif tool_call.function.name == "x_semantic_search":
    #                     tool_results.append({
    #                         "tool_call_id": tool_call.id,
    #                         "content": "Mock semantic search results: Found conceptually related AI research posts."
    #                     })

    #             # Add tool results to conversation and get final response
    #             updated_messages = openai_messages + [
    #                 {"role": "assistant", "content": first_choice.message.content, "tool_calls": [
    #                     {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
    #                     for tc in first_choice.message.tool_calls
    #                 ]},
    #             ] + [
    #                 {"role": "tool", "tool_call_id": tr["tool_call_id"], "content": tr["content"]}
    #                 for tr in tool_results
    #             ]

    #             # Get final response with tool results
    #             final_request = {
    #                 **request_params,
    #                 "messages": updated_messages
    #             }

    #             final_response = await client.chat.completions.create(**final_request)

    #             if final_response.choices and final_response.choices[0].message.content:
    #                 return final_response.choices[0].message.content
    #             else:
    #                 raise ValueError("No final content after tool calling")

    #         # Regular response without tool calls
    #         if first_choice.message and first_choice.message.content:
    #             return first_choice.message.content
    #         else:
    #             raise ValueError("Grok API returned no content")

    #     except Exception as e:
    #         error_msg = f"Grok tool calling failed: {str(e)}"
    #         logger.exception(f"[{step_name_for_logs}] {error_msg}", exc_info=True)
    #         raise ValueError(error_msg) from e
    # ### CODE CHANGES FINISH ###

    @traceable(run_type="llm", name="Anthropic Native API with Web Search")
    async def _invoke_anthropic_with_web_search(
        self,
        config: LLMConfig,
        prompt_messages: list[BaseMessage],
        output_schema: type[BaseModel],
        max_uses: int = 3,
        step_name: str = "anthropic_web_search",
    ) -> str:
        """Invoke Anthropic Messages API with web_search tool enabled and return raw text."""
        if AsyncAnthropic is None:
            raise ValueError("anthropic SDK not installed")

        platform = config.platform or resolve_platform(LLMProvider.ANTHROPIC)
        if platform == "vertex":
            if AsyncAnthropicVertex is None:
                raise ValueError("anthropic[vertex] not installed. Run: pip install anthropic[vertex]")
            client = AsyncAnthropicVertex(project_id=os.getenv("GCP_PROJECT_ID"), region=os.getenv("GCP_LOCATION", "us-east5"))
        elif platform == "bedrock":
            if AsyncAnthropicBedrock is None:
                raise ValueError("anthropic[bedrock] not installed. Run: pip install anthropic[bedrock]")
            client = AsyncAnthropicBedrock(aws_region=os.getenv("AWS_REGION", "us-east-1"))
        else:
            client = AsyncAnthropic(api_key=config.api_key)  # type: ignore

        # Convert LangChain messages to Anthropic format
        system_text_parts: list[str] = []
        message_list: list[dict[str, Any]] = []
        for msg in prompt_messages:
            role = "user"
            if isinstance(msg, AIMessage):
                role = "assistant"
            elif isinstance(msg, SystemMessage):
                content_str = msg.content if isinstance(msg.content, str) else str(msg.content)
                if content_str.strip():
                    system_text_parts.append(content_str)
                continue

            # Build content blocks (text + image support)
            content_blocks: list[dict[str, Any]] = []
            if isinstance(msg.content, list):
                for part in msg.content:
                    if isinstance(part, dict):
                        if part.get("type") == "text":
                            text_val = part.get("text", "")
                            if text_val.strip():
                                content_blocks.append({"type": "text", "text": text_val})
                        elif part.get("type") == "image_url":
                            img_url = part.get("image_url", {}).get("url", "")
                            if img_url.startswith("data:"):
                                header, b64_data = img_url.split(",", 1)
                                mime = header.split(":")[1].split(";")[0]
                                content_blocks.append(
                                    {
                                        "type": "image",
                                        "source": {
                                            "type": "base64",
                                            "media_type": mime,
                                            "data": b64_data,
                                        },
                                    }
                                )
                    elif isinstance(part, str):
                        if part.strip():
                            content_blocks.append({"type": "text", "text": part})
            else:
                content_str = str(msg.content)
                if content_str.strip():
                    content_blocks.append({"type": "text", "text": content_str})

            if not content_blocks:
                continue
            message_list.append({"role": role, "content": content_blocks})

        system_text = "\n".join(system_text_parts) if system_text_parts else None

        # Prepare tool definition per docs
        tools = [{"type": "web_search_20250305", "name": "web_search", "max_uses": max_uses}]

        effective_model = get_bedrock_model_id(config.model_name) if platform == "bedrock" else config.model_name
        request_args = {
            "model": effective_model,
            "messages": message_list,
            "tools": tools,
        }
        if system_text:
            request_args["system"] = system_text
        request_args["max_tokens"] = config.max_tokens if config.max_tokens is not None else 2048

        resp = await client.messages.create(**request_args)

        # Extract assistant text blocks
        text_out: list[str] = []
        for block in getattr(resp, "content", []) or []:
            if getattr(block, "type", "") == "text" and getattr(block, "text", ""):
                text_out.append(block.text)

        raw_text = "\n".join(text_out).strip()
        if not raw_text:
            raise ValueError("Anthropic tool call returned no text content")

        # Attach web_search usage to LangSmith current run metadata for visibility
        try:
            from langsmith import get_current_run_tree

            current_run = get_current_run_tree()
            if current_run is not None:
                usage = getattr(resp, "usage", None)
                web_uses = None
                if usage and getattr(usage, "server_tool_use", None):
                    server_tool_use = usage.server_tool_use
                    web_uses = getattr(server_tool_use, "web_search_requests", None)
                extra = current_run.extra or {}
                extra.update(
                    {
                        "step_name": step_name,
                        "anthropic_tools": ["web_search_20250305"],
                        "web_search_requests": web_uses,
                    }
                )
                current_run.extra = extra
        except Exception:
            pass
        return raw_text


# =============================================================================
# HELPER FUNCTION - Task-based config for CRO Agent and similar use cases
# =============================================================================


def get_anthropic_config_for_task(task_type: str, base_config: dict[str, Any] = None) -> dict[str, Any]:
    """
    Get optimized Anthropic config based on task complexity.

    Usage:
        from features.llm.services.llm_service import llm_service, get_anthropic_config_for_task

        config = get_anthropic_config_for_task(
            "funnel_diagnosis",
            base_config={"api_key": os.getenv("ANTHROPIC_API_KEY")}
        )
        result, model = await llm_service.invoke_structured_output(
            prompt_messages=messages,
            output_model=DiagnosisResponse,
            primary_config_dict=config,
            fixer_config_dict=fixer_config,
        )

    Args:
        task_type: Type of task - determines thinking/model selection
            COMPLEX_TASKS (enable_thinking=True): funnel_diagnosis, experiment_design,
                experiment_proposal, root_cause_analysis, pipeline_strategy,
                learning_synthesis, copy_analysis
            MODERATE_TASKS (caching only): daily_brief, status_report, alert_analysis
            SIMPLE_TASKS: everything else
        base_config: Base configuration to extend (api_key, model_name, etc.)

    Returns:
        Config dict with appropriate settings for invoke_structured_output
    """
    base = base_config or {}

    # Complex tasks that benefit from extended thinking
    COMPLEX_TASKS = {
        "funnel_diagnosis",
        "experiment_design",
        "experiment_proposal",
        "root_cause_analysis",
        "pipeline_strategy",
        "learning_synthesis",
        "copy_analysis",
    }

    # Moderate tasks - no thinking needed, but benefit from caching
    MODERATE_TASKS = {
        "daily_brief",
        "status_report",
        "alert_analysis",
        "general_response",
    }

    # Base config - always cache for cost savings on repeated system prompts
    config = {
        "provider": "anthropic",
        "model_name": base.get("model_name", "claude-sonnet-4-6"),
        "api_key": base.get("api_key") or os.environ.get("ANTHROPIC_API_KEY"),
        "enable_cache": True,  # Always cache system prompts
        "cache_ttl": "5m",
        **{k: v for k, v in base.items() if k not in ["model_name", "api_key"]},
    }

    if task_type in COMPLEX_TASKS:
        # Deep reasoning tasks - use extended thinking
        config.update(
            {
                "enable_thinking": True,
                "thinking_budget_tokens": 10000,
                "max_tokens": 16000,  # Must exceed thinking budget
            }
        )
        logger.info(f"Config for '{task_type}': COMPLEX (thinking=10k, max=16k)")

    elif task_type in MODERATE_TASKS:
        # Standard tasks - just caching
        config.update(
            {
                "enable_thinking": False,
                "max_tokens": 4096,
            }
        )
        logger.debug(f"Config for '{task_type}': MODERATE (no thinking, max=4k)")

    else:
        # Simple/unknown tasks - minimal config
        config.update(
            {
                "enable_thinking": False,
                "max_tokens": 2048,
            }
        )
        logger.debug(f"Config for '{task_type}': SIMPLE (no thinking, max=2k)")

    return config


llm_service = LLMService()
