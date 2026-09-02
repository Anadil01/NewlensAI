const test = require("node:test");
const assert = require("node:assert/strict");

const {
  storyTimestampMs,
  freshness,
  popularity,
  buildClusterStats,
  clusterImportance,
  computeQuality
} = require("../recommendation/quality");

const { round, MS_PER_HOUR } = require("../recommendation/normalize");

// ------------------------------------------------------------
// FIXTURES
// ------------------------------------------------------------

const NOW = new Date("2026-09-01T12:00:00Z").getTime();

const hoursAgo = (hours) => new Date(NOW - hours * MS_PER_HOUR);

const story = ({
  id = "story-1",
  sourceId = "source-1",
  clusterId = null,
  publishedAt = hoursAgo(0),
  createdAt = hoursAgo(0),
  points = null
} = {}) => ({ id, sourceId, clusterId, publishedAt, createdAt, points });

// ============================================================
// TIMESTAMP RESOLUTION
// ============================================================

test("storyTimestampMs prefers publishedAt and falls back to createdAt", () => {
  assert.equal(
    storyTimestampMs({ publishedAt: hoursAgo(5), createdAt: hoursAgo(1) }),
    hoursAgo(5).getTime()
  );

  // publishedAt is nullable in the schema, so ingestion time is the
  // fallback rather than treating the story as dateless.
  assert.equal(
    storyTimestampMs({ publishedAt: null, createdAt: hoursAgo(3) }),
    hoursAgo(3).getTime()
  );

  assert.equal(storyTimestampMs({}), null);
  assert.equal(storyTimestampMs({ publishedAt: "garbage" }), null);
});

// ============================================================
// FRESHNESS
// ============================================================

test("freshness halves every 12 hours", () => {
  const at = (hours) => freshness(story({ publishedAt: hoursAgo(hours) }), NOW);

  assert.equal(at(0).value, 1);
  assert.equal(round(at(12).value), 0.5);
  assert.equal(round(at(24).value), 0.25);
  assert.equal(round(at(48).value), 0.0625);

  assert.equal(at(6).ageHours, 6);
});

test("freshness is zero past the 72 hour cutoff", () => {
  assert.equal(freshness(story({ publishedAt: hoursAgo(72) }), NOW).value, 0);
  assert.equal(freshness(story({ publishedAt: hoursAgo(200) }), NOW).value, 0);

  // Just inside the window still counts for something.
  assert.ok(freshness(story({ publishedAt: hoursAgo(71) }), NOW).value > 0);
});

test("a future publish date is treated as brand new, not as a bonus", () => {
  // Bad source data with a future date must not amplify freshness
  // beyond 1.
  const result = freshness(story({ publishedAt: hoursAgo(-10) }), NOW);

  assert.equal(result.value, 1);
  assert.equal(result.ageHours, 0);
});

test("a dateless story gets a mid-range estimate rather than zero", () => {
  const result = freshness(
    { publishedAt: null, createdAt: null },
    NOW
  );

  // Scoring it 0 would make a data gap indistinguishable from stale
  // news and bury an otherwise relevant story.
  assert.equal(result.value, 0.5);
  assert.equal(result.estimated, true);
  assert.equal(result.ageHours, null);
});

// ============================================================
// POPULARITY
// ============================================================

test("popularity saturates so viral stories cannot dominate", () => {
  assert.equal(popularity(story({ points: 0 })).value, 0);
  assert.equal(popularity(story({ points: 500 })).value, 0.5);
  assert.equal(popularity(story({ points: 1500 })).value, 0.75);

  // A 100x point difference is worth well under 0.5 here.
  const big = popularity(story({ points: 5000 })).value;
  const huge = popularity(story({ points: 500000 })).value;

  assert.ok(huge < 1);
  assert.ok(huge - big < 0.1);
});

test("missing points means unknown, not unpopular", () => {
  const result = popularity(story({ points: null }));

  assert.equal(result.value, 0);

  // The flag lets the scorer redistribute the weight instead of
  // handicapping every RSS story against every Hacker News story.
  assert.equal(result.known, false);

  assert.equal(popularity(story({ points: 0 })).known, true);
});

