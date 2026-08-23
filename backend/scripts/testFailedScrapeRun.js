const {
    scrapeSource
  } = require("../services/sourceScraperService");
  
  const prisma = require("../utils/prisma");
  
  const failingSource = {
    slug: "test-failing-source",
    name: "Test Failing Source",
    websiteUrl: "https://example.com",
    type: "WEBSITE",
  
    scraper: async () => {
      throw new Error(
        "Simulated scraper failure"
      );
    }
  };
  
  const run = async () => {
    try {
      await scrapeSource(failingSource);
    } catch (error) {
      console.log(
        "Expected scraper failure:",
        error.message
      );
    }
  
    const run =
      await prisma.scrapeRun.findFirst({
        where: {
          source: {
            slug: "test-failing-source"
          }
        },
        orderBy: {
          startedAt: "desc"
        }
      });
  
    console.log(
      "Failed scrape run:"
    );
  
    console.table({
      status: run.status,
      fetched: run.fetched,
      inserted: run.inserted,
      updated: run.updated,
      skipped: run.skipped,
      durationMs: run.durationMs,
      error: run.error,
      completedAt: run.completedAt
    });
  
    await prisma.$disconnect();
  };
  
  run().catch(async (error) => {
    console.error(error);
  
    await prisma.$disconnect();
  
    process.exit(1);
  });