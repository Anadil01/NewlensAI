from topics.classifier import TopicClassifier

from persistence.database import get_connection

from persistence.topic_repository import (
    get_or_create_topic,
    save_story_topic
)


def get_stories_needing_topics(limit=10):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                s.id,
                s.content
            FROM stories s
            WHERE s.content IS NOT NULL
              AND LENGTH(TRIM(s.content)) >= 100
              AND NOT EXISTS (
                  SELECT 1
                  FROM story_topics st
                  WHERE st.story_id = s.id
              )
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
                "content": row[1]
            })

        return stories

    finally:

        connection.close()


def classify_stories(
    limit=10,
    classifier=None
):

    if classifier is None:

        classifier = TopicClassifier()

    stories = get_stories_needing_topics(
        limit
    )

    results = []

    for story in stories:

        story_id = story["id"]

        print(
            f"Classifying story: {story_id}"
        )

        try:

            content = story["content"].strip()

            if len(content) < 100:
                continue

            topics = classifier.classify(
                content
            )

            saved_topics = []

            for item in topics:

                topic_id = get_or_create_topic(
                    item["topic"]
                )

                save_story_topic(
                    story_id,
                    topic_id
                )

                saved_topics.append(
                    item["topic"]
                )

            results.append({

                "story_id": story_id,

                "success": True,

                "topics": saved_topics

            })

            print(
                f"Topics: {saved_topics}"
            )

        except Exception as error:

            results.append({

                "story_id": story_id,

                "success": False,

                "error": str(error)

            })

            print(
                f"Failed: {error}"
            )

    return results