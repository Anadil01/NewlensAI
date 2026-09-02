const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../utils/prisma");

const {
  getPersonalizedFeed
} = require("../services/personalizationService");

// ============================================================
// MOCK PRISMA
//
// Personalized mode reads SEVEN tables. Every one has to be
// stubbed: a single un-stubbed query reaches the real database
// and fails on the fake user id.
// ============================================================

const originalMethods = {
  userPreference: prisma.userPreference.findMany,
  userSourcePreference: prisma.userSourcePreference.findMany,
  readingHistory: prisma.readingHistory.findMany,
  storyFeedback: prisma.storyFeedback.findMany,
  bookmark: prisma.bookmark.findMany,
  storySkip: prisma.storySkip.findMany,
  story: prisma.story.findMany
};

const mock = {
  stories: [],
  topicPreferences: [],
  sourcePreferences: [],
  readingHistory: [],
  feedback: [],
  bookmarks: [],
  skips: []
};

prisma.userPreference.findMany = async () => mock.topicPreferences;

prisma.userSourcePreference.findMany = async () =>
  mock.sourcePreferences;

prisma.readingHistory.findMany = async () => mock.readingHistory;

prisma.storyFeedback.findMany = async () => mock.feedback;

prisma.bookmark.findMany = async () => mock.bookmarks;

prisma.storySkip.findMany = async () => mock.skips;

prisma.story.findMany = async () => mock.stories;

const resetMocks = () => {
  for (const key of Object.keys(mock)) {
    mock[key].length = 0;
  }
};

test.after(() => {
  prisma.userPreference.findMany = originalMethods.userPreference;

  prisma.userSourcePreference.findMany =
    originalMethods.userSourcePreference;

  prisma.readingHistory.findMany = originalMethods.readingHistory;

  prisma.storyFeedback.findMany = originalMethods.storyFeedback;

  prisma.bookmark.findMany = originalMethods.bookmark;

  prisma.storySkip.findMany = originalMethods.storySkip;

  prisma.story.findMany = originalMethods.story;
});

// ============================================================
// HELPERS
//
// Ages are expressed RELATIVE to a clock captured once per run.
// Fixed calendar dates would silently drift past the freshness
// window and start failing on their own months later.
// ============================================================

const HOUR_MS = 60 * 60 * 1000;

const NOW = Date.now();

const at = (ageHours) => new Date(NOW - ageHours * HOUR_MS);

const makeStory = ({
  id,
  sourceId = "source-1",
  clusterId = null,
  points = 0,
  ageHours = 1,
  topicIds = []
}) => {
  const publishedAt = at(ageHours);

  return {
    id,
    sourceId,
    externalId: `${id}-external`,
    canonicalUrl: `https://example.com/${id}`,
    title: `Story ${id}`,
    author: null,
    content: null,
    excerpt: null,
    contentStatus: "EXTERNAL_ONLY",
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
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
  };
};

/**
 * The shape the service selects for every interaction row. The
 * engine generalizes an interaction onto the story's topics,
 * source and cluster, so all three have to be present.
 */
const interactionStory = ({
  id,
  sourceId = "source-1",
  clusterId = null,
  topicIds = []
}) => ({
  id,
  clusterId,
  sourceId,

  storyTopics: topicIds.map((topicId) => ({
    topicId
  }))
});

const makeRead = ({
  storyId,
  sourceId,
  clusterId = null,
  topicIds = [],
  durationSeconds = 120,
  completed = true,
  ageHours = 1
}) => ({
  storyId,
  openedAt: at(ageHours),
  durationSeconds,
  completed,

  story: interactionStory({
    id: storyId,
    sourceId,
    clusterId,
    topicIds
  })
});

const makeFeedback = ({
  storyId,
  feedback,
  sourceId,
  clusterId = null,
  topicIds = [],
  ageHours = 1
}) => ({
  storyId,
  feedback,
  createdAt: at(ageHours),

  story: interactionStory({
    id: storyId,
    sourceId,
    clusterId,
    topicIds
  })
});

