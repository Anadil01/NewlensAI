const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createPlacementState,
  primaryTopicOf,
  recordPlacement,
  clusterAdjustment,
  sourceAdjustment,
  topicAdjustment,
  diversityAdjustment,
  diversify
} = require("../recommendation/diversify");

const { round } = require("../recommendation/normalize");

// ------------------------------------------------------------
// FIXTURES
// ------------------------------------------------------------

const story = ({
  id,
  sourceId = null,
  clusterId = null,
  topicIds = []
} = {}) => ({ id, sourceId, clusterId, topicIds });

const scored = (entries) =>
  entries.map(({ score, ...rest }) => ({
    story: story(rest),
    score
  }));

const idsOf = (selected) => selected.map((entry) => entry.story.id);

const stateWith = (stories) => {
  const state = createPlacementState();

  for (const item of stories) {
    recordPlacement(state, item);
  }

  return state;
};

// ============================================================
// PRIMARY TOPIC
// ============================================================

test("primaryTopicOf takes the highest-confidence topic", () => {
  // Ingestion orders topicIds by classification confidence.
  assert.equal(primaryTopicOf(story({ id: "a", topicIds: ["t1", "t2"] })), "t1");

  assert.equal(primaryTopicOf(story({ id: "a", topicIds: [] })), null);
  assert.equal(primaryTopicOf({ id: "a" }), null);
});

// ============================================================
// PLACEMENT STATE
// ============================================================

test("recordPlacement tracks clusters, sources, topics and runs", () => {
  const state = stateWith([
    story({ id: "a", sourceId: "s1", clusterId: "c1", topicIds: ["t1", "t2"] }),
    story({ id: "b", sourceId: "s1", clusterId: "c2", topicIds: ["t1"] })
  ]);

  assert.equal(state.placedCount, 2);
  assert.equal(state.sourceCounts.get("s1"), 2);
  assert.equal(state.clusterCounts.get("c1"), 1);

  // Secondary topics count toward topic totals too.
  assert.equal(state.topicCounts.get("t1"), 2);
  assert.equal(state.topicCounts.get("t2"), 1);

  // Two consecutive stories share primary topic t1.
  assert.equal(state.runTopicId, "t1");
  assert.equal(state.runLength, 2);
});

test("a different primary topic resets the run", () => {
  const state = stateWith([
    story({ id: "a", topicIds: ["t1"] }),
    story({ id: "b", topicIds: ["t1"] }),
    story({ id: "c", topicIds: ["t2"] })
  ]);

  assert.equal(state.runTopicId, "t2");
  assert.equal(state.runLength, 1);
});

// ============================================================
// CLUSTER CAP
// ============================================================

test("cluster coverage is capped at two stories per event", () => {
  const target = story({ id: "x", clusterId: "c1" });

  const after = (count) =>
    clusterAdjustment(
      stateWith(
        Array.from({ length: count }, (_, i) =>
          story({ id: `p${i}`, clusterId: "c1" })
        )
      ),
      target
    );

  // First story about an event: full score.
  assert.equal(after(0).multiplier, 1);

  // Second is allowed but must outrank genuinely new news.
  assert.equal(after(1).multiplier, 0.6);

  // Third is near-duplicate coverage and is dropped outright.
  assert.equal(after(2).blocked, true);
  assert.equal(after(2).multiplier, 0);
});

test("unclustered stories are never cluster-capped", () => {
  // A null clusterId means "could not group", not "same event".
  const state = stateWith([
    story({ id: "a" }),
    story({ id: "b" }),
    story({ id: "c" })
  ]);

  const result = clusterAdjustment(state, story({ id: "x" }));

  assert.equal(result.multiplier, 1);
  assert.equal(result.blocked, false);
});

// ============================================================
// SOURCE REPETITION
// ============================================================

