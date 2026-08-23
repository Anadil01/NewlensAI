from persistence.story_repository import (
    get_or_create_source,
    save_story
)


def main():

    source_id = get_or_create_source(
        name="Hacker News",
        slug="hacker-news",
        source_type="WEBSITE",
        website_url="https://news.ycombinator.com"
    )

    print("Source ID:", source_id)

    story = {
        "external_id": "test-news-001",
        "canonical_url": "https://example.com/test-news-001",
        "title": "NewsLens Persistence Test",
        "author": "test-user",
        "points": 100,
        "content": "Test article content",
        "excerpt": "Test article",
        "published_at": None
    }

    first = save_story(
        source_id,
        story
    )

    print("First save:", first)

    story["points"] = 150

    second = save_story(
        source_id,
        story
    )

    print("Second save:", second)


if __name__ == "__main__":
    main()