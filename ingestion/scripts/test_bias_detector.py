from bias.bias_detector import BiasDetector


def main():

    detector = BiasDetector()


    text = """
    The company announced a historic breakthrough.
    However, experts warned about security problems.
    """


    result = detector.analyze(
        text
    )


    print(result)



if __name__ == "__main__":
    main()