// ============================================================
// CLUSTER STATS
// ============================================================

test("buildClusterStats counts distinct sources per cluster", () => {
  const stats = buildClusterStats([
    story({ id: "a", clusterId: "c1", sourceId: "s1" }),
    story({ id: "b", clusterId: "c1", sourceId: "s2" }),
    story({ id: "c", clusterId: "c1", sourceId: "s2" }),
    story({ id: "d", clusterId: "c2", sourceId: "s1" }),
    story({ id: "e", clusterId: null, sourceId: "s3" })
  ]);

  const c1 = stats.get("c1");

  assert.equal(c1.storyCount, 3);

  // s2 appears twice but counts once: repeat coverage from the same
  // outlet is not extra corroboration.
  assert.equal(c1.sourceIds.size, 2);

  assert.equal(stats.get("c2").sourceIds.size, 1);
  assert.equal(stats.has(null), false);
  assert.equal(stats.size, 2);
});

// ============================================================
// CLUSTER IMPORTANCE
// ============================================================

test("cluster importance rises with distinct source coverage", () => {
  const withSources = (count) => {
    const stories = Array.from({ length: count }, (_, index) =>
      story({ id: `s${index}`, clusterId: "c1", sourceId: `source-${index}` })
    );

    return clusterImportance(stories[0], buildClusterStats(stories));
  };

  // One source is no corroboration at all.
  assert.equal(withSources(1).value, 0);

  assert.equal(round(withSources(2).value), 0.25);
  assert.equal(round(withSources(3).value), 0.5);
  assert.equal(withSources(5).value, 1);

  // Saturated: 20 outlets is not 4x more important than 5.
  assert.equal(withSources(20).value, 1);
});

test("repeat coverage from one source does not inflate importance", () => {
  const stories = [
    story({ id: "a", clusterId: "c1", sourceId: "s1" }),
    story({ id: "b", clusterId: "c1", sourceId: "s1" }),
    story({ id: "c", clusterId: "c1", sourceId: "s1" })
  ];

  const result = clusterImportance(stories[0], buildClusterStats(stories));

  // Five follow-ups from one outlet is not a bigger story.
  assert.equal(result.value, 0);
  assert.equal(result.sourceCount, 1);
  assert.equal(result.storyCount, 3);
});

test("unclustered stories and unknown clusters score zero", () => {
  const stats = buildClusterStats([
    story({ id: "a", clusterId: "c1", sourceId: "s1" })
  ]);

  assert.equal(clusterImportance(story({ clusterId: null }), stats).value, 0);
  assert.equal(
    clusterImportance(story({ clusterId: "missing" }), stats).value,
    0
  );

  // A missing stats map must not throw.
  assert.equal(
    clusterImportance(story({ clusterId: "c1" }), undefined).value,
    0
  );
});

// ============================================================
// COMBINED
// ============================================================

test("computeQuality returns all three terms in 0..1", () => {
  const candidates = [
    story({ id: "a", clusterId: "c1", sourceId: "s1", points: 500 }),
    story({ id: "b", clusterId: "c1", sourceId: "s2" }),
    story({ id: "c", clusterId: "c1", sourceId: "s3" })
  ];

  const clusterStats = buildClusterStats(candidates);

  const result = computeQuality(candidates[0], { nowMs: NOW, clusterStats });

  assert.equal(result.freshness.value, 1);
  assert.equal(result.popularity.value, 0.5);
  assert.equal(round(result.clusterImportance.value), 0.5);

  for (const term of Object.values(result)) {
    assert.ok(term.value >= 0 && term.value <= 1);
  }
});

test("a stale, unpopular, unclustered story scores zero across the board", () => {
  const result = computeQuality(
    story({ publishedAt: hoursAgo(100), createdAt: hoursAgo(100) }),
    { nowMs: NOW, clusterStats: new Map() }
  );

  assert.equal(result.freshness.value, 0);
  assert.equal(result.popularity.value, 0);
  assert.equal(result.clusterImportance.value, 0);
});
