import os

from .openrouter_provider import OpenRouterProvider
from .provider import AIProvider


def get_ai_provider() -> AIProvider:

    provider = os.getenv(
        "AI_PROVIDER",
        "openrouter",
    ).lower()

    if provider == "openrouter":
        return OpenRouterProvider()

    raise ValueError(
        f"Unsupported AI provider: {provider}"
    )