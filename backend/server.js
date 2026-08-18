const express = require("express");
const cors = require("cors");
const scrapeStories = require("./services/scraperService");
const config = require("./config/env");
const AppError = require("./utils/AppError");
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


const SCRAPE_INTERVAL_MS = 60 * 60 * 1000;

let isScraping = false;

const runScheduledScrape = async () => {
  if (isScraping) {
    console.log(
      "Scrape already running. Skipping."
    );

    return;
  }

  isScraping = true;

  try {
    const result = await scrapeStories();

    console.log(
      "Scheduled scrape completed:",
      result
    );
  } catch (error) {
    console.error(
      "Scheduled scrape failed:",
      error
    );
  } finally {
    isScraping = false;
  }
};

const startServer = async () => {
  try {

    await connectRedis();
    await connectElasticsearch();
    await createStoriesIndex();
    
    app.listen(config.port, () => {
      console.log(`Server running on ${config.port}`);
    });

    runScheduledScrape();
    setInterval(runScheduledScrape, SCRAPE_INTERVAL_MS);
  } catch (error) {
    console.log(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};
startServer();
