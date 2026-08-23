from config.sources.registry import (
    get_active_sources
)


def main():

    sources = get_active_sources()


    for source in sources:

        print(
            f"\nStarting source: "
            f"{source['name']}"
        )


        scraper = source["scraper"]


        articles = scraper()


        print(
            f"Articles fetched: "
            f"{len(articles)}"
        )


if __name__ == "__main__":
    main()