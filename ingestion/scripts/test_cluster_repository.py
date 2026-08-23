from persistence.cluster_repository import (
    create_cluster,
    assign_story_to_cluster
)


def main():


    print("--- Create Cluster ---")


    cluster_id = create_cluster(
        title="OpenAI AI Model Launch",
        description="Stories related to OpenAI model release"
    )


    print(
        cluster_id
    )


    print("--- Assign Story ---")


    assign_story_to_cluster(
        "4a3f25d2-7f78-40a5-af8d-b2266e84bc58",
        cluster_id
    )


    print(
        "Story assigned"
    )



if __name__ == "__main__":
    main()