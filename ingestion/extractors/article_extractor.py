import requests

from bs4 import BeautifulSoup


MIN_CONTENT_LENGTH = 1000


def extract_article_content(url):

    if not url:
        raise ValueError(
            "Article URL cannot be empty"
        )

    response = requests.get(
        url,
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

    # --------------------------------
    # Remove obvious non-content
    # --------------------------------

    for element in soup(
        [
            "script",
            "style",
            "nav",
            "footer",
            "header",
            "aside",
            "form",
            "noscript",
            "iframe"
        ]
    ):
        element.decompose()

    # --------------------------------
    # Strategy 1: <article>
    # --------------------------------

    article = soup.find("article")

    if article:

        text = article.get_text(
            separator=" ",
            strip=True
        )

    else:

        text = ""

    # --------------------------------
    # Strategy 2: Common article containers
    # --------------------------------

    if len(text) < MIN_CONTENT_LENGTH:

        selectors = [
            "[class*='article-body']",
            "[class*='article-content']",
            "[class*='article__body']",
            "[class*='post-content']",
            "[class*='entry-content']",
            "[class*='story-body']",
            "[class*='story-content']",
            "[itemprop='articleBody']"
        ]

        candidates = []

        for selector in selectors:

            elements = soup.select(selector)

            for element in elements:

                candidate = element.get_text(
                    separator=" ",
                    strip=True
                )

                if candidate:
                    candidates.append(candidate)

        if candidates:

            best_candidate = max(
                candidates,
                key=len
            )

            if len(best_candidate) > len(text):

                text = best_candidate

    # --------------------------------
    # Strategy 3: Full page fallback
    # --------------------------------

    if len(text) < MIN_CONTENT_LENGTH:

        text = soup.get_text(
            separator=" ",
            strip=True
        )

    # --------------------------------
    # Normalize whitespace
    # --------------------------------

    text = " ".join(
        text.split()
    )

    # --------------------------------
    # Quality validation
    # --------------------------------

    if not text:

        raise ValueError(
            "Could not extract article content"
        )

    if len(text) < MIN_CONTENT_LENGTH:

        raise ValueError(
            f"Extracted content is too short "
            f"({len(text)} characters)"
        )

    return text