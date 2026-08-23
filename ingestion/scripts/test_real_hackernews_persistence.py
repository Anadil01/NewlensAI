from config.sources.hackernews import hackernews_source

from persistence.story_repository import (
    get_or_create_source,
    save_story
)


def main():

    source = hackernews_source

    source_id = get_or_create_source(
        name=source["name"],
        slug=source["slug"],
        source_type=source["type"],
        website_url=source.get("website_url")
    )

    print("Source ID:", source_id)

    articles = source["scraper"]()

    print(
        f"Fetched {len(articles)} Hacker News articles"
    )

    inserted = 0
    updated = 0

    for article in articles[:3]:

        result = save_story(
            source_id,
            article
        )

        print(
            f"{article['title']} → {result['action']}"
        )

        if result["action"] == "inserted":
            inserted += 1

        elif result["action"] == "updated":
            updated += 1

    print()
    print("Persistence result:")
    print("Inserted:", inserted)
    print("Updated:", updated)


if __name__ == "__main__":
    main()