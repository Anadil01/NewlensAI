const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeExplicit,
  normalizeBehavioral,
  blend,
  topicAffinity,
  storyTopicAffinity,
  sourceAffinity,
  positiveSignal,
  readingInterest,
  likeSignal,
  bookmarkSignal
} = require("../recommendation/affinity");

const { round } = require("../recommendation/normalize");

// ------------------------------------------------------------
// FIXTURES
//
// Affinity is a pure function of a profile object, so these tests
// build minimal profiles directly instead of going through
// `buildUserProfile`. That keeps each assertion about the affinity
// maths alone.
// ------------------------------------------------------------

const makeProfile = ({
  explicitTopic = {},
  explicitSource = {},
  behavioralTopic = {},
  behavioralSource = {},
  readingTopic = {},
  readingSource = {},
  likeTopic = {},
  likeSource = {},
  bookmarkTopic = {},
  bookmarkSource = {},
  signalStrength = 1
} = {}) => ({
  explicitTopic: new Map(Object.entries(explicitTopic)),
  explicitSource: new Map(Object.entries(explicitSource)),
  behavioralTopic: new Map(Object.entries(behavioralTopic)),
  behavioralSource: new Map(Object.entries(behavioralSource)),
  readingTopic: new Map(Object.entries(readingTopic)),
  readingSource: new Map(Object.entries(readingSource)),
  likeTopic: new Map(Object.entries(likeTopic)),
  likeSource: new Map(Object.entries(likeSource)),
  bookmarkTopic: new Map(Object.entries(bookmarkTopic)),
  bookmarkSource: new Map(Object.entries(bookmarkSource)),
  signalStrength
});

// ============================================================
// COMPONENT NORMALIZATION
// ============================================================

test("normalizeExplicit maps the -5..+5 preference scale onto -1..+1", () => {
  assert.equal(normalizeExplicit(5), 1);
  assert.equal(normalizeExplicit(-5), -1);
  assert.equal(normalizeExplicit(0), 0);
  assert.equal(normalizeExplicit(-3), -0.6);

  // Out-of-range data from a bad migration cannot break the scale.
  assert.equal(normalizeExplicit(50), 1);
  assert.equal(normalizeExplicit(undefined), 0);
});

test("normalizeBehavioral squashes unbounded totals into -1..+1", () => {
  assert.equal(normalizeBehavioral(0), 0);

  // At the saturation point (6) we reach tanh(1).
  assert.equal(round(normalizeBehavioral(6)), 0.7616);

  assert.equal(round(normalizeBehavioral(-6)), -0.7616);

  // A power user with 10x the evidence does not get 10x the affinity.
  assert.ok(normalizeBehavioral(60) < 1);
  assert.ok(normalizeBehavioral(60) - normalizeBehavioral(6) < 0.24);
});

// ============================================================
// BLENDING
// ============================================================

test("blend weights explicit preference at 60% when one exists", () => {
  assert.equal(
    round(blend({ explicit: 1, behavioral: 0, hasExplicit: true })),
    0.6
  );

  assert.equal(
    round(blend({ explicit: 1, behavioral: 1, hasExplicit: true })),
    1
  );

  assert.equal(
    round(blend({ explicit: -1, behavioral: 0, hasExplicit: true })),
    -0.6
  );
});

test("blend gives behaviour full weight when there is no explicit preference", () => {
  // Without this, a strong behavioural signal on an unrated topic
  // would be diluted to 40% and lose to a weakly-rated topic.
  assert.equal(
    round(blend({ explicit: 0, behavioral: 0.8, hasExplicit: false })),
    0.8
  );
});

test("blend scales behaviour down for users with little history", () => {
  const cold = blend({
    explicit: 0,
    behavioral: 1,
    hasExplicit: false,
    signalStrength: 0
  });

  const warming = blend({
    explicit: 0,
    behavioral: 1,
    hasExplicit: false,
    signalStrength: 0.4
  });

  const established = blend({
    explicit: 0,
    behavioral: 1,
    hasExplicit: false,
    signalStrength: 1
  });

  assert.equal(cold, 0);
  assert.equal(round(warming), 0.4);
  assert.equal(established, 1);
});

test("blend never escapes -1..+1", () => {
  assert.equal(blend({ explicit: 1, behavioral: 5, hasExplicit: true }), 1);
  assert.equal(blend({ explicit: -1, behavioral: -5, hasExplicit: true }), -1);
});

// ============================================================
// TOPIC AFFINITY
// ============================================================

test("topicAffinity reports its components for explainability", () => {
  const profile = makeProfile({
    explicitTopic: { "topic-ai": 5 },
    behavioralTopic: { "topic-ai": 6 }
  });

  const result = topicAffinity(profile, "topic-ai");

  assert.equal(result.hasExplicit, true);
  assert.equal(result.explicit, 1);
  assert.equal(round(result.behavioral), 0.7616);

  // 0.6 * 1 + 0.4 * 0.7616
  assert.equal(round(result.value), 0.9046);
});

test("topicAffinity is zero for a topic the user has never touched", () => {
  const profile = makeProfile();

  const result = topicAffinity(profile, "topic-unknown");

  assert.equal(result.value, 0);
  assert.equal(result.hasExplicit, false);
});

