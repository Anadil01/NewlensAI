from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

from normalizers.article_normalizer import normalize_hackernews_article


HN_URL = "https://news.ycombinator.com/"


def scrape_hacker_news():

    response = requests.get(
        HN_URL,
        timeout=10,
        headers={
            "User-Agent": "NewsLens Bot/1.0"
        }
    )

    response.raise_for_status()

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )

    stories = []

    rows = soup.select(".athing")

    for row in rows[:10]:

        story_id = row.get("id")

        title_element = row.select_one(
            ".titleline a"
        )

        if not title_element:
            continue

        title = title_element.text.strip()
        url = title_element.get("href")

        subtext = row.find_next_sibling()

        author = None
        points = 0

        if subtext:

            author_element = subtext.select_one(
                ".hnuser"
            )

            if author_element:
                author = author_element.text

            score_element = subtext.select_one(
                ".score"
            )

            if score_element:
                points = int(
                    score_element.text.split()[0]
                )

        # HN timestamps are Unix timestamps in UTC.
        published_at = None

        if item.get("time"):
            published_at = datetime.fromtimestamp(
                item["time"],
                tz=timezone.utc
            )

        stories.append(
            normalize_hackernews_article({
                "external_id": story_id,
                "title": title,
                "url": url,
                "author": author,
                "points": points,
                "published_at": published_at,
            })
        )

    return stories