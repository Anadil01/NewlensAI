import uuid
from datetime import datetime, timezone

from persistence.database import get_connection


def get_or_create_topic(name):

    if not name:
        raise ValueError(
            "Topic name cannot be empty"
        )


    slug = name.lower().replace(
        " ",
        "-"
    )


    connection = get_connection()

    try:

        cursor = connection.cursor()


        cursor.execute(
            """
            SELECT id
            FROM topics
            WHERE slug = %s
            """,
            (slug,)
        )


        existing = cursor.fetchone()


        if existing:

            return str(existing[0])


        topic_id = str(
            uuid.uuid4()
        )


        cursor.execute(
            """
            INSERT INTO topics (
                id,
                name,
                slug,
                created_at
            )
            VALUES (
                %s,%s,%s,%s
            )
            """,
            (
                topic_id,
                name,
                slug,
                datetime.now(timezone.utc)
            )
        )


        connection.commit()


        return topic_id


    except Exception:

        connection.rollback()
        raise


    finally:

        connection.close()



def save_story_topic(
    story_id,
    topic_id
):

    connection = get_connection()


    try:

        cursor = connection.cursor()


        cursor.execute(
            """
            SELECT 1
            FROM story_topics
            WHERE story_id=%s
            AND topic_id=%s
            """,
            (
                story_id,
                topic_id
            )
        )


        exists = cursor.fetchone()


        if exists:

            return {
                "action": "exists"
            }


        cursor.execute(
            """
            INSERT INTO story_topics(
                story_id,
                topic_id
            )
            VALUES(
                %s,%s
            )
            """,
            (
                story_id,
                topic_id
            )
        )


        connection.commit()


        return {
            "action": "inserted"
        }


    except Exception:

        connection.rollback()
        raise


    finally:

        connection.close()