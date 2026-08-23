const prisma = require("../utils/prisma");

const STALE_RUN_THRESHOLD_MS =
  30 * 60 * 1000;

const recoverStaleScrapeRuns = async () => {
  const cutoff =
    new Date(
      Date.now() -
        STALE_RUN_THRESHOLD_MS
    );

  const result =
    await prisma.scrapeRun.updateMany({
      where: {
        status: "RUNNING",

        startedAt: {
          lt: cutoff
        }
      },

      data: {
        status: "FAILED",
        completedAt: new Date(),
        error:
          "Scrape run interrupted or timed out"
      }
    });

  if (result.count > 0) {
    console.log(
      `Recovered ${result.count} stale scrape run(s)`
    );
  } else {
    console.log(
      "No stale scrape runs found"
    );
  }

  return result.count;
};

module.exports = {
  recoverStaleScrapeRuns
};