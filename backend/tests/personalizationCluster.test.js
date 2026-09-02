const test = require("node:test");
const assert = require("node:assert/strict");

const {
  diversifyByCluster
} = require("../services/personalizationService");

// ============================================================
// CLUSTER DIVERSIFICATION (TRENDING FEED)
//
// The personalized feed diversifies inside the recommendation
// engine (see tests/recommendationDiversify.test.js). This
// round-robin helper is what remains for the TRENDING feed,
// which is not personalized and is ordered purely by points.
// ============================================================

const makeStory = (
  id,
  clusterId,
  relevanceScore,
  publishedAt = "2026-08-31T10:00:00Z"
) => ({
  id,
  clusterId,
  relevanceScore,
  publishedAt,
  createdAt: publishedAt
});

test("cluster diversification spreads stories across clusters", () => {
  const stories = [
    makeStory("a1", "cluster-a", 10),
    makeStory("a2", "cluster-a", 9),
    makeStory("a3", "cluster-a", 8),
    makeStory("b1", "cluster-b", 7),
    makeStory("c1", "cluster-c", 6)
  ];

  const result = diversifyByCluster(stories);

  assert.deepEqual(
    result.map((story) => story.id),
    ["a1", "b1", "c1", "a2", "a3"]
  );
});

test("diversification keeps strongest story from each cluster first", () => {
  const stories = [
    { id: "a1", clusterId: "cluster-a", relevanceScore: 10 },
    { id: "a2", clusterId: "cluster-a", relevanceScore: 8 },
    { id: "b1", clusterId: "cluster-b", relevanceScore: 9 },
    { id: "b2", clusterId: "cluster-b", relevanceScore: 7 }
  ];

  const result = diversifyByCluster(stories);

  assert.deepEqual(
    result.map((story) => story.id),
    ["a1", "b1", "a2", "b2"]
  );
});

test("unclustered stories keep their incoming order", () => {
  const stories = [
    makeStory("a", null, 10),
    makeStory("b", null, 9),
    makeStory("c", undefined, 8)
  ];

  const result = diversifyByCluster(stories);

  assert.deepEqual(
    result.map((story) => story.id),
    ["a", "b", "c"]
  );
});

test("diversification preserves original story data", () => {
  const story = makeStory("story-1", "cluster-a", 7.5);

  const [result] = diversifyByCluster([story]);

  assert.equal(result.id, "story-1");
  assert.equal(result.clusterId, "cluster-a");
  assert.equal(result.relevanceScore, 7.5);
  assert.equal(result.publishedAt, story.publishedAt);
});

test("an empty candidate set diversifies to an empty feed", () => {
  assert.deepEqual(diversifyByCluster([]), []);
});
