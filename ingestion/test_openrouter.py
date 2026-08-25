from dotenv import load_dotenv

load_dotenv()

from ai.openrouter_provider import OpenRouterProvider
def main():

    provider = OpenRouterProvider()

    article = """
    NVIDIA announced a new generation of artificial
    intelligence technologies designed to improve
    performance for developers and data centers.
    The company said the technology will support
    advanced AI workloads.
    """

    result = provider.generate_summary(article)

    print("\n==============================")
    print("SUMMARY")
    print("==============================")

    print(result["summary"])

    print("\n==============================")
    print("KEY POINTS")
    print("==============================")

    for point in result["keyPoints"]:
        print("-", point)

    print("\n==============================")
    print("ENTITIES")
    print("==============================")

    for entity in result["entities"]:
        print("-", entity)

    print("\n==============================")
    print("CONFIDENCE")
    print("==============================")

    print(result["confidence"])


if __name__ == "__main__":
    main()