const prisma = require("../utils/prisma");

const {
  saveStory
} = require("./storyPersistenceService");

const {
  invalidateStoryCaches
} = require("./storyCacheService");

const scrapeSource = async (sourceConfig) => {
  if (!sourceConfig) {
    throw new Error(
      "Source configuration is required"
    );
  }

  if (
    typeof sourceConfig.scraper !== "function"
  ) {
    throw new Error(
      `No scraper configured for source: ${sourceConfig.slug}`
    );
  }

  console.log(
    `Starting scraper: ${sourceConfig.name}`
  );

  // --------------------------------
  // 1. Find or create source
  // --------------------------------

  const source =
    await prisma.source.upsert({
      where: {
        slug: sourceConfig.slug
      },

      update: {
        name: sourceConfig.name,
        websiteUrl:
          sourceConfig.websiteUrl,
        isActive: true
      },

      create: {
        name: sourceConfig.name,
        slug: sourceConfig.slug,
        websiteUrl:
          sourceConfig.websiteUrl,
        type: sourceConfig.type
      }
    });

  // --------------------------------
  // 2. Create scrape run
  // --------------------------------

  const scrapeRun =
    await prisma.scrapeRun.create({
      data: {
        sourceId: source.id,
        status: "RUNNING"
      }
    });

  const startedAt = Date.now();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    // --------------------------------
    // 3. Run source scraper
    // --------------------------------

    const stories =
      await sourceConfig.scraper();

    if (!Array.isArray(stories)) {
      throw new Error(
        `Scraper for ${sourceConfig.name} must return an array`
      );
    }

    // --------------------------------
    // 4. Persist stories
    // --------------------------------

    for (const story of stories) {
      if (
        !story.externalId ||
        !story.title ||
        !story.canonicalUrl
      ) {
        skipped++;
        continue;
      }

      const result =
        await saveStory({
          sourceId: source.id,
          story
        });

      if (result.action === "inserted") {
        inserted++;
      }

      if (result.action === "updated") {
        updated++;
      }
    }

    // --------------------------------
    // 5. Invalidate cache
    // --------------------------------

    await invalidateStoryCaches();

    // --------------------------------
    // 6. Calculate duration
    // --------------------------------

    const durationMs =
      Date.now() - startedAt;

    // --------------------------------
    // 7. Mark scrape run SUCCESS
    // --------------------------------

    await prisma.scrapeRun.update({
      where: {
        id: scrapeRun.id
      },

      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        durationMs,
        fetched: stories.length,
        inserted,
        updated,
        skipped
      }
    });

    const result = {
      fetched: stories.length,
      inserted,
      updated,
      skipped,
      durationMs
    };

    console.log(
      `${sourceConfig.name} scrape completed:`,
      result
    );

    return result;

  } catch (error) {

    // --------------------------------
    // 8. Mark scrape run FAILED
    // --------------------------------

    const durationMs =
      Date.now() - startedAt;

    await prisma.scrapeRun.update({
      where: {
        id: scrapeRun.id
      },

      data: {
        status: "FAILED",
        completedAt: new Date(),
        durationMs,
        fetched: 0,
        inserted,
        updated,
        skipped,
        error: error.message
      }
    });

    console.error(
      `${sourceConfig.name} scrape failed:`,
      error.message
    );

    throw error;
  }
};

module.exports = {
  scrapeSource
};