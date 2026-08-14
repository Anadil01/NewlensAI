const axios = require("axios");

const HACKER_NEWS_URL = "https://news.ycombinator.com/";

const fetchHackerNewsHomepage = async () => {
  const { data } = await axios.get(
    HACKER_NEWS_URL,
    {
      timeout: 10000
    }
  );

  return data;
};

module.exports = {
  fetchHackerNewsHomepage
};