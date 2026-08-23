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


        cluster_id = str(
            uuid.uuid4()
        )


        now = datetime.now(
            timezone.utc
        )


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
                %s,%s,%s,%s,%s
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
            SET cluster_id=%s,
                updated_at=%s
            WHERE id=%s
            """,
            (
                cluster_id,
                datetime.now(timezone.utc),
                story_id
            )
        )


        connection.commit()


    except Exception:

        connection.rollback()
        raise


    finally:

        connection.close()