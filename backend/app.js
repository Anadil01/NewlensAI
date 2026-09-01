const express = require("express");
const cors = require("cors");

const config = require("./config/env");
const securityHeaders = require("./middleware/securityMiddleware");
const { apiLimiter } = require("./middleware/rateLimitMiddleware");

const app = express();

app.use(securityHeaders);

app.use(
  cors({
    origin: config.clientUrl
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use("/api", apiLimiter);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));

app.get(
  "/api/topics",
  require("./controllers/personalizationController").getTopics
);

app.use(
  "/api",
  require("./routes/personalizationRoutes")
);

app.use(
  "/api",
  require("./routes/clusterRoutes")
);

app.use(require("./routes/healthRoutes"));

const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

app.use(notFound);
app.use(errorHandler);

module.exports = app;