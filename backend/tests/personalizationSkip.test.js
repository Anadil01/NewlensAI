const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../utils/prisma");

const {
  skipStory,
  getStorySkip,
  removeStorySkip
} = require("../services/personalizationService");

const setup = (data = {}) => {
  prisma.story.findUnique = async () =>
    data.story || null;

  prisma.storySkip.findUnique = async () =>
    data.existingSkip || null;

  prisma.storySkip.create = async ({ data }) => ({
    id: "skip-1",
    ...data
  });

  prisma.storySkip.delete = async () => {};

  prisma.userPreference.findUnique = async ({ where }) => {
    const topicId =
      where.userId_topicId.topicId;

    return data.preferences?.[topicId] || null;
  };

  prisma.userPreference.upsert = async ({
    create,
    update
  }) => ({
    ...(data.preferences?.[create.topicId] || {}),
    ...(update || create)
  });

  prisma.userPreference.update = async ({
    data: preferenceData
  }) => ({
    preference: preferenceData.preference
  });

  prisma.$transaction = async (callback) => {
    const transaction = {
      storySkip: {
        create: prisma.storySkip.create,
        delete: prisma.storySkip.delete
      },

      userPreference: {
        findUnique: prisma.userPreference.findUnique,
        upsert: prisma.userPreference.upsert,
        update: prisma.userPreference.update
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

test("skipStory creates a skip", async () => {
  setup({
    story: makeStory(),
    existingSkip: null
  });

  const result = await skipStory({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.skipped, true);
  assert.equal(result.storyId, "story-1");
  assert.equal(result.alreadySkipped, false);
  assert.equal(result.preferenceDelta, -1);
  assert.equal(result.topicCount, 1);
});

test("skipStory decreases topic preference by 1", async () => {
  setup({
    story: makeStory(),

    preferences: {
      "topic-1": {
        preference: 3
      }
    }
  });

  const result = await skipStory({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.preferenceDelta, -1);
});

test("skipStory updates all story topics", async () => {
  setup({
    story: makeStory({
      topicIds: [
        "topic-1",
        "topic-2",
        "topic-3"
      ]
    })
  });

  const result = await skipStory({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.topicCount, 3);
});

test("skipStory does not apply signal twice", async () => {
  setup({
    story: makeStory(),

    existingSkip: {
      id: "skip-1",
      userId: "user-1",
      storyId: "story-1"
    }
  });

  const result = await skipStory({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.skipped, true);
  assert.equal(result.alreadySkipped, true);
  assert.equal(result.preferenceDelta, 0);
});

test("getStorySkip returns existing skip", async () => {
  const skip = {
    id: "skip-1",
    userId: "user-1",
    storyId: "story-1"
  };

  setup({
    story: makeStory(),
    existingSkip: skip
  });

  const result = await getStorySkip({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.deepEqual(result, skip);
});

test("getStorySkip returns null when story is not skipped", async () => {
  setup({
    story: makeStory(),
    existingSkip: null
  });

  const result = await getStorySkip({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result, null);
});

test("removeStorySkip restores preference by 1", async () => {
  setup({
    story: makeStory(),

    existingSkip: {
      id: "skip-1",
      userId: "user-1",
      storyId: "story-1"
    },

    preferences: {
      "topic-1": {
        preference: 2
      }
    }
  });

  const result = await removeStorySkip({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.removed, true);
  assert.equal(result.storyId, "story-1");
  assert.equal(result.preferenceDelta, 1);
  assert.equal(result.topicCount, 1);
});

test("removeStorySkip restores all topic preferences", async () => {
  setup({
    story: makeStory({
      topicIds: [
        "topic-1",
        "topic-2",
        "topic-3"
      ]
    }),

    existingSkip: {
      id: "skip-1",
      userId: "user-1",
      storyId: "story-1"
    }
  });

  const result = await removeStorySkip({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.removed, true);
  assert.equal(result.preferenceDelta, 1);
  assert.equal(result.topicCount, 3);
});

test("removeStorySkip is safe when skip does not exist", async () => {
  setup({
    existingSkip: null
  });

  const result = await removeStorySkip({
    userId: "user-1",
    storyId: "story-1"
  });

  assert.equal(result.removed, false);
  assert.equal(result.storyId, "story-1");
  assert.equal(result.preferenceDelta, 0);
});

test("skipStory throws when story does not exist", async () => {
  setup({
    story: null
  });

  await assert.rejects(
    () =>
      skipStory({
        userId: "user-1",
        storyId: "missing-story"
      }),
    {
      message: "Story not found"
    }
  );
});

test("getStorySkip throws when story does not exist", async () => {
  setup({
    story: null
  });

  await assert.rejects(
    () =>
      getStorySkip({
        userId: "user-1",
        storyId: "missing-story"
      }),
    {
      message: "Story not found"
    }
  );
});

test("removeStorySkip does not require story lookup when skip is missing", async () => {
  setup({
    existingSkip: null,
    story: null
  });

  const result = await removeStorySkip({
    userId: "user-1",
    storyId: "missing-story"
  });

  assert.equal(result.removed, false);
  assert.equal(result.preferenceDelta, 0);
});