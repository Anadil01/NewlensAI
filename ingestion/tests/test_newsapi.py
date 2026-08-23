from clients.newsapi_client import NewsAPIClient


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