test("explicit dislike and behavioural interest partially cancel", () => {
  // The user said they dislike sports, but keeps reading sports.
  // Their stated preference should still dominate, without the
  // behaviour being ignored entirely.
  const profile = makeProfile({
    explicitTopic: { "topic-sports": -5 },
    behavioralTopic: { "topic-sports": 6 }
  });

  const result = topicAffinity(profile, "topic-sports");

  // 0.6 * -1 + 0.4 * 0.7616 = -0.2954
  assert.equal(round(result.value), -0.2954);
  assert.ok(result.value < 0);
});

// ============================================================
// STORY-LEVEL TOPIC AFFINITY
// ============================================================

test("storyTopicAffinity favours the strongest topic but respects the rest", () => {
  const profile = makeProfile({
    explicitTopic: { "topic-loved": 5, "topic-neutral": 0 },
    signalStrength: 0
  });

  // topic-loved => 0.6, topic-neutral => 0
  const result = storyTopicAffinity(profile, [
    "topic-loved",
    "topic-neutral"
  ]);

  // extreme 0.6, mean 0.3 => 0.7 * 0.6 + 0.3 * 0.3
  assert.equal(round(result.value), 0.51);

  // A story about ONLY the loved topic must still rank higher.
  const focused = storyTopicAffinity(profile, ["topic-loved"]);

  assert.equal(round(focused.value), 0.6);
  assert.ok(focused.value > result.value);
});

test("one strongly disliked topic sinks an otherwise neutral story", () => {
  const profile = makeProfile({
    explicitTopic: { "topic-hated": -5, "topic-neutral": 0 },
    signalStrength: 0
  });

  const result = storyTopicAffinity(profile, [
    "topic-hated",
    "topic-neutral"
  ]);

  // The most negative topic drives the result rather than being
  // averaged away by neutral tags.
  assert.equal(round(result.value), -0.51);
});

test("storyTopicAffinity handles stories with no topics", () => {
  const profile = makeProfile({ explicitTopic: { "topic-ai": 5 } });

  assert.equal(storyTopicAffinity(profile, []).value, 0);
  assert.equal(storyTopicAffinity(profile, null).value, 0);
  assert.deepEqual(storyTopicAffinity(profile, []).topics, []);
});

test("storyTopicAffinity exposes per-topic detail", () => {
  const profile = makeProfile({
    explicitTopic: { "topic-ai": 5 },
    signalStrength: 0
  });

  const result = storyTopicAffinity(profile, ["topic-ai", "topic-other"]);

  assert.equal(result.topics.length, 2);
  assert.equal(result.topics[0].topicId, "topic-ai");
  assert.equal(result.topics[0].hasExplicit, true);
  assert.equal(result.topics[1].hasExplicit, false);
});

// ============================================================
// SOURCE AFFINITY
// ============================================================

test("sourceAffinity mirrors topic affinity behaviour", () => {
  const profile = makeProfile({
    explicitSource: { "source-trusted": 5 },
    behavioralSource: { "source-learned": 6 }
  });

  assert.equal(
    round(sourceAffinity(profile, "source-trusted").value),
    0.6
  );

  // Learned purely from behaviour, so it gets the full weight.
  assert.equal(
    round(sourceAffinity(profile, "source-learned").value),
    0.7616
  );

  assert.equal(sourceAffinity(profile, "source-unknown").value, 0);
});

// ============================================================
// SECONDARY POSITIVE SIGNALS
// ============================================================

test("positiveSignal averages across topics and adds source support", () => {
  const topicOnly = positiveSignal({
    topicMap: new Map([["t1", 6]]),
    sourceMap: new Map(),
    topicIds: ["t1"],
    sourceId: "s1",
    saturation: 6
  });

  assert.equal(round(topicOnly), 0.7616);

  const withSource = positiveSignal({
    topicMap: new Map([["t1", 6]]),
    sourceMap: new Map([["s1", 6]]),
    topicIds: ["t1"],
    sourceId: "s1",
    saturation: 6
  });

  // Source contributes at half weight: (6 + 3) / 6 => tanh(1.5)
  assert.equal(round(withSource), 0.9051);
  assert.ok(withSource > topicOnly);
});

test("positiveSignal never returns a negative value", () => {
  // Negative accumulator entries are handled by the penalty layer,
  // not here, so this term must not go below zero and silently
  // subtract from the score twice.
  const result = positiveSignal({
    topicMap: new Map([["t1", -10]]),
    sourceMap: new Map([["s1", -10]]),
    topicIds: ["t1"],
    sourceId: "s1",
    saturation: 6
  });

  assert.equal(result, 0);
});

test("positiveSignal is zero with no evidence", () => {
  assert.equal(
    positiveSignal({
      topicMap: new Map(),
      sourceMap: new Map(),
      topicIds: ["t1"],
      sourceId: "s1",
      saturation: 6
    }),
    0
  );
});

test("reading, like and bookmark signals read their own accumulators", () => {
  const profile = makeProfile({
    readingTopic: { "topic-ai": 6 },
    likeTopic: { "topic-ai": 3 },
    bookmarkTopic: { "topic-ai": 12 }
  });

  const topics = ["topic-ai"];

  assert.equal(round(readingInterest(profile, topics, "s1")), 0.7616);
  assert.equal(round(likeSignal(profile, topics, "s1")), 0.4621);
  assert.equal(round(bookmarkSignal(profile, topics, "s1")), 0.964);

  // Each term is independent: no cross-contamination between them.
  const readingOnly = makeProfile({ readingTopic: { "topic-ai": 6 } });

  assert.equal(likeSignal(readingOnly, topics, "s1"), 0);
  assert.equal(bookmarkSignal(readingOnly, topics, "s1"), 0);
});