test("source penalty compounds so one outlet cannot own the page", () => {
  const target = story({ id: "x", sourceId: "s1" });

  const after = (count) =>
    sourceAdjustment(
      stateWith(
        Array.from({ length: count }, (_, i) =>
          story({ id: `p${i}`, sourceId: "s1" })
        )
      ),
      target
    );

  assert.equal(after(0).multiplier, 1);
  assert.equal(after(1).multiplier, 0.75);
  assert.equal(round(after(2).multiplier), 0.5625);
  assert.ok(after(4).multiplier < 0.35);

  // A different source is unaffected.
  const state = stateWith([story({ id: "p", sourceId: "s1" })]);

  assert.equal(sourceAdjustment(state, story({ id: "x", sourceId: "s2" })).multiplier, 1);
});

// ============================================================
// TOPIC REPETITION
// ============================================================

test("topic penalty is gentler than the source penalty", () => {
  const target = story({ id: "x", topicIds: ["t1"] });

  const state = stateWith([story({ id: "p", topicIds: ["t1"] })]);

  const topic = topicAdjustment(state, target).multiplier;
  const source = sourceAdjustment(
    stateWith([story({ id: "p", sourceId: "s1" })]),
    story({ id: "x", sourceId: "s1" })
  ).multiplier;

  // A user who likes a topic SHOULD see more of it.
  assert.equal(topic, 0.85);
  assert.ok(topic > source);
});

test("more than two consecutive same-topic stories are deferred", () => {
  const target = story({ id: "x", topicIds: ["t1"] });

  const oneInARow = topicAdjustment(
    stateWith([story({ id: "p", topicIds: ["t1"] })]),
    target
  );

  assert.equal(oneInARow.breaksRun, false);

  const twoInARow = topicAdjustment(
    stateWith([
      story({ id: "p1", topicIds: ["t1"] }),
      story({ id: "p2", topicIds: ["t1"] })
    ]),
    target
  );

  assert.equal(twoInARow.breaksRun, true);

  // Deferred, not blocked: `diversityAdjustment` reports it separately
  // from a hard cluster block.
  const adjustment = diversityAdjustment(
    stateWith([
      story({ id: "p1", topicIds: ["t1"] }),
      story({ id: "p2", topicIds: ["t1"] })
    ]),
    target
  );

  assert.equal(adjustment.deferred, true);
  assert.equal(adjustment.blocked, false);
});

test("a broken run makes the topic eligible again", () => {
  const state = stateWith([
    story({ id: "p1", topicIds: ["t1"] }),
    story({ id: "p2", topicIds: ["t1"] }),
    story({ id: "p3", topicIds: ["t2"] })
  ]);

  const result = topicAdjustment(state, story({ id: "x", topicIds: ["t1"] }));

  assert.equal(result.breaksRun, false);

  // Still carries the accumulated repetition penalty.
  assert.equal(round(result.multiplier), 0.7225);
});

// ============================================================
// GREEDY RE-RANKING
// ============================================================

test("diversify keeps score order when there is nothing to diversify", () => {
  const input = scored([
    { id: "a", sourceId: "s1", score: 10 },
    { id: "b", sourceId: "s2", score: 9 },
    { id: "c", sourceId: "s3", score: 8 }
  ]);

  const result = diversify(input, 3);

  assert.deepEqual(idsOf(result), ["a", "b", "c"]);
  assert.deepEqual(
    result.map((entry) => entry.position),
    [0, 1, 2]
  );
});

test("diversify drops third-and-beyond coverage of the same event", () => {
  const input = scored([
    { id: "c1-a", clusterId: "c1", sourceId: "s1", score: 10 },
    { id: "c1-b", clusterId: "c1", sourceId: "s2", score: 9 },
    { id: "c1-c", clusterId: "c1", sourceId: "s3", score: 8 },
    { id: "c1-d", clusterId: "c1", sourceId: "s4", score: 7 },
    { id: "other", clusterId: "c2", sourceId: "s5", score: 1 }
  ]);

  const result = diversify(input, 5);

  // Only two from c1 despite four being high-scoring, and the feed is
  // short rather than padded with duplicates.
  assert.deepEqual(idsOf(result), ["c1-a", "c1-b", "other"]);
});

