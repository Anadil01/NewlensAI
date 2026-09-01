const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getPersonalizedFeed
} = require("../services/personalizationService");

const prisma = require("../utils/prisma");

const makeStory = ({
  id,
  publishedAt,
  createdAt = publishedAt,
  points = 0,
  clusterId = null
}) => ({
  id,
  sourceId: "source-1",
  externalId: id,
  canonicalUrl: `https://example.com/${id}`,
  title: id,
  publishedAt,
  createdAt,
  points,
  clusterId,
  source: {
    id: "source-1",
    name: "Test Source",
    slug: "test-source",
    websiteUrl: "https://example.com",
    politicalLean: "CENTER",
    reliabilityScore: 0.9
  },
  cluster: clusterId
    ? {
        id: clusterId,
        title: `Cluster ${clusterId}`,
        description: null
      }
    : null,
  storyTopics: []
});

const originalFindMany = prisma.story.findMany;
const originalPreferenceFindMany =
  prisma.userPreference.findMany;
const originalSourcePreferenceFindMany =
  prisma.userSourcePreference.findMany;
const originalStorySkipFindMany =
  prisma.storySkip.findMany;

const setup = ({
  stories = [],
  preferences = [],
  sourcePreferences = [],
  skippedStories = []
} = {}) => {
  prisma.story.findMany = async () => stories;

  prisma.userPreference.findMany = async () =>
    preferences;

  prisma.userSourcePreference.findMany = async () =>
    sourcePreferences;

  prisma.storySkip.findMany = async () =>
    skippedStories;
};

const restore = () => {
  prisma.story.findMany = originalFindMany;
  prisma.userPreference.findMany =
    originalPreferenceFindMany;
  prisma.userSourcePreference.findMany =
    originalSourcePreferenceFindMany;
  prisma.storySkip.findMany =
    originalStorySkipFindMany;
};

test.afterEach(() => {
  restore();
});

test("latest mode sorts stories chronologically", async () => {
  setup({
    stories: [
      makeStory({
        id: "old",
        publishedAt: "2026-08-28T10:00:00Z"
      }),
      makeStory({
        id: "new",
        publishedAt: "2026-08-31T10:00:00Z"
      }),
      makeStory({
        id: "middle",
        publishedAt: "2026-08-30T10:00:00Z"
      })
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "latest",
    page: 1,
    limit: 10
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["new", "middle", "old"]
  );

  assert.equal(
    result.stories[0].scoring.mode,
    "latest"
  );
});

test("latest mode falls back to createdAt", async () => {
  setup({
    stories: [
      makeStory({
        id: "older",
        publishedAt: null,
        createdAt: "2026-08-29T10:00:00Z"
      }),
      makeStory({
        id: "newer",
        publishedAt: null,
        createdAt: "2026-08-31T10:00:00Z"
      })
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "latest",
    page: 1,
    limit: 10
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["newer", "older"]
  );
});

test("latest mode excludes skipped stories", async () => {
  setup({
    stories: [
      makeStory({
        id: "visible",
        publishedAt: "2026-08-31T10:00:00Z"
      }),
      makeStory({
        id: "skipped",
        publishedAt: "2026-08-30T10:00:00Z"
      })
    ],
    skippedStories: [
      {
        storyId: "skipped"
      }
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "latest",
    page: 1,
    limit: 10
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["visible"]
  );

  assert.equal(result.pagination.total, 1);
});

test("latest mode paginates correctly", async () => {
  setup({
    stories: [
      makeStory({
        id: "story-1",
        publishedAt: "2026-08-31T12:00:00Z"
      }),
      makeStory({
        id: "story-2",
        publishedAt: "2026-08-31T11:00:00Z"
      }),
      makeStory({
        id: "story-3",
        publishedAt: "2026-08-31T10:00:00Z"
      })
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "latest",
    page: 2,
    limit: 2
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["story-3"]
  );

  assert.equal(result.pagination.total, 3);
  assert.equal(result.pagination.totalPages, 2);
  assert.equal(result.pagination.hasNextPage, false);
  assert.equal(result.pagination.hasPreviousPage, true);
});

test("trending mode calculates popularity and recency", async () => {
  const now = Date.now();

  setup({
    stories: [
      makeStory({
        id: "popular",
        publishedAt: new Date(
          now - 1 * 60 * 60 * 1000
        ).toISOString(),
        points: 100
      }),
      makeStory({
        id: "old",
        publishedAt: new Date(
          now - 48 * 60 * 60 * 1000
        ).toISOString(),
        points: 100
      })
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "trending",
    page: 1,
    limit: 10
  });

  assert.equal(result.stories[0].id, "popular");

  assert.equal(
    result.stories[0].scoring.mode,
    "trending"
  );

  assert.equal(
    result.stories[0].scoring.popularityScore,
    100
  );

  assert.ok(
    result.stories[0].scoring.recencyMultiplier >
      result.stories[1].scoring.recencyMultiplier
  );
});

test("trending mode caps popularity at 1000", async () => {
  const now = Date.now();

  setup({
    stories: [
      makeStory({
        id: "viral",
        publishedAt: new Date(
          now - 60 * 60 * 1000
        ).toISOString(),
        points: 5000
      })
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "trending",
    page: 1,
    limit: 10
  });

  assert.equal(
    result.stories[0].scoring.popularityScore,
    1000
  );
});

test("trending mode handles null points", async () => {
  const now = Date.now();

  setup({
    stories: [
      makeStory({
        id: "no-points",
        publishedAt: new Date(
          now - 60 * 60 * 1000
        ).toISOString(),
        points: null
      })
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "trending",
    page: 1,
    limit: 10
  });

  assert.equal(
    result.stories[0].scoring.popularityScore,
    0
  );

  assert.equal(
    result.stories[0].relevanceScore,
    0
  );
});

test("trending mode diversifies clustered stories", async () => {
    const now = Date.now();
  
    setup({
      stories: [
        makeStory({
          id: "a1",
          clusterId: "cluster-a",
          publishedAt: new Date(
            now - 60 * 60 * 1000
          ).toISOString(),
          points: 100
        }),
        makeStory({
          id: "a2",
          clusterId: "cluster-a",
          publishedAt: new Date(
            now - 2 * 60 * 60 * 1000
          ).toISOString(),
          points: 90
        }),
        makeStory({
          id: "b1",
          clusterId: "cluster-b",
          publishedAt: new Date(
            now - 3 * 60 * 60 * 1000
          ).toISOString(),
          points: 80
        })
      ]
    });
  
    const result = await getPersonalizedFeed({
      userId: "user-1",
      mode: "trending",
      page: 1,
      limit: 10
    });
  
    const ids = result.stories.map(
      (story) => story.id
    );
  
    // Both cluster-a stories remain visible,
    // but they should be separated by cluster-b.
    assert.deepEqual(
      ids,
      ["a1", "b1", "a2"]
    );
  });

test("trending mode excludes skipped stories", async () => {
  const now = Date.now();

  setup({
    stories: [
      makeStory({
        id: "visible",
        publishedAt: new Date(
          now - 60 * 60 * 1000
        ).toISOString(),
        points: 50
      }),
      makeStory({
        id: "skipped",
        publishedAt: new Date(
          now - 30 * 60 * 1000
        ).toISOString(),
        points: 1000
      })
    ],
    skippedStories: [
      {
        storyId: "skipped"
      }
    ]
  });

  const result = await getPersonalizedFeed({
    userId: "user-1",
    mode: "trending",
    page: 1,
    limit: 10
  });

  assert.deepEqual(
    result.stories.map((story) => story.id),
    ["visible"]
  );
});
