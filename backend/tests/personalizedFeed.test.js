const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../utils/prisma");

const {
  getPersonalizedFeed
} = require("../services/personalizationService");

// ------------------------------------------------------------
// MOCK PRISMA
// ------------------------------------------------------------

const originalMethods = {
  userPreferenceFindMany: prisma.userPreference.findMany,
  userSourcePreferenceFindMany:
    prisma.userSourcePreference.findMany,
  storySkipFindMany: prisma.storySkip.findMany,
  storyFindMany: prisma.story.findMany
};

const mockStories = [];
const mockTopicPreferences = [];
const mockSourcePreferences = [];
const mockSkippedStories = [];

prisma.userPreference.findMany = async () =>
  mockTopicPreferences;

prisma.userSourcePreference.findMany = async () =>
  mockSourcePreferences;

prisma.storySkip.findMany = async () =>
  mockSkippedStories;

prisma.story.findMany = async () =>
  mockStories;

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

const makeStory = ({
  id,
  sourceId = "source-1",
  clusterId = null,
  points = 0,
  publishedAt = "2026-08-31T10:00:00Z",
  topicIds = []
}) => ({
  id,
  sourceId,
  externalId: `${id}-external`,
  canonicalUrl: `https://example.com/${id}`,
  title: `Story ${id}`,
  author: null,
  content: null,
  excerpt: null,
  contentStatus: "EXTERNAL_ONLY",
  publishedAt: new Date(publishedAt),
  createdAt: new Date(publishedAt),
  updatedAt: new Date(publishedAt),
  clusterId,
  points,

  source: {
    id: sourceId,
    name: `Source ${sourceId}`,
    slug: sourceId,
    websiteUrl: `https://example.com/${sourceId}`,
    politicalLean: "UNKNOWN",
    reliabilityScore: 0.8
  },

  cluster: clusterId
    ? {
        id: clusterId,
        title: `Cluster ${clusterId}`,
        description: null
      }
    : null,

  storyTopics: topicIds.map((topicId) => ({
    topicId,
    topic: {
      id: topicId,
      name: `Topic ${topicId}`,
      slug: topicId
    }
  }))
});

const resetMocks = () => {
  mockStories.length = 0;
  mockTopicPreferences.length = 0;
  mockSourcePreferences.length = 0;
  mockSkippedStories.length = 0;
};

// ------------------------------------------------------------
// CLEANUP
// ------------------------------------------------------------

test.after(() => {
  prisma.userPreference.findMany =
    originalMethods.userPreferenceFindMany;

  prisma.userSourcePreference.findMany =
    originalMethods.userSourcePreferenceFindMany;

  prisma.storySkip.findMany =
    originalMethods.storySkipFindMany;

  prisma.story.findMany =
    originalMethods.storyFindMany;
});

// ============================================================
// TOPIC SCORING
// ============================================================

test("personalized feed ranks stories using topic preferences", async () => {
  resetMocks();

  mockTopicPreferences.push(
    {
      topicId: "topic-ai",
      preference: 5
    },
    {
      topicId: "topic-sports",
      preference: 1
    }
  );

  mockStories.push(
    makeStory({
      id: "ai-story",
      topicIds: ["topic-ai"]
    }),
    makeStory({
      id: "sports-story",
      topicIds: ["topic-sports"]
    })
  );

  const result = await getPersonalizedFeed({
    userId: "user-1",
    page: 1,
    limit: 10,
    mode: "personalized"
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["ai-story", "sports-story"]
  );

  assert.equal(
    result.stories[0].scoring.topicScore,
    5
  );

  assert.equal(
    result.stories[1].scoring.topicScore,
    1
  );
});

// ============================================================
// SOURCE SCORING
// ============================================================

test("personalized feed uses source preferences", async () => {
  resetMocks();

  mockSourcePreferences.push(
    {
      sourceId: "source-trusted",
      preference: 5
    }
  );

  mockStories.push(
    makeStory({
      id: "trusted-story",
      sourceId: "source-trusted"
    }),
    makeStory({
      id: "other-story",
      sourceId: "source-other"
    })
  );

  const result = await getPersonalizedFeed({
    userId: "user-1",
    page: 1,
    limit: 10,
    mode: "personalized"
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["trusted-story", "other-story"]
  );

  assert.equal(
    result.stories[0].scoring.sourceScore,
    5
  );

  assert.equal(
    result.stories[1].scoring.sourceScore,
    0
  );
});

// ============================================================
// POPULARITY SCORING
// ============================================================

test("personalized feed includes normalized popularity score", async () => {
  resetMocks();

  mockStories.push(
    makeStory({
      id: "popular",
      points: 100
    }),
    makeStory({
      id: "less-popular",
      points: 10
    })
  );

  const result = await getPersonalizedFeed({
    userId: "user-1",
    page: 1,
    limit: 10,
    mode: "personalized"
  });

  assert.equal(
    result.stories[0].id,
    "popular"
  );

  assert.equal(
    result.stories[0].scoring.popularityScore,
    0.1
  );

  assert.equal(
    result.stories[1].scoring.popularityScore,
    0.01
  );
});

// ============================================================
// SKIPPED STORIES
// ============================================================

test("personalized feed removes skipped stories", async () => {
  resetMocks();

  mockStories.push(
    makeStory({
      id: "visible"
    }),
    makeStory({
      id: "skipped"
    })
  );

  mockSkippedStories.push({
    storyId: "skipped"
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    page: 1,
    limit: 10,
    mode: "personalized"
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["visible"]
  );
});

// ============================================================
// PAGINATION
// ============================================================

test("personalized feed paginates results correctly", async () => {
  resetMocks();

  for (let i = 1; i <= 5; i++) {
    mockStories.push(
      makeStory({
        id: `story-${i}`,
        publishedAt: `2026-08-${String(
          31 - i
        ).padStart(2, "0")}T10:00:00Z`
      })
    );
  }

  const result = await getPersonalizedFeed({
    userId: "user-1",
    page: 2,
    limit: 2,
    mode: "personalized"
  });

  assert.equal(result.pagination.total, 5);
  assert.equal(result.pagination.page, 2);
  assert.equal(result.pagination.limit, 2);
  assert.equal(result.pagination.totalPages, 3);
  assert.equal(result.pagination.hasNextPage, true);
  assert.equal(result.pagination.hasPreviousPage, true);

  assert.equal(result.stories.length, 2);
});