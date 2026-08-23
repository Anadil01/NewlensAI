from scrapers.hackernews_scraper import scrape_hacker_news


hackernews_source = {
    "slug": "hacker-news",
    "name": "Hacker News",
    "website_url": "https://news.ycombinator.com",
    "type": "WEBSITE",
    "enabled": True,
    "scraper": scrape_hacker_news
}