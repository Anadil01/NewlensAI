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

    # -----------------------------
    # Step 1: Content Extraction
    # -----------------------------

    print("\n[1] Content Extraction")

    extraction_results = extract_content_for_stories(
        limit
    )

    for result in extraction_results:
        print(result)

    # -----------------------------
    # Step 2: Summarization
    # -----------------------------

    print("\n[2] Summarization")

    summary_results = summarize_stories(
        limit
    )

    for result in summary_results:
        print(result)

    # -----------------------------
    # Step 3: Topic Classification
    # -----------------------------

    print("\n[3] Topic Classification")

    topic_results = classify_stories(
        limit
    )

    for result in topic_results:
        print(result)

    # -----------------------------
    # Step 4: Story Clustering
    # -----------------------------

    print("\n[4] Story Clustering")

    cluster_results = cluster_stories(
        limit
    )

    for result in cluster_results:
        print(result)

    # -----------------------------
    # Step 5: Bias Detection
    # -----------------------------

    print("\n[5] Bias Detection")

    bias_results = analyze_story_bias(
        limit
    )

    for result in bias_results:
        print(result)

    print("\n==============================")
    print("NewsLens Pipeline Completed")
    print("==============================")

    return {
        "extraction": extraction_results,
        "summaries": summary_results,
        "topics": topic_results,
        "clusters": cluster_results,
        "bias": bias_results
    }