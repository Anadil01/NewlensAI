from topics.classifier import TopicClassifier


def main():

    classifier = TopicClassifier()


    text = """
    OpenAI released a new artificial intelligence
    model. Developers are using machine learning
    tools to build software applications.
    """


    print("--- Topic Classification Test ---")


    topics = classifier.classify(text)


    for topic in topics:

        print(topic)



if __name__ == "__main__":
    main()