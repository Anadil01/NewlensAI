from scrapers.hackernews_scraper import scrape_hacker_news


hackernews_source = {
    "slug": "hacker-news",
    "name": "Hacker News",
    "website_url": "https://news.ycombinator.com",
    "type": "WEBSITE",
    "political_lean": "UNKNOWN",
    "reliability_score": 0.70,
    "enabled": True,
    "scraper": scrape_hacker_news
}
