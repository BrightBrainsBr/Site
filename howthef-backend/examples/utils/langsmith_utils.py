# utils/langsmith_utils.py
import os

from dotenv import load_dotenv
from langsmith import Client as langsmith_client

load_dotenv()


class LangSmithService:
    _instance = None
    _client = None

    @classmethod
    def initialize(cls, client: langsmith_client) -> None:
        cls._client = client
        cls._instance = cls

    # v1 WORKING FINE
    # @classmethod
    # def get_client(cls, raise_error: bool = True) -> langsmith_client:
    #     if not cls._client:
    #         if raise_error:
    #             raise Exception("LangSmith client not initialized. Call initialize() first")
    #         cls._client = langsmith_client(
    #             api_key=os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGSMITH_API_KEY")
    #         )
    #     return cls._client

    # v2
    @classmethod
    def get_client(cls, raise_error: bool = True) -> langsmith_client:
        if not cls._client:
            api_key = os.getenv("LANGSMITH_API_KEY")
            if not api_key and raise_error:
                raise Exception("LANGSMITH_API_KEY not found in environment variables")
            elif not api_key:
                return None
            cls._client = langsmith_client(api_key=api_key)
        return cls._client
