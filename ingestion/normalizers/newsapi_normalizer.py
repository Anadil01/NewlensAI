import hashlib


def normalize_newsapi_article(article):

    url = article.get("url")

    # Create stable unique ID. NewsAPI can return articles with a null
    # url (e.g. "[Removed]" items); guard so one bad article doesn't
    # crash normalization of the whole batch. The validator rejects
    # articles with no external_id downstream.
    external_id = (
        hashlib.md5(url.encode()).hexdigest()
        if url
        else None
    )


    return {

        "external_id": external_id,

        "source": article.get(
            "source",
            {}
        ).get(
            "name"
        ),

        "canonical_url": url,

        "title": article.get(
            "title"
        ),

        "author": article.get(
            "author"
        ),

        "content": article.get(
            "content"
        ),

        "excerpt": article.get(
            "description"
        ),

        "points": None,

        "published_at": article.get(
            "publishedAt"
        )

    }