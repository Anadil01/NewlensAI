const test = require("node:test");
const assert = require("node:assert/strict");

const {
  alreadyReadPenalty,
  clusterSeenPenalty,
  skipPenalty,
  dislikePenalty,
  alreadyBookmarkedPenalty,
  computePenalties
} = require("../recommendation/penalties");

const { round, MS_PER_DAY } = require("../recommendation/normalize");

// ------------------------------------------------------------
// FIXTURES
// ------------------------------------------------------------

const NOW = new Date("2026-09-01T12:00:00Z").getTime();

const daysAgoMs = (days) => NOW - days * MS_PER_DAY;

const makeProfile = ({
  readStories = [],
  readClusters = [],
  skips = [],
  feedback = [],
  bookmarks = []
} = {}) => ({
  nowMs: NOW,
  readStories: new Map(readStories),
  readClusters: new Map(readClusters),
  skipByStory: new Map(skips),
  feedbackByStory: new Map(feedback),
  bookmarkedStories: new Set(bookmarks)
});

const read = ({
  ageDays = 0,
  completed = false,
  count = 1,
  hasTimestamp = true
} = {}) => ({
  count,
  completed,
  totalDurationSeconds: 60,
  lastReadAtMs: hasTimestamp ? daysAgoMs(ageDays) : null
});

const story = (id, clusterId = null) => ({ id, clusterId });

// ============================================================
// ALREADY READ
//
// This is the behaviour that was previously INVERTED: reading a
// story used to boost that same story. These tests lock in the
// correct direction.
// ============================================================

test("an unread story carries no penalty", () => {
  const result = alreadyReadPenalty(makeProfile(), "story-1");

  assert.equal(result.multiplier, 1);
  assert.equal(result.applied, false);
});

test("a story read just now is heavily suppressed", () => {
  const profile = makeProfile({
    readStories: [["story-1", read({ ageDays: 0 })]]
  });

  const result = alreadyReadPenalty(profile, "story-1");

  assert.equal(result.multiplier, 0.15);
  assert.equal(result.applied, true);

  // The penalty must reduce the score, never increase it.
  assert.ok(result.multiplier < 1);
});

test("a finished story is suppressed harder than one merely opened", () => {
  const opened = makeProfile({
    readStories: [["story-1", read({ completed: false })]]
  });

  const finished = makeProfile({
    readStories: [["story-1", read({ completed: true })]]
  });

  const openedMultiplier = alreadyReadPenalty(opened, "story-1").multiplier;
  const finishedMultiplier = alreadyReadPenalty(finished, "story-1").multiplier;

  assert.equal(openedMultiplier, 0.15);
  assert.equal(round(finishedMultiplier), 0.09);

  assert.ok(finishedMultiplier < openedMultiplier);
});

test("the already-read penalty fades as the read recedes", () => {
  const at = (ageDays) =>
    alreadyReadPenalty(
      makeProfile({ readStories: [["story-1", read({ ageDays })]] }),
      "story-1"
    ).multiplier;

  assert.equal(at(0), 0.15);

  // Halfway through the 14-day recovery window.
  assert.equal(round(at(7)), 0.575);

  // Fully recovered: the story may surface normally again.
  assert.equal(at(14), 1);
  assert.equal(at(60), 1);
});

test("repeat opens suppress progressively harder, up to a cap", () => {
  const withCount = (count) =>
    alreadyReadPenalty(
      makeProfile({ readStories: [["story-1", read({ count })]] }),
      "story-1"
    ).multiplier;

  assert.equal(withCount(1), 0.15);
  assert.equal(round(withCount(2)), 0.1275);
  assert.equal(round(withCount(3)), 0.1084);
  assert.equal(round(withCount(4)), 0.0921);

  // Capped at 3 extra opens so the multiplier cannot collapse to 0
  // and permanently blacklist the story.
  assert.equal(withCount(10), withCount(4));
});

test("a read with no usable timestamp stays at the strongest penalty", () => {
  const profile = makeProfile({
    readStories: [["story-1", read({ hasTimestamp: false })]]
  });

  // We cannot prove the read was long ago, so we do not grant
  // recovery.
  assert.equal(alreadyReadPenalty(profile, "story-1").multiplier, 0.15);
});

// ============================================================
// CLUSTER ALREADY SEEN
// ============================================================

test("reading one story about an event suppresses other coverage of it", () => {
  const profile = makeProfile({
    readClusters: [
      ["cluster-1", { count: 1, storyIds: new Set(["story-read"]) }]
    ]
  });

  const result = clusterSeenPenalty(profile, story("story-other", "cluster-1"));

  assert.equal(result.multiplier, 0.45);
  assert.equal(result.applied, true);
  assert.equal(result.otherStoriesRead, 1);
});

test("the cluster penalty does not double-count the story itself", () => {
  const profile = makeProfile({
    readClusters: [
      ["cluster-1", { count: 1, storyIds: new Set(["story-1"]) }]
    ]
  });

  // story-1 is already handled by the already-read penalty; applying
  // the cluster penalty too would punish it twice for one read.
  const result = clusterSeenPenalty(profile, story("story-1", "cluster-1"));

  assert.equal(result.multiplier, 1);
  assert.equal(result.applied, false);
});

