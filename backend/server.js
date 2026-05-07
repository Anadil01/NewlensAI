const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const scrapeStories = require("./services/scraperService");

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));

const PORT = process.env.PORT || 5001;
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

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });

    runScheduledScrape();
    setInterval(runScheduledScrape, SCRAPE_INTERVAL_MS);
  } catch (error) {
    console.log("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
