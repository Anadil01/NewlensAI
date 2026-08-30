from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

import requests

from normalizers.rss_normalizer import normalize_rss_article


USER_AGENT = "NewsLensAI Bot/1.0 (+https://newslens.ai)"


def _text(element, *names):
    for name in names:
        child = element.find(name)
        if child is not None and child.text:
            return child.text.strip()
    return None


def _parse_date(value):
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc)
    except (TypeError, ValueError):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
        except ValueError:
            return None


def scrape_rss_feed(feed_url, source_name, limit=20):
    response = requests.get(feed_url, timeout=15, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    root = ElementTree.fromstring(response.content)

    entries = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
    articles = []

    for entry in entries[:limit]:
        atom_link = entry.find("{http://www.w3.org/2005/Atom}link[@href]")
        url = _text(entry, "link") or (atom_link.get("href") if atom_link is not None else None)
        article = normalize_rss_article({
            "title": _text(entry, "title", "{http://www.w3.org/2005/Atom}title"),
            "url": url,
            "author": _text(entry, "author", "{http://purl.org/dc/elements/1.1/}creator"),
            "excerpt": _text(entry, "description", "{http://www.w3.org/2005/Atom}summary"),
            "published_at": _parse_date(_text(entry, "pubDate", "{http://www.w3.org/2005/Atom}published", "{http://www.w3.org/2005/Atom}updated")),
        }, source_name)
        articles.append(article)

    return articles
