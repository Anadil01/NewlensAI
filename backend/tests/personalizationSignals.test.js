const test = require("node:test");
const assert = require("node:assert/strict");

const {
  recordReading
} = require("../services/personalizationService");

const prisma = require("../utils/prisma");

const originalFindUnique = prisma.story.findUnique;
const originalTransaction = prisma.$transaction;

test.afterEach(() => {
  prisma.story.findUnique = originalFindUnique;
  prisma.$transaction = originalTransaction;
});

const makeStory = (topicIds = []) => ({
  id: "story-1",
  storyTopics: topicIds.map((topicId) => ({
    topicId
  }))
});

const setup = ({
  story = makeStory(["topic-1"]),
  currentPreferences = {}
} = {}) => {
  prisma.story.findUnique = async () => story;

  prisma.$transaction = async (callback) => {
    const transaction = {
      readingHistory: {
        create: async ({ data }) => {
          transaction.recordedReading = data;
          return data;
        }
      },

      userPreference: {
        findUnique: async ({ where }) => {
          const topicId =
            where.userId_topicId.topicId;

          const preference =
            currentPreferences[topicId];

          if (preference === undefined) {
            return null;
          }

          return {
            userId: where.userId_topicId.userId,
            topicId,
            preference
          };
        },

        upsert: async ({ create, update }) => {
          transaction.upserts =
            transaction.upserts || [];

          transaction.upserts.push({
            create,
            update
          });

          return {
            ...create,
            ...update
          };
        }
      }
    };

    await callback(transaction);

    setup.transaction = transaction;
  };
};

test("recordReading records reading history", async () => {
  setup();

  const result = await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 10,
    completed: false
  });

  assert.equal(result.recorded, true);
  assert.equal(result.affinityDelta, 0);
  assert.equal(result.topicCount, 1);

  assert.deepEqual(
    setup.transaction.recordedReading,
    {
      userId: "user-1",
      storyId: "story-1",
      durationSeconds: 10,
      completed: false
    }
  );
});

test("completed reading increases topic affinity by 2", async () => {
  setup({
    story: makeStory(["topic-1"])
  });

  const result = await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 10,
    completed: true
  });

  assert.equal(result.affinityDelta, 2);

  assert.equal(
    setup.transaction.upserts.length,
    1
  );

  assert.equal(
    setup.transaction.upserts[0].create.preference,
    2
  );
});

test("30 seconds or more increases topic affinity by 1", async () => {
  setup();

  const result = await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 30,
    completed: false
  });

  assert.equal(result.affinityDelta, 1);

  assert.equal(
    setup.transaction.upserts[0].create.preference,
    1
  );
});

test("short incomplete reading does not change affinity", async () => {
  setup();

  const result = await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 29,
    completed: false
  });

  assert.equal(result.affinityDelta, 0);

  assert.equal(
    setup.transaction.upserts,
    undefined
  );
});

test("reading affinity is capped at 5", async () => {
  setup({
    currentPreferences: {
      "topic-1": 5
    }
  });

  const result = await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 60,
    completed: true
  });

  assert.equal(result.affinityDelta, 2);

  assert.equal(
    setup.transaction.upserts[0].update.preference,
    5
  );
});

test("reading updates all topics attached to a story", async () => {
  setup({
    story: makeStory([
      "topic-1",
      "topic-2",
      "topic-3"
    ])
  });

  const result = await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 60,
    completed: false
  });

  assert.equal(result.affinityDelta, 1);
  assert.equal(result.topicCount, 3);

  assert.equal(
    setup.transaction.upserts.length,
    3
  );

  assert.deepEqual(
    setup.transaction.upserts.map(
      ({ create }) => create.topicId
    ),
    [
      "topic-1",
      "topic-2",
      "topic-3"
    ]
  );
});

test("reading increments an existing preference", async () => {
  setup({
    currentPreferences: {
      "topic-1": 3
    }
  });

  await recordReading({
    userId: "user-1",
    storyId: "story-1",
    durationSeconds: 30,
    completed: false
  });

  assert.equal(
    setup.transaction.upserts[0].update.preference,
    4
  );
});

test("recordReading throws when story does not exist", async () => {
  prisma.story.findUnique = async () => null;

  await assert.rejects(
    () =>
      recordReading({
        userId: "user-1",
        storyId: "missing-story",
        durationSeconds: 30,
        completed: false
      }),
    {
      message: "Story not found"
    }
  );
});
