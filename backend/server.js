const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const scrapeStories = require("./services/scraperService");
const config = require("./config/env");
const AppError = require("./utils/AppError");
const securityHeaders = require("./middleware/securityMiddleware");

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

// app.get("/test-error", (req, res, next) => {
//   next(new Error("Unexpected failure"));
// });

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

app.use(notFound);
app.use(errorHandler);


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
