const prisma = require("../utils/prisma");

const {
  recoverStaleScrapeRuns
} = require("../services/scrapeRunService");

const run = async () => {
  const source =
    await prisma.source.findUnique({
      where: {
        slug: "hacker-news"
      }
    });

  if (!source) {
    throw new Error(
      "Hacker News source not found"
    );
  }

  const oldDate =
    new Date(
      Date.now() -
        60 * 60 * 1000
    );

  const scrapeRun =
    await prisma.scrapeRun.create({
      data: {
        sourceId: source.id,
        status: "RUNNING",
        startedAt: oldDate
      }
    });

  console.log(
    "Created stale run:",
    scrapeRun.id
  );

  await recoverStaleScrapeRuns();

  const updatedRun =
    await prisma.scrapeRun.findUnique({
      where: {
        id: scrapeRun.id
      }
    });

  console.log(
    "Recovered run:"
  );

  console.table({
    status: updatedRun.status,
    error: updatedRun.error,
    completedAt:
      updatedRun.completedAt
  });

  await prisma.$disconnect();
};

run().catch(async (error) => {
  console.error(
    "Recovery test failed:",
    error
  );

  await prisma.$disconnect();

  process.exit(1);
});