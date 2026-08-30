const express = require("express");
const cors = require("cors");


const config = require("./config/env");
const securityHeaders = require("./middleware/securityMiddleware");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");
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


app.use("/api", apiLimiter);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));
app.get("/api/topics", require("./controllers/personalizationController").getTopics);
app.use("/api", require("./routes/personalizationRoutes"));
app.use("/api", require("./routes/clusterRoutes"));
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

    // Start the ingestion worker.
    const ingestionWorker = require("./workers/ingestionWorker");

    const server = app.listen(config.port, () => {
      console.log(`Server running on ${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down...`);

      server.close();

      try {
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
