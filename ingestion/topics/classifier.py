class TopicClassifier:

    def __init__(self):

        self.topic_rules = {

            "Artificial Intelligence": [
                "ai",
                "artificial intelligence",
                "machine learning",
                "deep learning",
                "gpt",
                "llm",
                "neural network",
                "openai"
            ],

            "Technology": [
                "software",
                "hardware",
                "computer",
                "google",
                "apple",
                "microsoft",
                "linux",
                "developer",
                "programming"
            ],

            "Cyber Security": [
                "security",
                "hack",
                "vulnerability",
                "malware",
                "exploit",
                "breach"
            ],

            "Science": [
                "research",
                "study",
                "experiment",
                "scientist",
                "physics",
                "biology"
            ],

            "Business": [
                "company",
                "startup",
                "market",
                "investment",
                "revenue"
            ]
        }


    def classify(self, text):

        if not text:
            raise ValueError(
                "Text cannot be empty"
            )


        text = text.lower()


        detected = []


        for topic, keywords in self.topic_rules.items():

            score = 0


            for keyword in keywords:

                if keyword in text:
                    score += 1


            if score > 0:

                confidence = min(
                    score / len(keywords),
                    1
                )


                detected.append({

                    "topic": topic,

                    "score": round(
                        confidence,
                        2
                    )

                })


        return detected