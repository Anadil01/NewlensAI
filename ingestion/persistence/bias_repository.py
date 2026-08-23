from datetime import datetime, timezone
import uuid

from persistence.database import get_connection



def save_bias_analysis(
    story_id,
    bias_score,
    tone,
    confidence,
    signals
):

    if not story_id:
        raise ValueError(
            "story_id cannot be empty"
        )


    connection = get_connection()


    try:

        cursor = connection.cursor()


        # Check existing analysis

        cursor.execute(
            """
            SELECT id
            FROM bias_analysis
            WHERE story_id = %s
            """,
            (
                story_id,
            )
        )


        existing = cursor.fetchone()


        if existing:

            analysis_id = existing[0]


            cursor.execute(
                """
                UPDATE bias_analysis
                SET
                    bias_score = %s,
                    tone = %s,
                    confidence = %s,
                    signals = %s
                WHERE id = %s
                """,
                (
                    bias_score,
                    tone,
                    confidence,
                    ", ".join(signals),
                    analysis_id
                )
            )


            action = "updated"


        else:

            analysis_id = str(
                uuid.uuid4()
            )


            cursor.execute(
                """
                INSERT INTO bias_analysis
                (
                    id,
                    story_id,
                    bias_score,
                    tone,
                    confidence,
                    signals,
                    created_at
                )
                VALUES
                (
                    %s,%s,%s,%s,%s,%s,%s
                )
                """,
                (
                    analysis_id,
                    story_id,
                    bias_score,
                    tone,
                    confidence,
                    ", ".join(signals),
                    datetime.now(timezone.utc)
                )
            )


            action = "inserted"


        connection.commit()


        return {
            "action": action,
            "bias_id": str(analysis_id)
        }


    except Exception:

        connection.rollback()

        raise


    finally:

        connection.close()