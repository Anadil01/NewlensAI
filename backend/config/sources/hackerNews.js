const {
    scrapeHackerNews
  } = require("../../scrapers/hackerNewsScraper");
  
  const hackerNewsSource = {
    slug: "hacker-news",
  
    name: "Hacker News",
  
    websiteUrl:
      "https://news.ycombinator.com",
  
    type: "WEBSITE",
  
    scraper: scrapeHackerNews
  };
  
  module.exports = hackerNewsSource;