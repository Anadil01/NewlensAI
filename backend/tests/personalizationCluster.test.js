const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyClusterDiminishingReturns,
  diversifyByCluster
} = require("../services/personalizationService");

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

test("cluster diminishing returns applies correct multipliers", () => {
  const stories = [
    makeStory("a1", "cluster-a", 10),
    makeStory("a2", "cluster-a", 10),
    makeStory("a3", "cluster-a", 10),
    makeStory("a4", "cluster-a", 10)
  ];

  const result = applyClusterDiminishingReturns(stories);

  assert.deepEqual(
    result.map(
      (story) =>
        story.scoring.clusterDiminishingReturns.multiplier
    ),
    [1, 0.80, 0.65, 0.55]
  );

  assert.deepEqual(
    result.map((story) => story.relevanceScore),
    [10, 8, 6.5, 5.5]
  );
});

test("each cluster has its own diminishing-return counter", () => {
  const stories = [
    makeStory("a1", "cluster-a", 10),
    makeStory("b1", "cluster-b", 10),
    makeStory("a2", "cluster-a", 10),
    makeStory("b2", "cluster-b", 10)
  ];

  const result = applyClusterDiminishingReturns(stories);

  assert.deepEqual(
    result.map(
      (story) =>
        story.scoring.clusterDiminishingReturns.multiplier
    ),
    [1, 1, 0.80, 0.80]
  );
});

test("unclustered stories are not penalized", () => {
  const stories = [
    makeStory("a", null, 10),
    makeStory("b", null, 9),
    makeStory("c", undefined, 8)
  ];

  const result = applyClusterDiminishingReturns(stories);

  assert.deepEqual(
    result.map((story) => story.relevanceScore),
    [10, 9, 8]
  );

  assert.equal(
    result[0].scoring,
    undefined
  );

  assert.equal(
    result[1].scoring,
    undefined
  );

  assert.equal(
    result[2].scoring,
    undefined
  );
});

test("diminishing returns preserves original story data", () => {
  const story = makeStory(
    "story-1",
    "cluster-a",
    7.5
  );

  const [result] =
    applyClusterDiminishingReturns([story]);

  assert.equal(result.id, "story-1");
  assert.equal(result.clusterId, "cluster-a");
  assert.equal(result.publishedAt, story.publishedAt);
  assert.equal(result.scoring.clusterDiminishingReturns.originalScore, 7.5);
  assert.equal(result.scoring.clusterDiminishingReturns.adjustedScore, 7.5);
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
