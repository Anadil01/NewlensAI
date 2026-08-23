from persistence.summary_repository import save_summary


def main():

    story_id = "4a3f25d2-7f78-40a5-af8d-b2266e84bc58"

    summary = (
        "This is a test AI-generated summary "
        "for the NewsLens persistence layer."
    )

    model = "test-model"
    version = "v1"

    print("--- First Save ---")

    first = save_summary(
        story_id,
        summary,
        model,
        version
    )

    print(first)

    print("\n--- Second Save ---")

    second = save_summary(
        story_id,
        summary + " Updated.",
        model,
        version
    )

    print(second)


if __name__ == "__main__":
    main()