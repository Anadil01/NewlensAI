const express = require("express");
const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const { personalizedFeedQuerySchema, preferencesSchema, readingActivitySchema , topicIdParamsSchema, feedbackSchema} = require("../validations/personalizationValidation");
const { storyIdParamsSchema } = require("../validations/storyValidation");
const controller = require("../controllers/personalizationController");

const router = express.Router();

router.use(protect);
router.get("/feed/personalized", validate(personalizedFeedQuerySchema, "query"), controller.getPersonalizedFeed);
router.get("/me/preferences", controller.getPreferences);
router.put("/me/preferences", validate(preferencesSchema), controller.replacePreferences);
router.post("/stories/:id/reading", validate(storyIdParamsSchema, "params"), validate(readingActivitySchema), controller.recordReading);
router.post(
    "/topics/:topicId/follow",
    validate(topicIdParamsSchema, "params"),
    controller.followTopic
  );
  
  router.delete(
    "/topics/:topicId/follow",
    validate(topicIdParamsSchema, "params"),
    controller.unfollowTopic
  );


  router.post(
    "/stories/:id/feedback",
    validate(storyIdParamsSchema, "params"),
    validate(feedbackSchema),
    controller.setStoryFeedback
  );
  
  router.get(
    "/stories/:id/feedback",
    validate(storyIdParamsSchema, "params"),
    controller.getStoryFeedback
  );
  
  router.delete(
    "/stories/:id/feedback",
    validate(storyIdParamsSchema, "params"),
    controller.removeStoryFeedback
  );
module.exports = router;
