import requests

from config.settings import NEWS_API_KEY


class NewsAPIClient:

    BASE_URL = "https://newsapi.org/v2"


    def __init__(self):
        self.api_key = NEWS_API_KEY

        if not self.api_key:
            raise ValueError(
                "NEWS_API_KEY is not configured"
            )


    def get_top_headlines(
        self,
        country="in",
        category=None,
        page_size=20
    ):

        params = {
            "apiKey": self.api_key,
            "country": country,
            "pageSize": page_size
        }


        if category:
            params["category"] = category


        response = requests.get(
            f"{self.BASE_URL}/top-headlines",
            params=params,
            timeout=10
        )


        response.raise_for_status()

        data = response.json()


        if data.get("status") != "ok":
            raise Exception(
                data.get("message")
            )

        print(data)
        return data.get("articles" , [])