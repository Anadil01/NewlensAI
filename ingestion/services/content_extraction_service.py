from extractors.article_extractor import (
    extract_article_content
)

from nlp.text_preprocessor import (
    preprocess_text
)

from persistence.story_repository import (
    get_stories_needing_content,
    update_story_content
)


def extract_content_for_stories(limit=10):

    stories = get_stories_needing_content(
        limit
    )

    results = []

    for story in stories:

        story_id = story["id"]

        url = story["canonical_url"]

        title = story["title"]

        print(
            f"Extracting: {title}"
        )

        try:

            raw_content = extract_article_content(
                url
            )
            content = preprocess_text(
              raw_content
            )
            update_story_content(
                story_id,
                content
            )

            results.append({
                "story_id": story_id,
                "success": True,
                "characters": len(content)
            })

            print(
                f"Success: {len(content)} characters"
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