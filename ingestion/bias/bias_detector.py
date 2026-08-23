import re


class BiasDetector:


    def analyze(self, text):

        if not text:
            raise ValueError(
                "Text cannot be empty"
            )


        positive_words = [
            "success",
            "successful",
            "great",
            "amazing",
            "historic",
            "breakthrough",
            "win",
            "victory"
        ]


        negative_words = [
            "failure",
            "crisis",
            "danger",
            "disaster",
            "attack",
            "problem",
            "scandal",
            "warning"
        ]


        text_lower = text.lower()


        positive_count = sum(
            text_lower.count(word)
            for word in positive_words
        )


        negative_count = sum(
            text_lower.count(word)
            for word in negative_words
        )


        total = (
            positive_count +
            negative_count
        )


        if total == 0:

            tone = "neutral"
            score = 0.0

        elif positive_count > negative_count:

            tone = "positive"

            score = min(
                positive_count / total,
                1
            )

        else:

            tone = "negative"

            score = min(
                negative_count / total,
                1
            )


        signals = []


        if positive_count:
            signals.append(
                "positive emotional language"
            )


        if negative_count:
            signals.append(
                "negative emotional language"
            )


        if re.search(
            r"!{2,}",
            text
        ):
            signals.append(
                "excessive punctuation"
            )


        confidence = min(
            0.5 + total * 0.1,
            0.95
        )


        return {
            "bias_score": round(score, 2),
            "tone": tone,
            "confidence": round(confidence,2),
            "signals": signals
        }