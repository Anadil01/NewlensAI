"""Manual verification script for the NewsAPI client.

Moved here from ingestion/tests/ because it is not an automated test: it makes a
real NewsAPI request and consumes live quota. It lives alongside the other
manual scripts and is excluded from pytest collection by pytest.ini.

Run from the ingestion/ directory:
    ./venv/bin/python -m scripts.test_newsapi
"""

from clients.newsapi_client import NewsAPIClient


def main():

    client = NewsAPIClient()

    articles = client.get_top_headlines(
        country="in",
        page_size=5,
    )

    print(f"Fetched articles: {len(articles)}")

    for article in articles:
        print({
            "title": article.get("title"),
            "source": article.get("source", {}).get("name"),
            "url": article.get("url"),
        })


if __name__ == "__main__":
    main()
