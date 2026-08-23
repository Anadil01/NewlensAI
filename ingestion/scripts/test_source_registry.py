from config.sources.registry import (
    get_active_sources,
    get_source_by_slug
)


def main():

    sources = get_active_sources()


    print(
        f"Active sources: {len(sources)}"
    )


    for source in sources:

        print(
            source["slug"],
            "|",
            source["name"],
            "|",
            source["type"]
        )


    hackernews = get_source_by_slug(
        "hacker-news"
    )


    print("\nHacker News source:")

    print({
        "slug": hackernews["slug"],
        "name": hackernews["name"],
        "type": hackernews["type"],
        "enabled": hackernews["enabled"]
    })


if __name__ == "__main__":
    main()