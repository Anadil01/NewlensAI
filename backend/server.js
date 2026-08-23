const express = require("express");
const cors = require("cors");
const {
  recoverStaleScrapeRuns
} = require("./services/scrapeRunService");


const startScheduler =
require("./jobs/scheduler");
const config = require("./config/env");
const securityHeaders = require("./middleware/securityMiddleware");
const { connectRedis } = require("./utils/redis");

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
    
    app.listen(config.port, () => {
      console.log(`Server running on ${config.port}`);
    });

    await startScheduler();
  } catch (error) {
    console.log(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};
startServer();
