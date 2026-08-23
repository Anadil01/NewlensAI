import re


def preprocess_text(text):
    """
    Clean and normalize extracted article text.
    """

    if not text:
        raise ValueError("Text cannot be empty")

    # Remove HTML tags if any remain
    text = re.sub(r"<[^>]+>", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    # Remove excessive repeated punctuation
    text = re.sub(r"!{2,}", "!", text)
    text = re.sub(r"\?{2,}", "?", text)
    text = re.sub(r"\.{3,}", "...", text)

    # Remove leading/trailing whitespace
    text = text.strip()

    if len(text) < 100:
        raise ValueError(
            "Preprocessed text is too short"
        )

    return text