from validators.article_validator import validate_article


def main():

    valid_article = {
        "external_id": "123",
        "title": "Test Article",
        "canonical_url": "https://example.com/article"
    }

    invalid_article = {
        "external_id": "456",
        "title": "",
        "canonical_url": "https://example.com/article"
    }


    valid, error = validate_article(
        valid_article
    )

    print(
        "Valid article:",
        valid,
        error
    )


    valid, error = validate_article(
        invalid_article
    )

    print(
        "Invalid article:",
        valid,
        error
    )


if __name__ == "__main__":
    main()