const express = require("express");

const validate = require("../middleware/validateMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const {
  storyIdParamsSchema,
  storyQuerySchema
} = require("../validations/storyValidation");

const {
  getStories,
  getSingleStory,
  toggleBookmark,
  getBookmarks,
  triggerScrape,
} = require("../controllers/storyController");


const protect = require("../middleware/authMiddleware");

const router = express.Router();
const storyController = require("../controllers/storyController");


router.get(
  "/stories/search",
  storyController.searchStories
);
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

router.post("/scrape", requireAdmin, triggerScrape);

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