const feedFor = (overrides = {}) =>
  getPersonalizedFeed({
    userId: "user-1",
    page: 1,
    limit: 10,
    mode: "personalized",
    ...overrides
  });

const idsOf = (result) =>
  result.stories.map((story) => story.id);

// ============================================================
// EXPLICIT TOPIC PREFERENCES
// ============================================================

test("personalized feed ranks stories using topic preferences", async () => {
  resetMocks();

  mock.topicPreferences.push(
    {
      topicId: "topic-ai",
      preference: 5
    },
    {
      topicId: "topic-sports",
      preference: 1
    }
  );

  mock.stories.push(
    makeStory({
      id: "ai-story",
      topicIds: ["topic-ai"]
    }),
    makeStory({
      id: "sports-story",
      topicIds: ["topic-sports"]
    })
  );

  const result = await feedFor();

  assert.deepEqual(idsOf(result), [
    "ai-story",
    "sports-story"
  ]);

  const [ai, sports] = result.stories;

  assert.ok(ai.scoring.topicAffinity > sports.scoring.topicAffinity);
  assert.ok(sports.scoring.topicAffinity > 0);

  // Stated preferences count as personalization even before the
  // user has generated a single behavioural signal.
  assert.equal(result.personalization.mode, "personalized");
  assert.equal(result.personalization.personalized, true);
  assert.equal(result.personalization.topicPreferenceCount, 2);
  assert.equal(result.personalization.signalCount, 0);
  assert.equal(result.personalization.coldStart, true);
});

// ============================================================
// EXPLICIT SOURCE PREFERENCES
// ============================================================

test("personalized feed uses source preferences", async () => {
  resetMocks();

  mock.sourcePreferences.push({
    sourceId: "source-trusted",
    preference: 5
  });

  mock.stories.push(
    makeStory({
      id: "trusted-story",
      sourceId: "source-trusted"
    }),
    makeStory({
      id: "other-story",
      sourceId: "source-other"
    })
  );

  const result = await feedFor();

  assert.deepEqual(idsOf(result), [
    "trusted-story",
    "other-story"
  ]);

  assert.ok(result.stories[0].scoring.sourceAffinity > 0);
  assert.equal(result.stories[1].scoring.sourceAffinity, 0);
  assert.equal(result.personalization.sourcePreferenceCount, 1);
});

// ============================================================
// POPULARITY
// ============================================================

test("personalized feed rewards known popularity", async () => {
  resetMocks();

  mock.stories.push(
    makeStory({
      id: "popular",
      points: 100
    }),
    makeStory({
      id: "less-popular",
      points: 10
    })
  );

  const result = await feedFor();

  assert.deepEqual(idsOf(result), [
    "popular",
    "less-popular"
  ]);

  const [popular, lessPopular] = result.stories;

  assert.equal(popular.scoring.popularityKnown, true);
  assert.ok(popular.scoring.popularity > lessPopular.scoring.popularity);
});

// ============================================================
// SKIPPED STORIES
// ============================================================

test("personalized feed removes skipped stories", async () => {
  resetMocks();

  mock.stories.push(
    makeStory({
      id: "visible"
    }),
    makeStory({
      id: "skipped"
    })
  );

  mock.skips.push({
    storyId: "skipped",
    createdAt: at(1),

    story: interactionStory({
      id: "skipped"
    })
  });

  const result = await feedFor();

  assert.deepEqual(idsOf(result), ["visible"]);
});

// ============================================================
// BEHAVIOURAL SIGNALS
// ============================================================

