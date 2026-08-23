from bias.bias_detector import BiasDetector

from persistence.database import get_connection

from persistence.bias_repository import (
    save_bias_analysis
)


def get_stories_needing_bias_analysis(limit=10):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                s.id,
                s.title,
                s.content
            FROM stories s
            WHERE s.content IS NOT NULL
              AND s.content != ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM bias_analysis b
                  WHERE b.story_id = s.id
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
                "title": row[1],
                "content": row[2]
            })


        return stories


    finally:

        connection.close()



def analyze_story_bias(
    limit=10,
    detector=None
):

    if detector is None:
        detector = BiasDetector()


    stories = get_stories_needing_bias_analysis(
        limit
    )


    results = []


    for story in stories:

        print(
            f"Analyzing bias: {story['title']}"
        )


        try:

            analysis = detector.analyze(
                story["content"]
            )


            saved = save_bias_analysis(
                story_id=story["id"],
                bias_score=analysis["bias_score"],
                tone=analysis["tone"],
                confidence=analysis["confidence"],
                signals=analysis["signals"]
            )


            results.append({

                "story_id": story["id"],

                "success": True,

                "bias_score": analysis["bias_score"],

                "tone": analysis["tone"],

                "action": saved["action"],

                "bias_id": saved["bias_id"]

            })


        except Exception as error:


            results.append({

                "story_id": story["id"],

                "success": False,

                "error": str(error)

            })


    return results