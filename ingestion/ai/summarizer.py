import re


class Summarizer:

    def summarize(self, text):
        """
        Generate a summary from article text.
        """

        if not text:
            raise ValueError(
                "Text cannot be empty"
            )

        raise NotImplementedError(
            "Summarizer implementation required"
        )


class MockSummarizer(Summarizer):

    def summarize(self, text):

        if not text:
            raise ValueError(
                "Text cannot be empty"
            )

        words = text.split()

        summary_words = words[:50]

        return " ".join(summary_words)


class ExtractiveSummarizer(Summarizer):

    def summarize(self, text):

        if not text:
            raise ValueError(
                "Text cannot be empty"
            )

        # --------------------------------
        # Split text into sentences
        # --------------------------------

        sentences = re.split(
            r'(?<=[.!?])\s+',
            text.strip()
        )

        sentences = [
            sentence.strip()
            for sentence in sentences
            if sentence.strip()
        ]

        if not sentences:
            raise ValueError(
                "Could not find sentences"
            )

        # --------------------------------
        # Very short article
        # --------------------------------

        if len(sentences) <= 3:

            return " ".join(sentences)

        # --------------------------------
        # Calculate word frequency
        # --------------------------------

        words = re.findall(
            r'\b[a-zA-Z]{3,}\b',
            text.lower()
        )

        stop_words = {
            "the",
            "and",
            "that",
            "this",
            "with",
            "from",
            "have",
            "will",
            "are",
            "was",
            "were",
            "for",
            "you",
            "your",
            "they",
            "their",
            "about",
            "into",
            "than",
            "then",
            "also",
            "been",
            "being",
            "which",
            "when",
            "where",
            "what",
            "how",
            "why",
            "can",
            "could",
            "would",
            "should",
            "has",
            "had"
        }

        frequency = {}

        for word in words:

            if word in stop_words:
                continue

            frequency[word] = (
                frequency.get(word, 0) + 1
            )

        # --------------------------------
        # Score sentences
        # --------------------------------

        sentence_scores = []

        for index, sentence in enumerate(sentences):

            sentence_words = re.findall(
                r'\b[a-zA-Z]{3,}\b',
                sentence.lower()
            )

            if not sentence_words:
                continue

            score = sum(
                frequency.get(word, 0)
                for word in sentence_words
            )

            # Slightly favor earlier sentences.
            position_bonus = max(
                0,
                len(sentences) - index
            ) * 0.1

            score += position_bonus

            sentence_scores.append(
                (
                    score,
                    index,
                    sentence
                )
            )

        # --------------------------------
        # Select top sentences
        # --------------------------------

        sentence_scores.sort(
            reverse=True
        )

        number_of_sentences = min(
            3,
            len(sentence_scores)
        )

        selected = sentence_scores[
            :number_of_sentences
        ]

        # Restore original article order.
        selected.sort(
            key=lambda item: item[1]
        )

        summary = " ".join(
            item[2]
            for item in selected
        )

        if not summary:
            raise ValueError(
                "Could not generate summary"
            )

        return summary