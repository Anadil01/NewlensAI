import time
import os

from services.content_extraction_service import (
    extract_content_for_stories
)

from services.summarization_service import (
    summarize_stories
)

from services.topic_classification_service import (
    classify_stories
)

from services.story_clustering_service import (
    cluster_stories
)

from services.bias_detection_service import (
    analyze_story_bias
)

from services.source_orchestrator import (
    run_all_sources
)


STAGE_MAX_ATTEMPTS = int(os.getenv("PIPELINE_STAGE_MAX_ATTEMPTS", "3"))
STAGE_RETRY_DELAY_SECONDS = float(os.getenv("PIPELINE_STAGE_RETRY_DELAY_SECONDS", "1"))


def ingest_sources(_limit):
    """Run all configured sources and expose their per-source job results.

    Source collection has its own source-specific batch sizes.  The pipeline
    limit applies to the downstream enrichment stages, which operate on the
    persisted stories returned by this stage.
    """
    return run_all_sources()["results"]


def run_stage_with_retries(key, step_fn, limit):
    """Run a whole stage with bounded exponential retries.

    Per-story errors remain in the stage result; retries are reserved for
    infrastructure failures such as a temporarily unavailable provider or DB.
    """
    last_error = None

    for attempt in range(1, STAGE_MAX_ATTEMPTS + 1):
        try:
            return step_fn(limit), attempt
        except Exception as error:
            last_error = error
            if attempt == STAGE_MAX_ATTEMPTS:
                break

            delay = STAGE_RETRY_DELAY_SECONDS * (2 ** (attempt - 1))
            print(f"Stage {key} failed on attempt {attempt}; retrying in {delay:.1f}s: {error}")
            time.sleep(delay)

    raise last_error


def run_ingestion_pipeline(limit=10):

    pipeline_start = time.perf_counter()

    print("\n==============================")
    print("NewsLensAI Pipeline Started")
    print("==============================")

    results = {
        "sources": [],
        "extraction": [],
        "summaries": [],
        "topics": [],
        "clusters": [],
        "bias": [],
        "errors": {},
        "metrics": {
            "limit": limit,
            "total_duration_seconds": 0,
            "stages": {}
        }
    }

    steps = [
        (
            "sources",
            "[1] Source Ingestion",
            ingest_sources
        ),
        (
            "extraction",
            "[2] Content Extraction",
            extract_content_for_stories
        ),
        (
            "summaries",
            "[3] Summarization",
            summarize_stories
        ),
        (
            "topics",
            "[4] Topic Classification",
            classify_stories
        ),
        (
            "clusters",
            "[5] Story Clustering",
            cluster_stories
        ),
        (
            "bias",
            "[6] Bias Detection",
            analyze_story_bias
        ),
    ]

    for key, label, step_fn in steps:

        print(f"\n{label}")

        stage_start = time.perf_counter()

        try:

            step_results, attempts = run_stage_with_retries(
                key,
                step_fn,
                limit,
            )

            results[key] = step_results

            stage_duration = time.perf_counter() - stage_start

            successful = sum(
                1
                for result in step_results
                if result.get("success") is True
            )

            failed = len(step_results) - successful

            results["metrics"]["stages"][key] = {
                "duration_seconds": round(stage_duration, 2),
                "total": len(step_results),
                "successful": successful,
                "failed": failed,
                "attempts": attempts,
            }

            for result in step_results:
                print(result)

            print(
                f"{label} completed in "
                f"{stage_duration:.2f}s "
                f"({successful} successful, {failed} failed)"
            )

        except Exception as error:

            stage_duration = time.perf_counter() - stage_start

            results["errors"][key] = str(error)

            results["metrics"]["stages"][key] = {
                "duration_seconds": round(stage_duration, 2),
                "total": 0,
                "successful": 0,
                "failed": 0,
                "attempts": STAGE_MAX_ATTEMPTS,
                "error": str(error)
            }

            print(
                f"Step failed ({key}) "
                f"after {stage_duration:.2f}s: {error}"
            )

    total_duration = time.perf_counter() - pipeline_start

    results["metrics"]["total_duration_seconds"] = round(
        total_duration,
        2
    )

    print("\n==============================")
    print("NewsLensAI Pipeline Metrics")
    print("==============================")

    print(
        f"Total pipeline time: "
        f"{total_duration:.2f}s"
    )

    for stage, metrics in results["metrics"]["stages"].items():

        print(
            f"{stage}: "
            f"{metrics['duration_seconds']}s | "
            f"total={metrics['total']} | "
            f"success={metrics['successful']} | "
            f"failed={metrics['failed']}"
        )

    print("\n==============================")
    print("NewsLensAI Pipeline Completed")
    print("==============================")

    if results["errors"]:

        print(
            f"Completed with errors: "
            f"{results['errors']}"
        )

    return results
