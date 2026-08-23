from services.ingestion_pipeline import (
    run_ingestion_pipeline
)


def main():

    result = run_ingestion_pipeline(
        limit=3
    )

    print("\nFINAL RESULT")

    print(result)


if __name__ == "__main__":
    main()