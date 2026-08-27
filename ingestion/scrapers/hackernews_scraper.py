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

        # HN puts the timestamp on the ".age" element of the
        # subtext row, as a title attribute of the form
        # "2025-01-15T12:34:56 1736944496" (ISO + unix epoch).
        published_at = None

        if subtext:

            age_element = subtext.select_one(".age")

            if age_element and age_element.get("title"):

                title_attr = age_element["title"]
                parts = title_attr.split()

                try:

                    if len(parts) == 2:
                        published_at = datetime.fromtimestamp(
                            int(parts[1]),
                            tz=timezone.utc,
                        )
                    else:
                        published_at = datetime.fromisoformat(
                            parts[0]
                        ).replace(tzinfo=timezone.utc)

                except (ValueError, OSError):
                    published_at = None

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