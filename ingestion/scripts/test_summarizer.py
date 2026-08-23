from ai.summarizer import MockSummarizer


def main():

    summarizer = MockSummarizer()

    article = """
    Artificial intelligence is changing the way
    developers build software. Modern AI systems
    can help programmers write code, analyze data,
    debug applications, and automate repetitive tasks.
    However, developers still need to understand the
    underlying systems because AI-generated code can
    contain errors and security problems.
    """

    print("--- Valid Article Test ---")

    summary = summarizer.summarize(
        article
    )

    print("Summary:")
    print(summary)

    print("\n--- Empty Article Test ---")

    try:

        summarizer.summarize("")

    except Exception as error:

        print(
            f"Expected failure: {error}"
        )


if __name__ == "__main__":
    main()