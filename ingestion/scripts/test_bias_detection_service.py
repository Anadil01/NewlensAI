from services.bias_detection_service import (
    analyze_story_bias
)


def main():

    print(
        "--- Bias Detection Service ---"
    )


    results = analyze_story_bias(
        limit=5
    )


    for result in results:

        print(result)



if __name__ == "__main__":
    main()