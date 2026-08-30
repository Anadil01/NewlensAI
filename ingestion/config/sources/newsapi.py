from clients.newsapi_client import NewsAPIClient
from normalizers.newsapi_normalizer import normalize_newsapi_article


def scrape_newsapi():

    client = NewsAPIClient()

    articles = client.get_top_headlines(
        country="us",
        category="technology",
        page_size=10
    )

    return [
        normalize_newsapi_article(article)
        for article in articles
    ]


newsapi_source = {
    "slug": "newsapi",
    "name": "NewsAPI",
    "website_url": "https://newsapi.org",
    "type": "API",
    "political_lean": "UNKNOWN",
    "reliability_score": 0.50,
    "enabled": True,
    "scraper": scrape_newsapi
}
