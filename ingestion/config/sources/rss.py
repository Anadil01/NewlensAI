from scrapers.rss_scraper import scrape_rss_feed


def make_rss_source(slug, name, website_url, feed_url, political_lean="UNKNOWN", reliability_score=None):
    return {
        "slug": slug,
        "name": name,
        "website_url": website_url,
        "type": "RSS",
        "political_lean": political_lean,
        "reliability_score": reliability_score,
        "enabled": True,
        "scraper": lambda: scrape_rss_feed(feed_url, name),
    }


# A declarative catalog: adding a vetted source requires data only, not a new scraper.
rss_sources = [
    make_rss_source("bbc-world", "BBC News World", "https://www.bbc.com/news/world", "https://feeds.bbci.co.uk/news/world/rss.xml", "CENTER", 0.80),
    make_rss_source("techcrunch", "TechCrunch", "https://techcrunch.com", "https://techcrunch.com/feed/", "UNKNOWN", 0.70),
    make_rss_source("the-verge", "The Verge", "https://www.theverge.com", "https://www.theverge.com/rss/index.xml", "UNKNOWN", 0.70),
]
