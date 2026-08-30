from __future__ import annotations

from typing import Any

from clustering.story_clusterer import StoryClusterer
from persistence.cluster_repository import create_cluster_with_stories
from persistence.database import get_connection


MIN_CONTENT_LENGTH = 100
DEFAULT_CLUSTER_DESCRIPTION = "Automatically generated story cluster"


def get_stories_for_clustering(limit: int = 20) -> list[dict[str, Any]]:
    """Return unclustered, article-length stories in deterministic order."""
    if limit < 1:
        raise ValueError("limit must be at least 1")

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute(
            """
            SELECT s.id, s.title, s.content, s.published_at,
                   COALESCE(ai.entities, '[]'::jsonb) AS entities
            FROM stories s
            LEFT JOIN LATERAL (
                SELECT entities FROM ai_summaries
                WHERE story_id = s.id
                ORDER BY created_at DESC LIMIT 1
            ) ai ON TRUE
            WHERE s.content IS NOT NULL
              AND LENGTH(TRIM(s.content)) >= %s
              AND s.cluster_id IS NULL
            ORDER BY s.created_at ASC, s.id ASC
            LIMIT %s
            """,
            (MIN_CONTENT_LENGTH, limit),
        )
        return [
            {"id": str(row[0]), "title": row[1] or "Untitled story", "content": row[2],
             "published_at": row[3], "entities": row[4] or []}
            for row in cursor.fetchall()
        ]
    finally:
        connection.close()


def _cluster_title(story_ids: list[str], stories_by_id: dict[str, dict[str, Any]]) -> str:
    """Use a representative headline instead of an opaque numbered title."""
    title = stories_by_id[story_ids[0]]["title"].strip()
    return title[:200] or "Untitled story cluster"


def cluster_stories(limit: int = 20, clusterer: StoryClusterer | None = None) -> list[dict[str, Any]]:
    """Cluster eligible stories and persist each valid group atomically."""
    stories = get_stories_for_clustering(limit)
    if not stories:
        return []

    clusters = (clusterer or StoryClusterer()).cluster(stories)
    stories_by_id = {story["id"]: story for story in stories}
    results: list[dict[str, Any]] = []

    for story_ids in clusters:
        if len(story_ids) < 2:
            continue
        try:
            cluster_id = create_cluster_with_stories(
                title=_cluster_title(story_ids, stories_by_id),
                description=DEFAULT_CLUSTER_DESCRIPTION,
                story_ids=story_ids,
            )
            results.append({"success": True, "cluster_id": cluster_id, "stories": story_ids})
            print(f"Created cluster {cluster_id} with {len(story_ids)} stories")
        except Exception as error:
            results.append({"success": False, "stories": story_ids, "error": str(error)})
            print(f"Failed to create cluster for {story_ids}: {error}")

    return results
