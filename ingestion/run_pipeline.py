import sys

from pathlib import Path

# Make the ingestion project root importable no matter which working
# directory the worker launches us from (the Node ingestion worker runs
# this script with cwd set to the ingestion directory, but be defensive).
sys.path.insert(0, str(Path(__file__).resolve().parent))

from services.ingestion_pipeline import run_ingestion_pipeline


def main():

    limit = 10

    # Optional CLI override: `python run_pipeline.py 25`
    if len(sys.argv) > 1:

        try:
            limit = int(sys.argv[1])
        except ValueError:
            print(
                f"Invalid limit '{sys.argv[1]}', "
                f"falling back to {limit}"
            )

    run_ingestion_pipeline(limit=limit)


if __name__ == "__main__":
    main()
