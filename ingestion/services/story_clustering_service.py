from clustering.story_clusterer import StoryClusterer

from persistence.database import get_connection

from persistence.cluster_repository import (
    create_cluster_with_stories
)


def get_stories_for_clustering(limit=20):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                s.id,
                s.title,
                s.content,
                s.published_at,
                COALESCE(a.entities, '[]'::jsonb) AS entities
            FROM stories s
            LEFT JOIN LATERAL (
                SELECT entities
                FROM ai_summaries
                WHERE story_id = s.id
                ORDER BY created_at DESC
                LIMIT 1
            ) a ON TRUE
            WHERE s.content IS NOT NULL
              AND s.content != ''
              AND s.cluster_id IS NULL
            ORDER BY s.created_at ASC
            LIMIT %s
            """,
            (limit,)
        )

        rows = cursor.fetchall()

        stories = []

        for row in rows:

            stories.append({
                "id": str(row[0]),
                "title": row[1],
                "content": row[2],
                "published_at": row[3],
                "entities": row[4] or []
            })

        return stories

    finally:

        connection.close()


def cluster_stories(
    limit=20,
    clusterer=None
):

    if clusterer is None:

        clusterer = StoryClusterer(
            threshold=0.3
        )

    stories = get_stories_for_clustering(
        limit
    )

    if not stories:

        return []

    clusters = clusterer.cluster(
        stories
    )

    results = []

    for index, cluster_story_ids in enumerate(
        clusters
    ):

        # Ignore single stories
        if len(cluster_story_ids) < 2:

            continue

        cluster_title = (
            f"News Cluster {index + 1}"
        )

        cluster_id = create_cluster_with_stories(
            title=cluster_title,
            description=(
                "Automatically generated story cluster"
            ),
            story_ids=cluster_story_ids
        )

        results.append({
            "cluster_id": cluster_id,
            "stories": cluster_story_ids
        })

        print(
            f"Created cluster {cluster_id}"
        )

    return results