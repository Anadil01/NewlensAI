const cheerio = require("cheerio");

const {
  fetchHackerNewsHomepage
} = require("../integrations/news/hackerNewsClient");
const {
  normalizeStory
} = require("./storyNormalizer");
const {
  retry
} = require("../utils/retry");

const scrapeHackerNews = async () => {
  const data = await retry(
    () => fetchHackerNewsHomepage(),
    {
      retries: 3,
      delay: 1000
    }
  );
  const $ = cheerio.load(data);

  const stories = [];

  $(".athing").each((i, el) => {
    if (i >= 10) {
      return;
    }

    const externalId = $(el).attr("id");

    const titleLink = $(el).find(".titleline a");

    const title = titleLink
    .clone()
    .find(".sitestr")
    .remove()
    .end()
    .text()
    .trim();

    let url = $(el)
      .find(".titleline a")
      .attr("href");

    const subtext = $(el).next();

    const points =
      parseInt(
        subtext.find(".score").text(),
        10
      ) || 0;

    const author =
      subtext.find(".hnuser").text().trim() || null;

    if (url && url.startsWith("/")) {
      url = `https://news.ycombinator.com${url}`;
    }

    if (!externalId || !title || !url) {
      return;
    }

    stories.push(
      normalizeStory({
        externalId,
        title,
        url,
        points,
        author
      })
    );
  });

  return stories;
};

module.exports = {
  scrapeHackerNews
};
