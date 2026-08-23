from ai.summarizer import ExtractiveSummarizer


def main():

    summarizer = ExtractiveSummarizer()

    text = """
    Artificial intelligence is changing the software industry.
    Developers are increasingly using AI tools to write code.
    These tools can also help developers debug applications.
    AI systems can analyze large amounts of data quickly.
    However, AI-generated code can contain bugs and security problems.
    Developers still need to understand the code they produce.
    Companies are investing heavily in AI development.
    """

    print("\n--- Extractive Summarizer Test ---")

    summary = summarizer.summarize(text)

    print("\nOriginal:")
    print(text)

    print("\nSummary:")
    print(summary)

    print("\nSummary characters:")
    print(len(summary))


if __name__ == "__main__":
    main()