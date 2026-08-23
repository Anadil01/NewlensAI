from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class StoryClusterer:

    def __init__(self, threshold=0.2):
        self.threshold = threshold

    def cluster(self, stories):

        if not stories:
            return []

        texts = []

        for story in stories:

            title = story.get("title", "")
            content = story.get("content", "")

            text = f"{title} {content[:5000]}"

            texts.append(text)

        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )

        vectors = vectorizer.fit_transform(texts)

        similarity = cosine_similarity(vectors)

        clusters = []

        visited = set()

        for index in range(len(stories)):

            if index in visited:
                continue

            cluster = [
                stories[index]["id"]
            ]

            visited.add(index)

            for other in range(
                index + 1,
                len(stories)
            ):

                score = similarity[index][other]

                if score >= self.threshold:

                    cluster.append(
                        stories[other]["id"]
                    )

                    visited.add(other)

            clusters.append(cluster)

        return clusters