test("diversify interleaves sources instead of stacking one outlet", () => {
  const input = scored([
    { id: "a1", sourceId: "sA", score: 10 },
    { id: "a2", sourceId: "sA", score: 9 },
    { id: "a3", sourceId: "sA", score: 8 },
    { id: "b1", sourceId: "sB", score: 6 }
  ]);

  const result = diversify(input, 3);

  // By slot 3 the compounded 0.5625 multiplier on sA drops it below
  // the untouched sB story.
  assert.deepEqual(idsOf(result), ["a1", "a2", "b1"]);
});

test("diversify breaks up a topic run when an alternative exists", () => {
  const input = scored([
    { id: "t1-a", sourceId: "s1", topicIds: ["t1"], score: 10 },
    { id: "t1-b", sourceId: "s2", topicIds: ["t1"], score: 9 },
    { id: "t1-c", sourceId: "s3", topicIds: ["t1"], score: 8 },
    { id: "t2-a", sourceId: "s4", topicIds: ["t2"], score: 1 }
  ]);

  const result = diversify(input, 4);

  // The much weaker t2 story is promoted into slot 3 purely to break
  // the run, then the t1 story returns.
  assert.deepEqual(idsOf(result), ["t1-a", "t1-b", "t2-a", "t1-c"]);
});

test("diversify relaxes the topic run rather than returning a short feed", () => {
  const input = scored([
    { id: "a", sourceId: "s1", topicIds: ["t1"], score: 10 },
    { id: "b", sourceId: "s2", topicIds: ["t1"], score: 9 },
    { id: "c", sourceId: "s3", topicIds: ["t1"], score: 8 },
    { id: "d", sourceId: "s4", topicIds: ["t1"], score: 7 }
  ]);

  const result = diversify(input, 4);

  // A single-interest user still gets a full page.
  assert.equal(result.length, 4);
  assert.deepEqual(idsOf(result), ["a", "b", "c", "d"]);

  // And the relaxation is recorded rather than hidden.
  assert.equal(result[1].diversity.relaxedTopicRun, false);
  assert.equal(result[2].diversity.relaxedTopicRun, true);
});

test("diversify respects the limit and leaves the input untouched", () => {
  const input = scored([
    { id: "a", sourceId: "s1", score: 10 },
    { id: "b", sourceId: "s2", score: 9 },
    { id: "c", sourceId: "s3", score: 8 }
  ]);

  const snapshot = idsOf(input);

  const result = diversify(input, 2);

  assert.equal(result.length, 2);

  // Callers reuse the scored array (e.g. for metrics), so it must not
  // be consumed by ranking.
  assert.equal(input.length, 3);
  assert.deepEqual(idsOf(input), snapshot);
});

test("diversify handles an empty candidate set and an oversized limit", () => {
  assert.deepEqual(diversify([], 10), []);

  const input = scored([{ id: "a", sourceId: "s1", score: 5 }]);

  assert.equal(diversify(input, 50).length, 1);
});

test("diversify exposes the applied multiplier for explainability", () => {
  const input = scored([
    { id: "a", sourceId: "s1", topicIds: ["t1"], score: 10 },
    { id: "b", sourceId: "s1", topicIds: ["t1"], score: 9 }
  ]);

  const result = diversify(input, 2);

  assert.equal(result[0].diversity.multiplier, 1);

  // Same source and same topic: 0.75 * 0.85.
  assert.equal(round(result[1].diversity.multiplier), 0.6375);
  assert.equal(result[1].diversity.sourcePlaced, 1);
  assert.equal(result[1].diversity.topicPlaced, 1);
  assert.equal(round(result[1].diversity.adjustedScore), 5.7375);
});
