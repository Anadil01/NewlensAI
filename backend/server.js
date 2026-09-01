const config = require("./config/env");
const app = require("./app");

const {
  connectRedis,
  redisClient
} = require("./utils/redis");

const prisma = require("./utils/prisma");

const {
  connectElasticsearch
} = require("./utils/elasticsearch");

const {
  createStoriesIndex
} = require("./services/searchIndexService");

const startServer = async () => {
  try {
    await connectRedis();
    await connectElasticsearch();
    await createStoriesIndex();

    const ingestionWorker =
      require("./workers/ingestionWorker");

    const server = app.listen(
      config.port,
      () => {
        console.log(
          `🚀 Server running on ${config.port}`
        );
      }
    );

    const shutdown = async (signal) => {
      console.log(
        `${signal} received, shutting down...`
      );

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

    process.on("SIGTERM", () =>
      shutdown("SIGTERM")
    );

    process.on("SIGINT", () =>
      shutdown("SIGINT")
    );
  } catch (error) {
    console.log(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();