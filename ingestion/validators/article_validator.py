REQUIRED_FIELDS = [
    "external_id",
    "title",
    "canonical_url"
]


def validate_article(article):

    if not isinstance(article, dict):
        return False, "Article must be a dictionary"

    for field in REQUIRED_FIELDS:

        value = article.get(field)

        if value is None:
            return False, f"Missing required field: {field}"

        if not isinstance(value, str):
            return False, f"{field} must be a string"

        if not value.strip():
            return False, f"{field} cannot be empty"

    return True, None