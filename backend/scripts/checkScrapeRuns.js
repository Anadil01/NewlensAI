const prisma = require("../utils/prisma");

const run = async () => {
  const runs = await prisma.scrapeRun.findMany({
    orderBy: {
      startedAt: "desc"
    },
    take: 5,

    include: {
      source: true
    }
  });

  console.table(
    runs.map((run) => ({
      id: run.id,
      source: run.source.slug,
      status: run.status,
      fetched: run.fetched,
      inserted: run.inserted,
      updated: run.updated,
      skipped: run.skipped,
      durationMs: run.durationMs,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      error: run.error
    }))
  );

  await prisma.$disconnect();
};

run().catch(async (error) => {
  console.error(
    "Failed to check scrape runs:",
    error
  );

  await prisma.$disconnect();
  process.exit(1);
});