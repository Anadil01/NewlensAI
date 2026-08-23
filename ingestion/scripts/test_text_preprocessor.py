from nlp.text_preprocessor import preprocess_text


def main():

    print("--- Valid Text Test ---")

    text = """
        Google   announced   a new AI model.

        <p>The company said the model is faster!!!</p>

        Users can ask questions???

        The new system is designed to improve performance,
        reduce latency, and provide more accurate responses
        across a wide range of applications.

        Developers will be able to integrate the model
        into their existing applications and services.
    """

    result = preprocess_text(text)

    print("Success")
    print("Characters:", len(result))
    print(result)

    print("\n--- Empty Text Test ---")

    try:

        preprocess_text("")

    except Exception as error:

        print(
            f"Expected failure: {error}"
        )


if __name__ == "__main__":
    main()