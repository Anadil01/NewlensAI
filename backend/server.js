const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const scrapeStories = require("./services/scraperService");
const config = require("./config/env");

const app = express();
app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));

const SCRAPE_INTERVAL_MS = 60 * 60 * 1000;

const runScheduledScrape = async () => {
  try {
    await scrapeStories();
  } catch (error) {
    console.log("Scheduled scrape failed:", error.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      console.log(`Server running on ${config.port}`);
    });

    runScheduledScrape();
    setInterval(runScheduledScrape, SCRAPE_INTERVAL_MS);
  } catch (error) {
    console.log("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
