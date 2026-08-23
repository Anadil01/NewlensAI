from clustering.story_clusterer import StoryClusterer



def main():


    stories = [

        {
            "id":"1",
            "content":
            """
            OpenAI released a new artificial intelligence model
            for developers.
            """
        },


        {
            "id":"2",
            "content":
            """
            OpenAI launched a new AI model
            that helps developers.
            """
        },


        {
            "id":"3",
            "content":
            """
            Apple announced a new iPhone device.
            """
        }

    ]



    clusterer = StoryClusterer(
        threshold=0.3
    )


    result = clusterer.cluster(
        stories
    )


    print(result)



if __name__=="__main__":
    main()