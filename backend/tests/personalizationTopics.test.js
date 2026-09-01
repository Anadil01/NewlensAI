const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../utils/prisma");

const {
  getTopics,
  getPreferences,
  replacePreferences,
  followTopic,
  unfollowTopic
} = require("../services/personalizationService");

const setup = (data = {}) => {
  prisma.topic.findMany = async () =>
    data.topics || [];

  prisma.topic.findUnique = async () =>
    data.topic || null;

  prisma.topic.count = async () =>
    data.topicCount ?? 0;

  prisma.userPreference.findMany = async () =>
    data.preferences || [];

  prisma.userPreference.deleteMany = async () => ({
    count: data.deletedCount ?? 1
  });

  prisma.userPreference.createMany = async ({ data }) => ({
    count: data.length
  });

  prisma.userPreference.upsert = async ({
    create,
    update,
    include
  }) => ({
    id: "preference-1",
    ...create,
    ...(update || {}),
    ...(include?.topic
      ? {
          topic:
            data.topic || {
              id: create.topicId,
              name: "Technology"
            }
        }
      : {})
  });

  prisma.$transaction = async (operations) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    }

    return operations(prisma);
  };
};

test("getTopics returns topics ordered by name", async () => {
  const topics = [
    {
      id: "topic-1",
      name: "Politics",
      slug: "politics",
      _count: {
        storyTopics: 10
      }
    },
    {
      id: "topic-2",
      name: "Technology",
      slug: "technology",
      _count: {
        storyTopics: 20
      }
    }
  ];

  setup({ topics });

  const result = await getTopics();

  assert.deepEqual(result, topics);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, "Politics");
  assert.equal(result[1].name, "Technology");
});

test("getPreferences returns user preferences", async () => {
  const preferences = [
    {
      id: "preference-1",
      userId: "user-1",
      topicId: "topic-1",
      preference: 5,
      topic: {
        id: "topic-1",
        name: "Technology"
      }
    }
  ];

  setup({ preferences });

  const result = await getPreferences("user-1");

  assert.deepEqual(result, preferences);
  assert.equal(result.length, 1);
  assert.equal(result[0].preference, 5);
});

test("getPreferences returns empty array for user without preferences", async () => {
  setup({
    preferences: []
  });

  const result = await getPreferences("user-1");

  assert.deepEqual(result, []);
});

test("replacePreferences replaces existing preferences", async () => {
  setup({
    topicCount: 2,
    preferences: [
      {
        userId: "user-1",
        topicId: "topic-1",
        preference: 5
      },
      {
        userId: "user-1",
        topicId: "topic-2",
        preference: 3
      }
    ]
  });

  const result = await replacePreferences("user-1", [
    {
      topicId: "topic-1",
      preference: 5
    },
    {
      topicId: "topic-2",
      preference: 3
    }
  ]);

  assert.equal(result.length, 2);
});

test("replacePreferences rejects nonexistent topics", async () => {
  setup({
    topicCount: 1
  });

  await assert.rejects(
    () =>
      replacePreferences("user-1", [
        {
          topicId: "topic-1",
          preference: 5
        },
        {
          topicId: "missing-topic",
          preference: 3
        }
      ]),
    {
      message: "One or more topics do not exist"
    }
  );
});

test("replacePreferences accepts empty preference list", async () => {
  setup({
    topicCount: 0,
    preferences: []
  });

  const result = await replacePreferences(
    "user-1",
    []
  );

  assert.deepEqual(result, []);
});

test("followTopic creates a preference of 5", async () => {
  setup({
    topic: {
      id: "topic-1",
      name: "Technology"
    }
  });

  const result = await followTopic({
    userId: "user-1",
    topicId: "topic-1"
  });

  assert.equal(result.userId, "user-1");
  assert.equal(result.topicId, "topic-1");
  assert.equal(result.preference, 5);
});

test("followTopic throws when topic does not exist", async () => {
  setup({
    topic: null
  });

  await assert.rejects(
    () =>
      followTopic({
        userId: "user-1",
        topicId: "missing-topic"
      }),
    {
      message: "Topic not found"
    }
  );
});

test("unfollowTopic removes topic preference", async () => {
  setup({
    topic: {
      id: "topic-1",
      name: "Technology"
    }
  });

  const result = await unfollowTopic({
    userId: "user-1",
    topicId: "topic-1"
  });

  assert.equal(result.unfollowed, true);
  assert.equal(result.topicId, "topic-1");
});

test("unfollowTopic throws when topic does not exist", async () => {
  setup({
    topic: null
  });

  await assert.rejects(
    () =>
      unfollowTopic({
        userId: "user-1",
        topicId: "missing-topic"
      }),
    {
      message: "Topic not found"
    }
  );
});