test("stories without a cluster, or in unseen clusters, are unaffected", () => {
  const profile = makeProfile({
    readClusters: [
      ["cluster-1", { count: 1, storyIds: new Set(["story-read"]) }]
    ]
  });

  assert.equal(clusterSeenPenalty(profile, story("s", null)).multiplier, 1);
  assert.equal(
    clusterSeenPenalty(profile, story("s", "cluster-unseen")).multiplier,
    1
  );
});

// ============================================================
// SKIP
//
// Previously skips were hard-filtered forever. Now they recover.
// ============================================================

test("a skip suppresses strongly then recovers within a week", () => {
  const at = (ageDays) =>
    skipPenalty(
      makeProfile({ skips: [["story-1", { createdAtMs: daysAgoMs(ageDays) }]] }),
      "story-1"
    ).multiplier;

  assert.equal(at(0), 0.2);
  assert.equal(round(at(3.5)), 0.6);

  // Fully recovered: one dismissal does not hide a story forever.
  assert.equal(at(7), 1);
  assert.equal(at(30), 1);
});

test("an unskipped story carries no skip penalty", () => {
  const result = skipPenalty(makeProfile(), "story-1");

  assert.equal(result.multiplier, 1);
  assert.equal(result.applied, false);
});

// ============================================================
// DISLIKE
// ============================================================

test("a dislike suppresses the story and does not recover", () => {
  const profile = makeProfile({
    feedback: [
      ["story-1", { feedback: "DISLIKE", createdAtMs: daysAgoMs(90) }]
    ]
  });

  const result = dislikePenalty(profile, "story-1");

  // Even 90 days later the multiplier is unchanged: the user made an
  // explicit judgement, unlike a skip.
  assert.equal(result.multiplier, 0.1);
  assert.equal(result.applied, true);
});

test("a like is not mistaken for a dislike", () => {
  const profile = makeProfile({
    feedback: [["story-1", { feedback: "LIKE", createdAtMs: NOW }]]
  });

  assert.equal(dislikePenalty(profile, "story-1").multiplier, 1);
  assert.equal(dislikePenalty(makeProfile(), "story-1").multiplier, 1);
});

// ============================================================
// ALREADY BOOKMARKED
// ============================================================

test("a bookmarked story is de-prioritised in the feed", () => {
  const profile = makeProfile({ bookmarks: ["story-1"] });

  const result = alreadyBookmarkedPenalty(profile, "story-1");

  // It is saved and reachable from the bookmarks page, so it does not
  // need prime feed space.
  assert.equal(result.multiplier, 0.5);
  assert.equal(result.applied, true);

  assert.equal(alreadyBookmarkedPenalty(profile, "story-2").multiplier, 1);
});

// ============================================================
// COMBINED
// ============================================================

test("computePenalties multiplies every applicable penalty", () => {
  const profile = makeProfile({
    readStories: [["story-1", read({ ageDays: 0, completed: true })]],
    feedback: [["story-1", { feedback: "DISLIKE", createdAtMs: NOW }]],
    bookmarks: ["story-1"]
  });

  const result = computePenalties(profile, story("story-1"));

  // 0.09 (completed read) * 0.1 (dislike) * 0.5 (bookmarked)
  assert.equal(round(result.multiplier, 6), 0.0045);

  assert.deepEqual(result.applied, [
    "alreadyRead",
    "disliked",
    "alreadyBookmarked"
  ]);
});

test("computePenalties is neutral for a fresh, untouched story", () => {
  const result = computePenalties(makeProfile(), story("story-new"));

  assert.equal(result.multiplier, 1);
  assert.deepEqual(result.applied, []);
});

test("computePenalties exposes each component for explainability", () => {
  const profile = makeProfile({
    skips: [["story-1", { createdAtMs: daysAgoMs(3.5) }]],
    readClusters: [
      ["cluster-1", { count: 1, storyIds: new Set(["story-other"]) }]
    ]
  });

  const result = computePenalties(profile, story("story-1", "cluster-1"));

  assert.equal(round(result.skip.multiplier), 0.6);
  assert.equal(result.clusterSeen.multiplier, 0.45);
  assert.equal(result.alreadyRead.applied, false);

  // 0.6 * 0.45
  assert.equal(round(result.multiplier), 0.27);
  assert.deepEqual(result.applied, ["clusterAlreadySeen", "skipped"]);
});

test("a heavily penalised story is suppressed but never negative", () => {
  const profile = makeProfile({
    readStories: [["story-1", read({ completed: true, count: 5 })]],
    skips: [["story-1", { createdAtMs: NOW }]],
    feedback: [["story-1", { feedback: "DISLIKE", createdAtMs: NOW }]],
    bookmarks: ["story-1"],
    readClusters: [
      ["cluster-1", { count: 2, storyIds: new Set(["story-other"]) }]
    ]
  });

  const result = computePenalties(profile, story("story-1", "cluster-1"));

  assert.ok(result.multiplier > 0);
  assert.ok(result.multiplier < 0.001);
  assert.equal(result.applied.length, 5);
});
