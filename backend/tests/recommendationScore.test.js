const test = require("node:test");
const assert = require("node:assert/strict");

const {
  prepareStory,
  prepareCandidates,
  resolveWeights,
  scoreStory,
  rankStories
} = require("../recommendation/score");

const { buildUserProfile, emptyProfile } = require("../recommendation/signals");

const { SCORE_WEIGHTS, COLD_START } = require("../recommendation/weights");

// ------------------------------------------------------------
// FIXTURES
//
// A fixed clock keeps freshness deterministic; the engine never
// reads the real clock.
// ------------------------------------------------------------

const NOW = Date.UTC(2026, 0, 10, 12, 0, 0);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const hoursAgo = (hours) => new Date(NOW - hours * HOUR);

const story = ({
  id,
  sourceId = "src-1",
  clusterId = null,
  points = null,
  hours = 2,
  topicIds = []
} = {}) => ({
  id,
  sourceId,
  clusterId,
  points,
  publishedAt: hoursAgo(hours),
  storyTopics: topicIds.map((topicId) => ({ topicId }))
});

const idsOf = (result) => result.items.map((entry) => entry.story.id);

const scoreOf = (result, id) =>
  result.items.find((entry) => entry.story.id === id)?.score;

// ============================================================
// PREPARE
// ============================================================

test("prepareStory flattens the Prisma storyTopics shape", () => {
  const prepared = prepareStory(
    story({ id: "a", topicIds: ["t1", "t2"] })
  );

  assert.deepEqual(prepared.topicIds, ["t1", "t2"]);

  // The original fields survive: the ranked payload is the story.
  assert.equal(prepared.id, "a");
  assert.equal(prepared.sourceId, "src-1");

  assert.deepEqual(prepareStory({ id: "b" }).topicIds, []);
  assert.equal(prepareCandidates([]).length, 0);
});

// ============================================================
// WEIGHT REALLOCATION
// ============================================================

test("unknown popularity hands its weight to freshness", () => {
  const known = resolveWeights({ popularity: { known: true } });

  assert.equal(known.popularity, SCORE_WEIGHTS.popularity);
  assert.equal(known.freshness, SCORE_WEIGHTS.freshness);

  const unknown = resolveWeights({ popularity: { known: false } });

  // Most RSS stories have null points. Scoring them against a hard 0
  // would permanently handicap them versus aggregator stories.
  assert.equal(unknown.popularity, 0);
  assert.equal(
    unknown.freshness,
    SCORE_WEIGHTS.freshness + SCORE_WEIGHTS.popularity
  );

  // Total available weight is unchanged, so scores stay comparable
  // across stories with and without a points value.
  const total = (weights) =>
    Object.values(weights).reduce((sum, value) => sum + value, 0);

  assert.equal(total(unknown), total(known));
});

test("an RSS story is not out-ranked by a low-point story of equal age", () => {
  const profile = emptyProfile(NOW);

  const rss = scoreStory(profile, prepareStory(story({ id: "rss", hours: 2 })));

  const weak = scoreStory(
    profile,
    prepareStory(story({ id: "weak", hours: 2, points: 1 }))
  );

  assert.ok(rss.score > weak.score);
  assert.equal(rss.breakdown.popularityKnown, false);
  assert.equal(weak.breakdown.popularityKnown, true);
});

// ============================================================
// SIGN SAFETY
// ============================================================

test("a strongly disliked story floors at zero instead of going negative", () => {
  // Negative affinity multiplied by a penalty would INCREASE rank,
  // which is why the positive sum is floored before penalties apply.
  const profile = buildUserProfile({
    nowMs: NOW,
    topicPreferences: [{ topicId: "t1", preference: -5 }],
    sourcePreferences: [{ sourceId: "src-1", preference: -5 }]
  });

  // Old enough that freshness contributes nothing either.
  const target = prepareStory(
    story({ id: "a", hours: 24 * 30, topicIds: ["t1"] })
  );

  const result = scoreStory(profile, target);

  assert.equal(result.score, 0);
  assert.equal(result.breakdown.base, 0);
  assert.ok(result.breakdown.topicAffinity < 0);
});

