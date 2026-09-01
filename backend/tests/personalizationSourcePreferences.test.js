const test = require("node:test");
const assert = require("node:assert/strict");

const prisma = require("../utils/prisma");

const {
  getSourcePreferences,
  followSource,
  unfollowSource
} = require("../services/personalizationService");

const originalMethods = {
  sourcePreferenceFindMany:
    prisma.userSourcePreference.findMany,

  sourcePreferenceUpsert:
    prisma.userSourcePreference.upsert,

  sourcePreferenceDeleteMany:
    prisma.userSourcePreference.deleteMany,

  sourceFindUnique:
    prisma.sources.findUnique
};

const mockSourcePreferences = [];
const mockSources = new Map();

const resetMocks = () => {
  mockSourcePreferences.length = 0;
  mockSources.clear();

  prisma.userSourcePreference.findMany =
    originalMethods.sourcePreferenceFindMany;

  prisma.userSourcePreference.upsert =
    originalMethods.sourcePreferenceUpsert;

  prisma.userSourcePreference.deleteMany =
    originalMethods.sourcePreferenceDeleteMany;

  prisma.sources.findUnique =
    originalMethods.sourceFindUnique;
};

test.beforeEach(() => {
  resetMocks();
});

test.after(() => {
  resetMocks();
});

// ============================================================
// GET SOURCE PREFERENCES
// ============================================================

test("getSourcePreferences returns user source preferences", async () => {
  mockSourcePreferences.push(
    {
      id: "pref-1",
      userId: "user-1",
      sourceId: "source-1",
      preference: 5,
      source: {
        id: "source-1",
        name: "BBC"
      }
    },
    {
      id: "pref-2",
      userId: "user-1",
      sourceId: "source-2",
      preference: 3,
      source: {
        id: "source-2",
        name: "Reuters"
      }
    }
  );

  prisma.userSourcePreference.findMany = async (args) => {
    assert.equal(args.where.userId, "user-1");
    assert.deepEqual(args.include, {
      source: true
    });
    assert.deepEqual(args.orderBy, {
      source: {
        name: "asc"
      }
    });

    return mockSourcePreferences;
  };

  const result =
    await getSourcePreferences("user-1");

  assert.equal(result.length, 2);
  assert.equal(result[0].source.name, "BBC");
  assert.equal(result[1].source.name, "Reuters");
});

test("getSourcePreferences returns empty array when user has no preferences", async () => {
  prisma.userSourcePreference.findMany = async () => [];

  const result =
    await getSourcePreferences("user-1");

  assert.deepEqual(result, []);
});

// ============================================================
// FOLLOW SOURCE
// ============================================================

test("followSource creates a preference of 5", async () => {
  mockSources.set("source-1", {
    id: "source-1",
    name: "Reuters"
  });

  prisma.sources.findUnique = async ({ where }) => {
    assert.equal(where.id, "source-1");

    return mockSources.get(where.id) || null;
  };

  prisma.userSourcePreference.upsert = async ({ where, create, update, include }) => {
    assert.deepEqual(where, {
      userId_sourceId: {
        userId: "user-1",
        sourceId: "source-1"
      }
    });

    assert.deepEqual(create, {
      userId: "user-1",
      sourceId: "source-1",
      preference: 5
    });

    assert.deepEqual(update, {
      preference: 5
    });

    assert.deepEqual(include, {
      source: true
    });

    return {
      id: "pref-1",
      userId: "user-1",
      sourceId: "source-1",
      preference: 5,
      source: mockSources.get("source-1")
    };
  };

  const result = await followSource({
    userId: "user-1",
    sourceId: "source-1"
  });

  assert.equal(result.preference, 5);
  assert.equal(result.sourceId, "source-1");
  assert.equal(result.source.name, "Reuters");
});

test("followSource resets existing preference to 5", async () => {
  mockSources.set("source-1", {
    id: "source-1",
    name: "Reuters"
  });

  prisma.sources.findUnique = async () =>
    mockSources.get("source-1");

  prisma.userSourcePreference.upsert = async ({ update }) => {
    assert.deepEqual(update, {
      preference: 5
    });

    return {
      id: "pref-1",
      userId: "user-1",
      sourceId: "source-1",
      preference: 5,
      source: mockSources.get("source-1")
    };
  };

  const result = await followSource({
    userId: "user-1",
    sourceId: "source-1"
  });

  assert.equal(result.preference, 5);
});

test("followSource throws when source does not exist", async () => {
  prisma.sources.findUnique = async () => null;

  await assert.rejects(
    () =>
      followSource({
        userId: "user-1",
        sourceId: "missing-source"
      }),
    {
      message: "Source not found",
      statusCode: 404
    }
  );
});

// ============================================================
// UNFOLLOW SOURCE
// ============================================================

test("unfollowSource removes source preference", async () => {
  mockSources.set("source-1", {
    id: "source-1",
    name: "Reuters"
  });

  prisma.sources.findUnique = async ({ where }) => {
    assert.equal(where.id, "source-1");

    return mockSources.get(where.id) || null;
  };

  prisma.userSourcePreference.deleteMany = async ({ where }) => {
    assert.deepEqual(where, {
      userId: "user-1",
      sourceId: "source-1"
    });

    return {
      count: 1
    };
  };

  const result = await unfollowSource({
    userId: "user-1",
    sourceId: "source-1"
  });

  assert.deepEqual(result, {
    unfollowed: true,
    sourceId: "source-1"
  });
});

test("unfollowSource throws when source does not exist", async () => {
  prisma.sources.findUnique = async () => null;

  await assert.rejects(
    () =>
      unfollowSource({
        userId: "user-1",
        sourceId: "missing-source"
      }),
    {
      message: "Source not found",
      statusCode: 404
    }
  );
});