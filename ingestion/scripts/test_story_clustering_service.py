from services.story_clustering_service import (
    cluster_stories
)


def main():

    print(
        "--- Story Clustering Service ---"
    )


    results = cluster_stories(
        limit=20
    )


    print("\nResults:")


    for result in results:

        print(result)



if __name__ == "__main__":
    main()