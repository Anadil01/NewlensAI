from persistence.topic_repository import (
    get_or_create_topic,
    save_story_topic
)


def main():

    story_id = "4a3f25d2-7f78-40a5-af8d-b2266e84bc58"


    print("--- Topic Create ---")


    topic_id = get_or_create_topic(
        "Artificial Intelligence"
    )


    print(topic_id)


    print("--- Story Topic Save ---")


    result = save_story_topic(
        story_id,
        topic_id
    )


    print(result)



if __name__ == "__main__":
    main()