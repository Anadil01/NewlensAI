const express = require("express");

const {
  getStories,
  getSingleStory,
  toggleBookmark,
  getBookmarks,
  triggerScrape
} = require("../controllers/storyController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stories", getStories);

router.get("/stories/:id", getSingleStory);

router.post("/scrape", triggerScrape);

router.post(
  "/stories/:id/bookmark",
  protect,
  toggleBookmark
);

router.get(
  "/bookmarks",
  protect,
  getBookmarks
);

module.exports = router;