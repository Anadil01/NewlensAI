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


def run_ingestion_pipeline(limit=10):

    print("\n==============================")
    print("NewsLens Pipeline Started")
    print("==============================")

    results = {
        "extraction": [],
        "summaries": [],
        "topics": [],
        "clusters": [],
        "bias": [],
        "errors": {},
    }

    # Each stage runs independently. A failure in one stage (e.g. the AI
    # provider is unreachable) must not abort the remaining stages, so we
    # isolate each one and record the error instead of letting it propagate.
    steps = [
        ("extraction", "[1] Content Extraction", extract_content_for_stories),
        ("summaries", "[2] Summarization", summarize_stories),
        ("topics", "[3] Topic Classification", classify_stories),
        ("clusters", "[4] Story Clustering", cluster_stories),
        ("bias", "[5] Bias Detection", analyze_story_bias),
    ]

    for key, label, step_fn in steps:

        print(f"\n{label}")

        try:

            step_results = step_fn(limit)

            results[key] = step_results

            for result in step_results:
                print(result)

        except Exception as error:

            results["errors"][key] = str(error)

            print(f"Step failed ({key}): {error}")

    print("\n==============================")
    print("NewsLens Pipeline Completed")
    print("==============================")

    if results["errors"]:
        print(f"Completed with errors: {results['errors']}")

    return results