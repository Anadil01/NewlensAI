const express = require("express");

const validate = require("../middleware/validateMiddleware");

const {
  storyIdParamsSchema,
  storyQuerySchema,
  searchQuerySchema,
} = require("../validations/storyValidation");

const {
  getStories,
  getSingleStory,
  toggleBookmark,
  getBookmarks,
  triggerIngestion,
  searchStories,
} = require("../controllers/storyController");

const requireAdmin = require("../middleware/adminMiddleware");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/admin/ingestion/run",
  protect,
  requireAdmin,
  triggerIngestion
);

router.get(
  "/stories/search",
  validate(searchQuerySchema, "query"),
  searchStories
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
