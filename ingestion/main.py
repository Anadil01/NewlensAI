from clients.newsapi_client import NewsAPIClient
from normalizers.article_normalizer import normalize_newsapi_article
from scrapers.hackernews_scraper import scrape_hacker_news

def main():

    client = NewsAPIClient()
    stories = scrape_hacker_news()

    print(
        f"Stories fetched: {len(stories)}"
    )

    for story in stories:

        print("----------------")
        print(story)

    articles = client.get_top_headlines(
        country="us",
        category="technology",
        page_size=5
    )


    normalized_articles = []


    for article in articles:

        normalized = normalize_newsapi_article(
            article
        )

        normalized_articles.append(
            normalized
        )


    for article in normalized_articles:

        print(article)



if __name__ == "__main__":
    main()