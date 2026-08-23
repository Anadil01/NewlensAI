from services.content_extraction_service import (
    extract_content_for_stories
)


def main():

    results = extract_content_for_stories(
        limit=3
    )

    print("\nResults:")

    for result in results:

        print(result)


if __name__ == "__main__":

    main()