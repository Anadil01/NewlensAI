from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):

    @abstractmethod
    def generate_summary(
        self,
        article_text: str,
    ) -> dict[str, Any]:
        """
        Generate a structured article summary.
        """
        raise NotImplementedError