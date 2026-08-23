from persistence.bias_repository import save_bias_analysis


def main():

    result = save_bias_analysis(
        story_id="e6a1b9c7-27d3-4493-b6e7-fd5c39c902c2",
        bias_score=0.45,
        tone="neutral",
        confidence=0.75,
        signals=[
            "emotional language"
        ]
    )


    print(result)



if __name__ == "__main__":
    main()