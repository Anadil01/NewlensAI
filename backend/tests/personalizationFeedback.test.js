const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../utils/prisma");

const {
  setStoryFeedback,
  getStoryFeedback,
  removeStoryFeedback
} = require("../services/personalizationService");

const setup = (data = {}) => {
  prisma.story.findUnique = async () => data.story || null;

  prisma.storyFeedback.findUnique = async () =>
    data.existingFeedback || null;

  prisma.storyFeedback.upsert = async ({ create, update }) => ({
    ...(data.existingFeedback || {}),
    ...(data.existingFeedback ? update : create)
  });

  prisma.storyFeedback.delete = async () => {};

  prisma.userPreference.findUnique = async ({ where }) => {
    const topicId =
      where.userId_topicId.topicId;

    return data.preferences?.[topicId] || null;
  };

  prisma.userPreference.upsert = async ({ create, update }) => ({
    ...(data.preferences?.[create.topicId] || {}),
    ...(data.preferences?.[update?.topicId] || {}),
    ...(update || create)
  });

  prisma.$transaction = async (callback) => {
    const transaction = {
      storyFeedback: {
        upsert: prisma.storyFeedback.upsert,
        delete: prisma.storyFeedback.delete
      },
      userPreference: {
        findUnique: prisma.userPreference.findUnique,
        upsert: prisma.userPreference.upsert
      }
    };

    return callback(transaction);
  };
};

const makeStory = ({
  id = "story-1",
  topicIds = ["topic-1"]
} = {}) => ({
  id,
  storyTopics: topicIds.map((topicId) => ({
    topicId
  }))
});

test("setStoryFeedback creates LIKE feedback", async () => {
  setup({
    story: makeStory(),
    existingFeedback: null
  });

  const result = await setStoryFeedback({
    userId: "user-1",
    storyId: "story-1",
    feedback: "LIKE"
  });

  assert.equal(result.storyId, "story-1");
  assert.equal(result.feedback, "LIKE");
  assert.equal(result.previousFeedback, null);
  assert.equal(result.preferenceDelta, 1);
  assert.equal(result.topicCount, 1);
});

test("setStoryFeedback creates DISLIKE feedback", async () => {
  setup({
    story: makeStory(),
    existingFeedback: null
  });

  const result = await setStoryFeedback({
    userId: "user-1",
    storyId: "story-1",
    feedback: "DISLIKE"
  });

  assert.equal(result.feedback, "DISLIKE");
  assert.equal(result.previousFeedback, null);
  assert.equal(result.preferenceDelta, -1);
});

test("same feedback does not change preference", async () => {
  setup({
    story: makeStory(),
    existingFeedback: {
      feedback: "LIKE"
    }
  });

  const result = await setStoryFeedback({
    userId: "user-1",
    storyId: "story-1",
    feedback: "LIKE"
  });

  assert.equal(result.feedback, "LIKE");
  assert.equal(result.previousFeedback, "LIKE");
  assert.equal(result.preferenceDelta, 0);
});

test("LIKE to DISLIKE produces -2 preference delta", async () => {
  setup({
    story: makeStory(),
    existingFeedback: {
      feedback: "LIKE"
    }
  });

  const result = await setStoryFeedback({
    userId: "user-1",
    storyId: "story-1",
    feedback: "DISLIKE"
  });

  assert.equal(result.previousFeedback, "LIKE");
  assert.equal(result.feedback, "DISLIKE");
  assert.equal(result.preferenceDelta, -2);
});

test("DISLIKE to LIKE produces +2 preference delta", async () => {
  setup({
    story: makeStory(),
    existingFeedback: {
      feedback: "DISLIKE"
    }
  });

  const result = await setStoryFeedback({
    userId: "user-1",
    storyId: "story-1",
    feedback: "LIKE"
  });

  assert.equal(result.previousFeedback, "DISLIKE");
  assert.equal(result.feedback, "LIKE");
  assert.equal(result.preferenceDelta, 2);
});

test("setStoryFeedback updates all story topics", async () => {
  setup({
    story: makeStory({
      topicIds: [
        "topic-1",
        "topic-2",
        "topic-3"
      ]
    }),
    existingFeedback: null
  });

  const result = await setStoryFeedback({
    userId: "user-1",
    storyId: "story-1",
    feedback: "LIKE"
  });

  assert.equal(result.topicCount, 3);
});

test("getStoryFeedback returns existing feedback", async () => {
  const feedback = {
    id: "feedback-1",
    userId: "user-1",
    storyId: "story-1",
    feedback: "LIKE"
  };

  setup({
    story: makeStory(),
    existingFeedback: feedback
  });

  const result = await getStoryFeedback({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.deepEqual(result, feedback);
});

test("getStoryFeedback returns null when no feedback exists", async () => {
  setup({
    story: makeStory(),
    existingFeedback: null
  });

  const result = await getStoryFeedback({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result, null);
});

test("removeStoryFeedback removes LIKE and restores -1", async () => {
  setup({
    story: makeStory(),
    existingFeedback: {
      feedback: "LIKE"
    }
  });

  const result = await removeStoryFeedback({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.removed, true);
  assert.equal(result.previousFeedback, "LIKE");
  assert.equal(result.preferenceDelta, -1);
});

test("removeStoryFeedback removes DISLIKE and restores +1", async () => {
  setup({
    story: makeStory(),
    existingFeedback: {
      feedback: "DISLIKE"
    }
  });

  const result = await removeStoryFeedback({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.removed, true);
  assert.equal(result.previousFeedback, "DISLIKE");
  assert.equal(result.preferenceDelta, 1);
});

test("removeStoryFeedback is safe when feedback does not exist", async () => {
  setup({
    story: makeStory(),
    existingFeedback: null
  });

  const result = await removeStoryFeedback({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.removed, false);
  assert.equal(result.preferenceDelta, 0);
});