const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const scrapeStories = require("./services/scraperService");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

scrapeStories();

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/storyRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});