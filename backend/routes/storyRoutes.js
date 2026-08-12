const express = require("express");

const validate = require("../middleware/validateMiddleware");

const {
  storyIdParamsSchema,
  storyQuerySchema
} = require("../validations/storyValidation");

const {
  getStories,
  getSingleStory,
  toggleBookmark,
  getBookmarks,
  triggerScrape
} = require("../controllers/storyController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/stories",
  validate(storyQuerySchema, "query"),
  getStories
);

router.get(
  "/stories/:id",
  validate(storyIdParamsSchema, "params"),
  getSingleStory
);

router.post("/scrape", triggerScrape);

router.post(
  "/stories/:id/bookmark",
  protect,
  validate(storyIdParamsSchema, "params"),
  toggleBookmark
);

router.get(
  "/bookmarks",
  protect,
  getBookmarks
);
module.exports = router;