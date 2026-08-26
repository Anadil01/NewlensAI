import hashlib

HN_BASE_URL = "https://news.ycombinator.com"


def generate_external_id(url):
    return hashlib.sha256(url.encode()).hexdigest()


def normalize_hackernews_article(article):
    url = article.get("url")

    if url and url.startswith("/"):
        url = HN_BASE_URL + url

    return {
        "external_id": generate_external_id(url) if url else None,
        "source": "Hacker News",
        "title": article.get("title"),
        "author": article.get("author"),
        "canonical_url": url,
        "content": None,
        "excerpt": None,
        "points": article.get("points"),
        "published_at": article.get("published_at"),
    }