test("reading history lifts the topics the user actually reads", async () => {
  resetMocks();

  mock.stories.push(
    makeStory({
      id: "ai-story",
      topicIds: ["topic-ai"]
    }),
    makeStory({
      id: "sports-story",
      topicIds: ["topic-sports"]
    })
  );

  // Reads are on OTHER stories from another source, so the only
  // thing they can explain is topic-level interest.
  for (let index = 1; index <= 5; index++) {
    mock.readingHistory.push(
      makeRead({
        storyId: `history-${index}`,
        sourceId: "source-archive",
        topicIds: ["topic-ai"],
        ageHours: index
      })
    );
  }

  const result = await feedFor();

  assert.deepEqual(idsOf(result), [
    "ai-story",
    "sports-story"
  ]);

  const [ai, sports] = result.stories;

  assert.ok(ai.scoring.topicAffinity > 0);
  assert.equal(sports.scoring.topicAffinity, 0);

  // Five meaningful interactions is the full-trust threshold.
  assert.equal(result.personalization.signalCount, 5);
  assert.equal(result.personalization.signalStrength, 1);
  assert.equal(result.personalization.coldStart, false);
});

test("an already-read story is demoted below an unread one", async () => {
  resetMocks();

  // Identical on every dimension except the read itself, so the
  // penalty is the only thing that can separate them.
  mock.stories.push(
    makeStory({
      id: "read-me",
      topicIds: ["topic-ai"]
    }),
    makeStory({
      id: "fresh-one",
      topicIds: ["topic-ai"]
    })
  );

  mock.readingHistory.push(
    makeRead({
      storyId: "read-me",
      topicIds: ["topic-ai"]
    })
  );

  const result = await feedFor();

  assert.deepEqual(idsOf(result), [
    "fresh-one",
    "read-me"
  ]);

  const byId = new Map(
    result.stories.map((story) => [story.id, story])
  );

  assert.equal(byId.get("fresh-one").scoring.penaltyMultiplier, 1);
  assert.ok(byId.get("read-me").scoring.penaltyMultiplier < 1);
});

test("a disliked story is demoted below a liked one", async () => {
  resetMocks();

  mock.stories.push(
    makeStory({
      id: "disliked",
      topicIds: ["topic-ai"]
    }),
    makeStory({
      id: "liked",
      topicIds: ["topic-ai"]
    })
  );

  mock.feedback.push(
    makeFeedback({
      storyId: "liked",
      feedback: "LIKE",
      topicIds: ["topic-ai"]
    }),
    makeFeedback({
      storyId: "disliked",
      feedback: "DISLIKE",
      topicIds: ["topic-ai"]
    })
  );

  const result = await feedFor();

  assert.deepEqual(idsOf(result), ["liked", "disliked"]);

  const byId = new Map(
    result.stories.map((story) => [story.id, story])
  );

  assert.ok(byId.get("disliked").scoring.penaltyMultiplier < 1);
  assert.equal(byId.get("liked").scoring.penaltyMultiplier, 1);
});

// ============================================================
// PAGINATION
// ============================================================

test("personalized feed paginates results correctly", async () => {
  resetMocks();

  // Strictly increasing age gives a strictly decreasing freshness
  // score, so the expected order is unambiguous.
  for (let index = 1; index <= 5; index++) {
    mock.stories.push(
      makeStory({
        id: `story-${index}`,
        ageHours: index
      })
    );
  }

  const result = await feedFor({
    page: 2,
    limit: 2
  });

  assert.deepEqual(idsOf(result), [
    "story-3",
    "story-4"
  ]);

  // `total` counts everything eligible, not everything ranked, so
  // the client sees a stable total while paging.
  assert.equal(result.pagination.total, 5);
  assert.equal(result.pagination.page, 2);
  assert.equal(result.pagination.limit, 2);
  assert.equal(result.pagination.totalPages, 3);
  assert.equal(result.pagination.hasNextPage, true);
  assert.equal(result.pagination.hasPreviousPage, true);
});

// ============================================================
// VALIDATION
// ============================================================

test("personalized feed rejects an unknown mode", async () => {
  resetMocks();

  await assert.rejects(
    () =>
      feedFor({
        mode: "nonsense"
      }),
    /Invalid feed mode/
  );
});
