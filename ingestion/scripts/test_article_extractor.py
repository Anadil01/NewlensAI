from extractors.article_extractor import (
    extract_article_content
)


def test_valid_url():

    url = (
        "https://blog.laserphile.com/"
        "2026/08/aliexpress-webpage-keeping-multipoint.html"
    )

    print("\n--- Valid URL Test ---")

    try:

        content = extract_article_content(
            url
        )

        print(
            "Success"
        )

        print(
            f"Characters: {len(content)}"
        )

        print(
            content[:500]
        )

    except Exception as error:

        print(
            f"Failed: {error}"
        )


def test_empty_url():

    print("\n--- Empty URL Test ---")

    try:

        extract_article_content("")

    except Exception as error:

        print(
            f"Expected failure: {error}"
        )


def main():

    test_valid_url()

    test_empty_url()


if __name__ == "__main__":

    main()