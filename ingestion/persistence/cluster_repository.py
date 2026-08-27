import uuid

from datetime import datetime, timezone

from persistence.database import get_connection


def create_cluster(
    title,
    description=None
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cluster_id = str(uuid.uuid4())

        now = datetime.now(timezone.utc)

        cursor.execute(
            """
            INSERT INTO story_clusters(
                id,
                title,
                description,
                created_at,
                updated_at
            )
            VALUES(
                %s, %s, %s, %s, %s
            )
            """,
            (
                cluster_id,
                title,
                description,
                now,
                now
            )
        )

        connection.commit()

        return cluster_id

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def assign_story_to_cluster(
    story_id,
    cluster_id
):
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE stories
            SET cluster_id = %s,
                updated_at = %s
            WHERE id = %s
            """,
            (
                cluster_id,
                datetime.now(timezone.utc),
                story_id
            )
        )

        if cursor.rowcount != 1:
            raise ValueError(
                f"Story {story_id} was not assigned "
                f"to cluster {cluster_id}"
            )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def create_cluster_with_stories(
    title,
    description,
    story_ids
):
    """
    Atomically create a story cluster and assign
    all stories to it.

    If any story cannot be assigned, the entire
    transaction is rolled back.
    """

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cluster_id = str(uuid.uuid4())

        now = datetime.now(timezone.utc)

        # Create cluster
        cursor.execute(
            """
            INSERT INTO story_clusters(
                id,
                title,
                description,
                created_at,
                updated_at
            )
            VALUES(
                %s, %s, %s, %s, %s
            )
            """,
            (
                cluster_id,
                title,
                description,
                now,
                now
            )
        )

        # Assign all stories using the SAME transaction
        for story_id in story_ids:

            cursor.execute(
                """
                UPDATE stories
                SET cluster_id = %s,
                    updated_at = %s
                WHERE id = %s
                  AND cluster_id IS NULL
                """,
                (
                    cluster_id,
                    now,
                    story_id
                )
            )

            # Make sure the story was actually assigned.
            #
            # rowcount == 0 means:
            # - story does not exist, OR
            # - story already belongs to another cluster.
            if cursor.rowcount != 1:

                raise ValueError(
                    f"Story {story_id} could not be assigned "
                    f"to cluster {cluster_id}. "
                    f"It may already belong to another cluster."
                )

        connection.commit()

        return cluster_id

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()