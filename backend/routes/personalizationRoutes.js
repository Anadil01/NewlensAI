const express = require("express");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { personalizedFeedQuerySchema, preferencesSchema, readingActivitySchema } = require("../validations/personalizationValidation");
const { storyIdParamsSchema } = require("../validations/storyValidation");
const controller = require("../controllers/personalizationController");

const router = express.Router();

router.use(protect);
router.get("/feed/personalized", validate(personalizedFeedQuerySchema, "query"), controller.getPersonalizedFeed);
router.get("/me/preferences", controller.getPreferences);
router.put("/me/preferences", validate(preferencesSchema), controller.replacePreferences);
router.post("/stories/:id/reading", validate(storyIdParamsSchema, "params"), validate(readingActivitySchema), controller.recordReading);

module.exports = router;
