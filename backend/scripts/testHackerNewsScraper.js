const {
  scrapeHackerNews
} = require("../scrapers/hackerNewsScraper");

const run = async () => {
  try {
    const stories = await scrapeHackerNews();

    console.log(
      `Fetched stories: ${stories.length}`
    );

    console.table(stories);
  } catch (error) {
    console.error(
      "Scraper test failed:",
      error.message
    );

    process.exit(1);
  }
};

run();
