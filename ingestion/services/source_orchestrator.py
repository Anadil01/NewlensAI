from config.sources.registry import get_active_sources

from validators.article_validator import validate_article

from persistence.story_repository import (
    get_or_create_source,
    save_story
)


def run_all_sources():

    sources = get_active_sources()

    all_articles = []
    results = []

    for source in sources:

        source_name = source["name"]

        print(
            f"Starting source: {source_name}"
        )

        try:

            # -----------------------------
            # Scrape
            # -----------------------------

            scraper = source["scraper"]

            articles = scraper()

            if not isinstance(articles, list):

                raise ValueError(
                    f"{source_name} scraper must return a list"
                )


            # -----------------------------
            # Validate articles
            # -----------------------------

            valid_articles = []
            invalid_articles = []

            for article in articles:

                is_valid, error = validate_article(
                    article
                )

                if is_valid:

                    valid_articles.append(article)

                else:

                    invalid_articles.append({
                        "article": article,
                        "error": error
                    })

                    print(
                        f"{source_name} article skipped: "
                        f"{error}"
                    )


            # -----------------------------
            # Get / create source
            # -----------------------------

            source_id = get_or_create_source(

                name=source["name"],

                slug=source["slug"],

                source_type=source["type"],

                website_url=source.get("website_url")
            )


            inserted = 0
            updated = 0


            # -----------------------------
            # Persist valid stories
            # -----------------------------

            for article in valid_articles:

                persistence_result = save_story(

                    source_id,

                    article
                )

                if persistence_result["action"] == "inserted":

                    inserted += 1

                elif persistence_result["action"] == "updated":

                    updated += 1


            # -----------------------------
            # Add valid articles
            # -----------------------------

            all_articles.extend(
                valid_articles
            )


            # -----------------------------
            # Successful source result
            # -----------------------------

            result = {

                "source": source["slug"],

                "success": True,

                "fetched": len(articles),

                "valid": len(valid_articles),

                "invalid": len(invalid_articles),

                "inserted": inserted,

                "updated": updated
            }

            results.append(result)


            print(

                f"{source_name}: "

                f"{len(articles)} fetched, "

                f"{len(valid_articles)} valid, "

                f"{len(invalid_articles)} invalid, "

                f"{inserted} inserted, "

                f"{updated} updated"
            )


        except Exception as error:

            result = {

                "source": source["slug"],

                "success": False,

                "fetched": 0,

                "valid": 0,

                "invalid": 0,

                "inserted": 0,

                "updated": 0,

                "error": str(error)
            }

            results.append(result)


            print(

                f"{source_name} failed: "

                f"{error}"
            )


    return {

        "articles": all_articles,

        "results": results
    }