test("penalties scale the score down but never below zero", () => {
  const target = story({ id: "a", topicIds: ["t1"] });

  const clean = scoreStory(emptyProfile(NOW), prepareStory(target));

  const disliked = scoreStory(
    buildUserProfile({
      nowMs: NOW,
      feedback: [
        {
          storyId: "a",
          feedback: "DISLIKE",
          createdAt: new Date(NOW - HOUR),
          story: target
        }
      ]
    }),
    prepareStory(target)
  );

  assert.ok(disliked.score >= 0);
  assert.ok(disliked.score < clean.score);
  assert.ok(disliked.breakdown.penaltiesApplied.includes("disliked"));
  assert.ok(disliked.breakdown.penaltyMultiplier < 1);
});

// ============================================================
// THE INVERTED-READ REGRESSION
// ============================================================

test("reading a story suppresses that story but promotes its topic", () => {
  // The original bug: opening a story made the SAME story rank higher.
  const read = story({ id: "read", sourceId: "src-1", topicIds: ["t1"] });
  const sibling = story({ id: "sibling", sourceId: "src-1", topicIds: ["t1"] });
  const unrelated = story({ id: "other", sourceId: "src-2", topicIds: ["t9"] });

  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "read",
        openedAt: new Date(NOW - 2 * HOUR),
        durationSeconds: 300,
        completed: true,
        story: read
      }
    ]
  });

  const readScore = scoreStory(profile, prepareStory(read)).score;
  const siblingScore = scoreStory(profile, prepareStory(sibling)).score;
  const unrelatedScore = scoreStory(profile, prepareStory(unrelated)).score;

  // The story you already consumed drops below its unread sibling...
  assert.ok(readScore < siblingScore);

  // ...while the interest it revealed lifts other stories on the topic.
  assert.ok(siblingScore > unrelatedScore);
});

test("the already-read penalty recovers as the read ages", () => {
  const target = story({ id: "a", topicIds: ["t1"] });

  const readDaysAgo = (days) =>
    scoreStory(
      buildUserProfile({
        nowMs: NOW,
        readingHistory: [
          {
            storyId: "a",
            openedAt: new Date(NOW - days * DAY),
            durationSeconds: 300,
            completed: true,
            story: target
          }
        ]
      }),
      prepareStory(target)
    ).breakdown.penaltyMultiplier;

  // Suppression is strongest immediately after reading and eases off,
  // so a long-running story can eventually resurface.
  assert.ok(readDaysAgo(0) < readDaysAgo(3));
  assert.ok(readDaysAgo(3) < readDaysAgo(30));
});

// ============================================================
// RANKING
// ============================================================

test("rankStories orders by score and reports pipeline metadata", () => {
  const result = rankStories(
    emptyProfile(NOW),
    [
      story({ id: "stale", sourceId: "s1", hours: 200 }),
      story({ id: "fresh", sourceId: "s2", hours: 1 }),
      story({ id: "mid", sourceId: "s3", hours: 20 })
    ],
    { limit: 3 }
  );

  assert.deepEqual(idsOf(result), ["fresh", "mid", "stale"]);

  assert.equal(result.meta.candidateCount, 3);
  assert.equal(result.meta.returnedCount, 3);
  assert.equal(result.meta.personalized, false);
  assert.equal(result.meta.coldStart, true);
});

test("cold start leans on freshness and popularity, not personalization", () => {
  const result = rankStories(
    emptyProfile(NOW),
    [
      story({ id: "popular", sourceId: "s1", hours: 3, points: 900 }),
      story({ id: "quiet", sourceId: "s2", hours: 3, points: 0 })
    ],
    { limit: 2 }
  );

  assert.deepEqual(idsOf(result), ["popular", "quiet"]);

  // A brand-new user gets a coherent feed with zero signals.
  assert.equal(result.meta.signalCount, 0);
  assert.equal(result.meta.signalStrength, 0);
  assert.ok(scoreOf(result, "popular") > 0);
});

