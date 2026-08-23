from services.topic_classification_service import (
    classify_stories
)


def main():

    print(
        "--- Topic Classification Service ---"
    )


    results = classify_stories(
        limit=5
    )


    print("\nResults:")


    for result in results:

        print(result)



if __name__ == "__main__":
    main()