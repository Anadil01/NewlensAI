from clustering.story_clusterer import StoryClusterer

from persistence.database import get_connection

from persistence.cluster_repository import (
    create_cluster,
    assign_story_to_cluster
)


def get_stories_for_clustering(limit=20):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                title,
                content
            FROM stories
            WHERE content IS NOT NULL
              AND content != ''
              AND cluster_id IS NULL
            ORDER BY created_at ASC
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
                "content": row[2]
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


    for index, cluster_story_ids in enumerate(clusters):


        # Ignore single stories
        if len(cluster_story_ids) < 2:

            continue


        cluster_title = (
            f"News Cluster {index + 1}"
        )


        cluster_id = create_cluster(
            title=cluster_title,
            description=
            "Automatically generated story cluster"
        )


        for story_id in cluster_story_ids:

            assign_story_to_cluster(
                story_id,
                cluster_id
            )


        results.append({

            "cluster_id": cluster_id,

            "stories": cluster_story_ids

        })


        print(
            f"Created cluster {cluster_id}"
        )


    return results