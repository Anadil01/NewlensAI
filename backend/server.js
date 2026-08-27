const express = require("express");
const cors = require("cors");
const {
  recoverStaleScrapeRuns
} = require("./services/scrapeRunService");


const startScheduler =
require("./jobs/scheduler");
const config = require("./config/env");
const securityHeaders = require("./middleware/securityMiddleware");
const { connectRedis, redisClient } = require("./utils/redis");
const prisma = require("./utils/prisma");

const {
  connectElasticsearch
} = require("./utils/elasticsearch");
const {
  createStoriesIndex
} = require("./services/searchIndexService");


const app = express();
app.use(securityHeaders);
app.use(
  cors({
    origin:config.clientUrl
  })
);
app.use(express.json({
  limit: "1mb"
}));


app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));
app.use(require("./routes/healthRoutes"));



const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

app.use(notFound);
app.use(errorHandler);



const startServer = async () => {
  try {

    await connectRedis();
    await connectElasticsearch();
    await createStoriesIndex();
    await recoverStaleScrapeRuns();

    // Start the background workers in-process so queued scrape/ingestion
    // jobs are actually consumed (previously they were defined but never
    // started, so nothing processed the queues).
    const scrapeWorker = require("./workers/scrapeWorker");
    const ingestionWorker = require("./workers/ingestionWorker");

    const server = app.listen(config.port, () => {
      console.log(`Server running on ${config.port}`);
    });

    await startScheduler();

    // Centralized graceful shutdown: stop the workers, close connections,
    // then exit. Owning shutdown here avoids races between per-worker
    // signal handlers all calling process.exit().
    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down...`);

      server.close();

      try {
        await scrapeWorker.close();
        await ingestionWorker.close();

        if (redisClient.isOpen) {
          await redisClient.quit();
        }

        await prisma.$disconnect();
      } catch (shutdownError) {
        console.error(
          "Error during shutdown:",
          shutdownError.message
        );
      }

      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (error) {
    console.log(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};
startServer();