test("explicit preferences count as personalization before any behaviour", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    topicPreferences: [{ topicId: "t1", preference: 5 }]
  });

  const result = rankStories(
    profile,
    [
      story({ id: "chosen", sourceId: "s1", hours: 5, topicIds: ["t1"] }),
      story({ id: "ignored", sourceId: "s2", hours: 5, topicIds: ["t2"] })
    ],
    { limit: 2 }
  );

  assert.deepEqual(idsOf(result), ["chosen", "ignored"]);

  // Onboarding selections personalize the feed immediately, even
  // though there is still no reading history to learn from.
  assert.equal(result.meta.personalized, true);
  assert.equal(result.meta.signalCount, 0);
  assert.equal(result.meta.coldStart, true);
});

test("signalStrength saturates once the user has enough history", () => {
  const target = story({ id: "x", topicIds: ["t1"] });

  const withReads = (count) =>
    rankStories(
      buildUserProfile({
        nowMs: NOW,
        readingHistory: Array.from({ length: count }, (_, i) => ({
          storyId: `r${i}`,
          openedAt: new Date(NOW - HOUR),
          durationSeconds: 300,
          completed: true,
          story: story({ id: `r${i}`, topicIds: ["t1"] })
        }))
      }),
      [target],
      { limit: 1 }
    ).meta;

  assert.equal(withReads(1).coldStart, true);

  const warm = withReads(COLD_START.fullSignalCount + 3);

  assert.equal(warm.coldStart, false);
  assert.equal(warm.signalStrength, 1);
});

test("rankStories applies the cluster cap to the final feed", () => {
  const result = rankStories(
    emptyProfile(NOW),
    [
      story({ id: "c1-a", sourceId: "s1", clusterId: "c1", hours: 1 }),
      story({ id: "c1-b", sourceId: "s2", clusterId: "c1", hours: 2 }),
      story({ id: "c1-c", sourceId: "s3", clusterId: "c1", hours: 3 }),
      story({ id: "c2-a", sourceId: "s4", clusterId: "c2", hours: 40 })
    ],
    { limit: 4 }
  );

  // Third account of the same event is dropped, and the older story
  // about a different event takes the slot.
  assert.deepEqual(idsOf(result), ["c1-a", "c1-b", "c2-a"]);
  assert.equal(result.meta.clusterCount, 2);
});

test("ranking is deterministic when scores tie", () => {
  // Identical stories differing only by id: without a stable
  // tiebreaker the order could shift between paginated requests.
  const candidates = [
    story({ id: "b", sourceId: "s2", hours: 4 }),
    story({ id: "c", sourceId: "s3", hours: 4 }),
    story({ id: "a", sourceId: "s1", hours: 4 })
  ];

  const first = rankStories(emptyProfile(NOW), candidates, { limit: 3 });
  const second = rankStories(emptyProfile(NOW), [...candidates].reverse(), {
    limit: 3
  });

  assert.deepEqual(idsOf(first), ["a", "b", "c"]);
  assert.deepEqual(idsOf(second), idsOf(first));
});

test("rankStories honours the limit and handles an empty candidate set", () => {
  const candidates = [
    story({ id: "a", sourceId: "s1", hours: 1 }),
    story({ id: "b", sourceId: "s2", hours: 2 }),
    story({ id: "c", sourceId: "s3", hours: 3 })
  ];

  const limited = rankStories(emptyProfile(NOW), candidates, { limit: 2 });

  assert.equal(limited.items.length, 2);
  assert.equal(limited.meta.candidateCount, 3);
  assert.equal(limited.meta.returnedCount, 2);

  const empty = rankStories(emptyProfile(NOW), [], { limit: 10 });

  assert.deepEqual(empty.items, []);
  assert.equal(empty.meta.returnedCount, 0);
});

test("every ranked item carries a full explainability breakdown", () => {
  const result = rankStories(
    emptyProfile(NOW),
    [story({ id: "a", clusterId: "c1", hours: 2, points: 50, topicIds: ["t1"] })],
    { limit: 1 }
  );

  const entry = result.items[0];

  for (const key of [
    "base",
    "score",
    "topicAffinity",
    "sourceAffinity",
    "readingInterest",
    "likeSignal",
    "bookmarkSignal",
    "freshness",
    "popularity",
    "clusterImportance",
    "penaltyMultiplier",
    "penaltiesApplied"
  ]) {
    assert.ok(key in entry.breakdown, `breakdown missing ${key}`);
  }

  assert.equal(entry.position, 0);
  assert.equal(typeof entry.diversity.multiplier, "number");
});
