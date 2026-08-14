const cheerio = require("cheerio");
const Story = require("../models/Story");

const {
  fetchHackerNewsHomepage
} = require("../integrations/news/hackerNewsClient");

const scrapeStories = async () => {
  try {
    const data = await fetchHackerNewsHomepage();
    const $ = cheerio.load(data);

    const stories = [];

    $(".athing").each((i, el) => {
      if (i < 10) {
        const title = $(el).find(".titleline a").text();
        const url = $(el).find(".titleline a").attr("href");

        const subtext = $(el).next();
        const points = parseInt(subtext.find(".score").text()) || 0;
        const author = subtext.find(".hnuser").text();
        const postedAt = subtext.find(".age").text();

        stories.push({ title, url, points, author, postedAt });
      }
    });

    await Story.deleteMany();
    await Story.insertMany(stories);

    console.log("Stories scraped successfully");
    return {
      fetched: stories.length,
      inserted: stories.length,
      skipped: 0
    };
  } catch (error) {
    console.log("Scraper Error:", error.message);
    throw error;
  }
};

module.exports = scrapeStories;
