from services.source_orchestrator import (
    run_all_sources
)


def main():

    result = run_all_sources()

    print("\nSource Results:")

    for source_result in result["results"]:

        print(source_result)

    print(
        "\nTotal articles:",
        len(result["articles"])
    )


if __name__ == "__main__":
    main()