import json
import os
from typing import Any

from openai import OpenAI

from .provider import AIProvider


class OpenRouterProvider(AIProvider):

    def __init__(self):

        self.api_key = os.getenv("OPENROUTER_API_KEY")

        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is not configured"
            )

        self.base_url = os.getenv(
            "OPENROUTER_BASE_URL",
            "https://openrouter.ai/api/v1",
        )

        self.model = os.getenv(
            "AI_MODEL",
            "nvidia/nemotron-3-super-120b-a12b:free",
        )

        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    def generate_summary(
        self,
        article_text: str,
    ) -> dict[str, Any]:

        response = self.client.chat.completions.create(
            model=self.model,

            messages=[
                {
                    "role": "system",
                    "content": """
You are a professional news summarization assistant.

Analyze the provided news article and return ONLY
valid JSON.

Required structure:

{
    "summary": "Concise factual summary under 100 words.",
    "keyPoints": [
        "Important point 1",
        "Important point 2",
        "Important point 3"
    ],
    "entities": [
        "Important person, organization, place or event"
    ],
    "confidence": 0.0
}

Rules:

1. Do not invent facts.
2. Use only information present in the article.
3. Keep the summary neutral and factual.
4. Do not include markdown.
5. confidence must be between 0 and 1.
6. Return valid JSON only.
"""
                },
                {
                    "role": "user",
                    "content": article_text,
                },
            ],

            temperature=0.2,

            max_tokens=500,

            response_format={
                "type": "json_object"
            },
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "OpenRouter returned an empty response"
            )

        return self._parse_response(content)

    @staticmethod
    def _parse_response(
        content: str,
    ) -> dict[str, Any]:

        try:
            result = json.loads(content)

        except json.JSONDecodeError as exc:
            raise ValueError(
                "OpenRouter returned invalid JSON"
            ) from exc

        return {
            "summary": (
                result.get("summary", "").strip()
            ),

            "keyPoints": result.get(
                "keyPoints",
                []
            ),

            "entities": result.get(
                "entities",
                []
            ),

            "confidence": result.get(
                "confidence"
            ),
        }