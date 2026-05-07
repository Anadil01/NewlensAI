const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const scrapeStories = require("./services/scraperService");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await scrapeStories();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

startServer();
