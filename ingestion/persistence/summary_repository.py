
from datetime import datetime, timezone
import uuid

from persistence.database import get_connection


def save_summary(
    story_id,
    summary,
    model,
    version,
    entities=None,
):
    """
    Save an AI-generated summary.

    A story can have multiple summaries,
    but the same story/model/version combination
    must remain unique.

    Entities are stored as JSON.
    """
    from psycopg2.extras import Json

    # ---------------------------------------------
    # Validation
    # ---------------------------------------------

    if not story_id:
        raise ValueError(
            "story_id cannot be empty"
        )

    if not summary:
        raise ValueError(
            "summary cannot be empty"
        )

    if not model:
        raise ValueError(
            "model cannot be empty"
        )

    if not version:
        raise ValueError(
            "version cannot be empty"
        )

    # ---------------------------------------------
    # Normalize entities
    # ---------------------------------------------

    if entities is None:
        entities = []

    if not isinstance(entities, list):
        raise ValueError(
            "entities must be a list"
        )

    entities = [
        str(entity).strip()
        for entity in entities
        if str(entity).strip()
    ][:8]

    # ---------------------------------------------
    # Database connection
    # ---------------------------------------------

    connection = get_connection()

    try:

        cursor = connection.cursor()

        # -----------------------------------------
        # Check whether this exact summary exists
        # -----------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM ai_summaries
            WHERE story_id = %s
              AND model = %s
              AND version = %s
            """,
            (
                story_id,
                model,
                version,
            ),
        )

        existing = cursor.fetchone()

        # -----------------------------------------
        # UPDATE existing summary
        # -----------------------------------------

        if existing:

            summary_id = existing[0]

            cursor.execute(
                """
                UPDATE ai_summaries
                SET
                    summary = %s,
                    entities = %s
                WHERE id = %s
                """,
                (
                    summary,
                    Json(entities),
                    summary_id,
                ),
            )

            action = "updated"

        # -----------------------------------------
        # INSERT new summary
        # -----------------------------------------

        else:

            summary_id = str(
                uuid.uuid4()
            )

            cursor.execute(
                """
                INSERT INTO ai_summaries (
                    id,
                    story_id,
                    summary,
                    model,
                    version,
                    entities,
                    created_at
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s
                )
                """,
                (
                    summary_id,
                    story_id,
                    summary,
                    model,
                    version,
                    Json(entities),
                    datetime.now(timezone.utc),
                ),
            )

            action = "inserted"

        # -----------------------------------------
        # Commit
        # -----------------------------------------

        connection.commit()

        return {
            "action": action,
            "summary_id": str(summary_id),
        }

    except Exception:

        connection.rollback()

        raise

    finally:

        connection.close()


def get_summary_for_story(
    story_id,
    model,
    version,
):
    """
    Return the cached summary for a story,
    model, and version.

    Returns None if no matching summary exists.
    """

    # ---------------------------------------------
    # Validation
    # ---------------------------------------------

    if not story_id:
        raise ValueError(
            "story_id cannot be empty"
        )

    if not model:
        raise ValueError(
            "model cannot be empty"
        )

    if not version:
        raise ValueError(
            "version cannot be empty"
        )

    # ---------------------------------------------
    # Database connection
    # ---------------------------------------------

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                story_id,
                summary,
                model,
                version,
                entities,
                created_at
            FROM ai_summaries
            WHERE story_id = %s
              AND model = %s
              AND version = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (
                story_id,
                model,
                version,
            ),
        )

        row = cursor.fetchone()

        if not row:
            return None

        return {
            "summary_id": str(row[0]),
            "story_id": str(row[1]),
            "summary": row[2],
            "model": row[3],
            "version": row[4],
            "entities": row[5] or [],
            "created_at": row[6],
        }

    finally:

        connection.close()
