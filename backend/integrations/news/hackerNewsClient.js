const axios = require("axios");

const HACKER_NEWS_URL =
  "https://news.ycombinator.com/";

const fetchHackerNewsHomepage = async () => {
  const response = await axios.get(
    HACKER_NEWS_URL,
    {
      timeout: 10000,

      headers: {
        "User-Agent":
          "NewsLens/1.0 (News aggregation service)"
      },

      validateStatus: (status) =>
        status >= 200 && status < 300
    }
  );

  return response.data;
};

module.exports = {
  fetchHackerNewsHomepage
};