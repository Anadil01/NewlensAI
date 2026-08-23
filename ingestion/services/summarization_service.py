from ai.summarizer import ExtractiveSummarizer
from persistence.database import get_connection
from persistence.summary_repository import save_summary


def get_stories_needing_summary(limit=10):
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
                  FROM ai_summaries a
                  WHERE a.story_id = s.id
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


def get_stories_by_ids(story_ids):
    """
    Fetch specific stories by their IDs.
    """

    if not story_ids:
        return []

    connection = get_connection()

    try:
        cursor = connection.cursor()

        placeholders = ", ".join(
            ["%s"] * len(story_ids)
        )

        cursor.execute(
            f"""
            SELECT
                s.id,
                s.title,
                s.content
            FROM stories s
            WHERE s.id IN ({placeholders})
              AND s.content IS NOT NULL
              AND s.content != ''
            ORDER BY s.created_at ASC
            """,
            tuple(story_ids)
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


def summarize_stories(
    limit=10,
    story_ids=None,
    summarizer=None,
    model="mock-model",
    version="v1"
):
    """
    Generate and persist summaries for stories.

    If story_ids are provided, summarize those specific stories.
    Otherwise, summarize the oldest stories that still need summaries.

    Returns a result for every story processed.
    """

    if summarizer is None:
        summarizer = ExtractiveSummarizer()

    if story_ids:
        stories = get_stories_by_ids(
            story_ids
        )
    else:
        stories = get_stories_needing_summary(
            limit
        )

    results = []

    for story in stories:

        story_id = story["id"]
        title = story["title"]
        content = story["content"]

        print(
            f"Summarizing: {title}"
        )

        try:

            summary = summarizer.summarize(
                content
            )

            saved = save_summary(
                story_id=story_id,
                summary=summary,
                model=model,
                version=version
            )

            results.append({
                "story_id": story_id,
                "success": True,
                "characters": len(summary),
                "action": saved["action"],
                "summary_id": saved["summary_id"]
            })

            print(
                f"Success: {len(summary)} characters"
            )

        except Exception as error:

            results.append({
                "story_id": story_id,
                "success": False,
                "characters": 0,
                "error": str(error)
            })

            print(
                f"Failed: {error}"
            )

    return results