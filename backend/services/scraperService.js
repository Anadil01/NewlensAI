const cheerio = require("cheerio");

const prisma = require("../utils/prisma");

const {
  invalidateStoryCaches
} = require("./storyCacheService");
const {
  fetchHackerNewsHomepage
} = require("../integrations/news/hackerNewsClient");
const {
  indexStory
} = require("./searchService");


const scrapeStories = async () => {
  try {
    const data = await fetchHackerNewsHomepage();
    const $ = cheerio.load(data);

    const stories = [];

    $(".athing").each((i, el) => {
      if (i >= 10) {
        return;
      }

      const externalId = $(el).attr("id");

      const title = $(el)
        .find(".titleline a")
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

      stories.push({
        externalId,
        title,
        url,
        points,
        author
      });
    });

    const source = await prisma.source.upsert({
      where: {
        slug: "hacker-news"
      },
      update: {
        name: "Hacker News",
        websiteUrl: "https://news.ycombinator.com",
        isActive: true
      },
      create: {
        name: "Hacker News",
        slug: "hacker-news",
        websiteUrl: "https://news.ycombinator.com",
        type: "WEBSITE"
      }
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const story of stories) {
      const existingStory =
        await prisma.story.findUnique({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId: story.externalId
            }
          }
        });

        if (existingStory) {
          const updatedStory =
            await prisma.story.update({
              where: {
                id: existingStory.id
              },
        
              data: {
                title: story.title,
                canonicalUrl: story.url,
                author: story.author,
                points: story.points
              }
            });
        
          await indexStory(updatedStory);
        
          updated++;
        } else {
          const createdStory =
            await prisma.story.create({
              data: {
                sourceId: source.id,
                externalId: story.externalId,
                canonicalUrl: story.url,
                title: story.title,
                author: story.author,
                points: story.points,
                contentStatus: "EXTERNAL_ONLY"
              }
            });
        
          await indexStory(createdStory);
        
          inserted++;
        }
    }

    await invalidateStoryCaches();
    console.log(
      `Stories scraped successfully: ${inserted} inserted, ${updated} updated, ${skipped} skipped`
    );

    return {
      fetched: stories.length,
      inserted,
      updated,
      skipped
    };
  } catch (error) {
    console.error(
      "Scraper Error:",
      error.message
    );

    throw error;
  }
};

module.exports = scrapeStories;