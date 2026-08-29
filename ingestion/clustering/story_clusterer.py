# clustering/story_clusterer.py

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import numpy as np

from clustering.embedding_model import generate_embeddings


SIMILARITY_THRESHOLD = 0.65
TITLE_WEIGHT = 0.25
SEMANTIC_WEIGHT = 0.60
ENTITY_WEIGHT = 0.15

# Articles older than this are not considered part of the same event.
MAX_TIME_GAP_HOURS = 72


class StoryClusterer:
    def __init__(
        self,
        threshold: float = SIMILARITY_THRESHOLD,
        max_time_gap_hours: int = MAX_TIME_GAP_HOURS,
    ):
        self.threshold = threshold
        self.max_time_gap_hours = max_time_gap_hours

    def cluster(
        self,
        stories: list[dict[str, Any]],
    ) -> list[list[str]]:

        if not stories:
            return []

        if len(stories) == 1:
            return []

        embeddings = self._generate_embeddings(
            stories
        )

        parent = list(
            range(len(stories))
        )

        def find(x: int) -> int:

            while parent[x] != x:

                parent[x] = parent[
                    parent[x]
                ]

                x = parent[x]

            return x

        def union(
            a: int,
            b: int,
        ) -> None:

            root_a = find(a)
            root_b = find(b)

            if root_a != root_b:
                parent[root_b] = root_a

        for i in range(
            len(stories)
        ):

            for j in range(
                i + 1,
                len(stories),
            ):

                score = self._calculate_score(
                    stories[i],
                    stories[j],
                    embeddings[i],
                    embeddings[j],
                )

                print(
                    f"COMPARE: "
                    f"{stories[i]['title'][:35]} <-> "
                    f"{stories[j]['title'][:35]} "
                    f"| SCORE={score:.3f}"
                )

                if score >= self.threshold:
                    print(f"  ✅ MATCH: {score:.3f} >= {self.threshold}")
                    union(i, j)

        groups: dict[
            int,
            list[str],
        ] = {}

        for index, story in enumerate(
            stories
        ):

            root = find(index)

            groups.setdefault(
                root,
                [],
            ).append(
                str(story["id"])
            )

        # Only return actual clusters.
        # A single story is not a cluster.
        return [
            story_ids
            for story_ids in groups.values()
            if len(story_ids) >= 2
        ]

    def _generate_embeddings(
        self,
        stories: list[dict[str, Any]],
    ) -> np.ndarray:

        texts = [
            self._build_embedding_text(
                story
            )
            for story in stories
        ]

        return np.asarray(
            generate_embeddings(texts)
        )

    @staticmethod
    def _build_embedding_text(
        story: dict[str, Any],
    ) -> str:

        title = (
            story.get("title") or ""
        ).strip()

        content = (
            story.get("content") or ""
        ).strip()

        # Keep the embedding focused on the headline
        # and article lead.
        lead = content[:1000]

        return f"{title}. {lead}"

    def _calculate_score(
        self,
        story_a: dict[str, Any],
        story_b: dict[str, Any],
        embedding_a: np.ndarray,
        embedding_b: np.ndarray,
    ) -> float:

        # -----------------------------------------
        # 1. Semantic similarity
        # -----------------------------------------

        semantic_similarity = (
            self._cosine_similarity(
                embedding_a,
                embedding_b,
            )
        )

        # -----------------------------------------
        # 2. Title similarity
        # -----------------------------------------

        title_similarity = (
            self._title_similarity(
                story_a.get("title", ""),
                story_b.get("title", ""),
            )
        )

        # -----------------------------------------
        # 3. Entity overlap
        # -----------------------------------------

        entity_overlap = (
            self._entity_overlap(
                story_a.get(
                    "entities",
                    [],
                ),
                story_b.get(
                    "entities",
                    [],
                ),
            )
        )

        # -----------------------------------------
        # Entity/semantic/title guard
        # -----------------------------------------

        if (
            semantic_similarity < 0.30
            and title_similarity < 0.50
            and entity_overlap == 0.0
        ):
            return 0.0

        # -----------------------------------------
        # 4. Time constraint
        # -----------------------------------------

        if not self._within_time_window(
            story_a,
            story_b,
        ):
            return 0.0

        # -----------------------------------------
        # Final score
        # -----------------------------------------

        score = (
            semantic_similarity * 0.60
            + title_similarity * 0.25
            + entity_overlap * 0.15
        )

        return float(score)

    @staticmethod
    def _cosine_similarity(
        vector_a: np.ndarray,
        vector_b: np.ndarray,
    ) -> float:

        norm_a = np.linalg.norm(
            vector_a
        )

        norm_b = np.linalg.norm(
            vector_b
        )

        if (
            norm_a == 0
            or norm_b == 0
        ):
            return 0.0

        similarity = np.dot(
            vector_a,
            vector_b,
        ) / (
            norm_a * norm_b
        )

        return float(
            similarity
        )

    @staticmethod
    def _title_similarity(
        title_a: str,
        title_b: str,
    ) -> float:

        words_a = (
            StoryClusterer._tokenize(
                title_a
            )
        )

        words_b = (
            StoryClusterer._tokenize(
                title_b
            )
        )

        if (
            not words_a
            or not words_b
        ):
            return 0.0

        intersection = (
            words_a.intersection(
                words_b
            )
        )

        union = (
            words_a.union(
                words_b
            )
        )

        if not union:
            return 0.0

        return (
            len(intersection)
            / len(union)
        )

    @staticmethod
    def _tokenize(
        text: str,
    ) -> set[str]:

        stop_words = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "of",
            "to",
            "in",
            "on",
            "for",
            "with",
            "is",
            "are",
            "was",
            "were",
            "this",
            "that",
            "new",
            "how",
            "why",
            "what",
        }

        words = (
            text.lower()
            .replace("—", " ")
            .replace("-", " ")
            .replace(":", " ")
            .replace(",", " ")
            .replace(".", " ")
            .replace("'", " ")
            .split()
        )

        return {
            word
            for word in words
            if word not in stop_words
            and len(word) > 2
        }

    @staticmethod
    def _entity_overlap(
        entities_a: list[Any],
        entities_b: list[Any],
    ) -> float:

        if (
            not entities_a
            or not entities_b
        ):
            return 0.0

        set_a = {
            str(entity)
            .strip()
            .lower()
            for entity in entities_a
            if entity
        }

        set_b = {
            str(entity)
            .strip()
            .lower()
            for entity in entities_b
            if entity
        }

        if (
            not set_a
            or not set_b
        ):
            return 0.0

        intersection = (
            set_a.intersection(
                set_b
            )
        )

        smaller_set = min(
            len(set_a),
            len(set_b),
        )

        if smaller_set == 0:
            return 0.0

        return (
            len(intersection)
            / smaller_set
        )

    def _within_time_window(
        self,
        story_a: dict[str, Any],
        story_b: dict[str, Any],
    ) -> bool:

        date_a = (
            self._parse_datetime(
                story_a.get(
                    "published_at"
                )
                or story_a.get(
                    "publishedAt"
                )
            )
        )

        date_b = (
            self._parse_datetime(
                story_b.get(
                    "published_at"
                )
                or story_b.get(
                    "publishedAt"
                )
            )
        )

        # If publication dates are unavailable,
        # don't reject the pair.
        if (
            date_a is None
            or date_b is None
        ):
            return True

        difference = abs(
            (
                date_a - date_b
            ).total_seconds()
        )

        max_seconds = (
            self.max_time_gap_hours
            * 60
            * 60
        )

        return (
            difference
            <= max_seconds
        )

    @staticmethod
    def _parse_datetime(
        value: Any,
    ) -> datetime | None:

        if value is None:
            return None

        if isinstance(
            value,
            datetime,
        ):

            if value.tzinfo is None:

                return value.replace(
                    tzinfo=timezone.utc
                )

            return value.astimezone(
                timezone.utc
            )

        if isinstance(
            value,
            str,
        ):

            try:

                parsed = (
                    datetime.fromisoformat(
                        value.replace(
                            "Z",
                            "+00:00",
                        )
                    )
                )

                if parsed.tzinfo is None:

                    parsed = (
                        parsed.replace(
                            tzinfo=timezone.utc
                        )
                    )

                return parsed.astimezone(
                    timezone.utc
                )

            except ValueError:

                return None

        return None