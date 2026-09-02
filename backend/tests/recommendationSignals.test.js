const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildUserProfile,
  emptyProfile,
  classifyRead,
  extractTopicIds
} = require("../recommendation/signals");

const { round, MS_PER_DAY } = require("../recommendation/normalize");

// ------------------------------------------------------------
// FIXTURES
//
// A fixed clock keeps every decay assertion deterministic.
// ------------------------------------------------------------

const NOW = new Date("2026-09-01T12:00:00Z").getTime();

const daysAgo = (days) => new Date(NOW - days * MS_PER_DAY);

const story = ({
  id,
  sourceId = "source-1",
  clusterId = null,
  topicIds = []
}) => ({
  id,
  sourceId,
  clusterId,
  storyTopics: topicIds.map((topicId) => ({
    topicId,
    topic: { id: topicId }
  }))
});

// ============================================================
// READ CLASSIFICATION
// ============================================================

test("classifyRead distinguishes completed, long, short and neutral reads", () => {
  assert.equal(
    classifyRead({ completed: true, durationSeconds: 1 }).value,
    2.0
  );

  assert.equal(
    classifyRead({ completed: false, durationSeconds: 45 }).value,
    1.0
  );

  // A sub-10-second read is a bounce and counts against the topic.
  assert.equal(
    classifyRead({ completed: false, durationSeconds: 4 }).value,
    -0.3
  );

  // Between the two thresholds we have no useful opinion.
  assert.equal(classifyRead({ completed: false, durationSeconds: 15 }), null);
});

test("extractTopicIds tolerates missing and malformed topic data", () => {
  assert.deepEqual(
    extractTopicIds(story({ id: "a", topicIds: ["t1", "t2"] })),
    ["t1", "t2"]
  );

  assert.deepEqual(extractTopicIds(null), []);
  assert.deepEqual(extractTopicIds({ id: "a" }), []);
  assert.deepEqual(extractTopicIds({ storyTopics: [{}] }), []);
});

// ============================================================
// EXPLICIT PREFERENCES
// ============================================================

test("explicit preferences are read verbatim, not mutated", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    topicPreferences: [
      { topicId: "topic-ai", preference: 5 },
      { topicId: "topic-sports", preference: -3 }
    ],
    sourcePreferences: [{ sourceId: "source-trusted", preference: 4 }]
  });

  assert.equal(profile.explicitTopic.get("topic-ai"), 5);
  assert.equal(profile.explicitTopic.get("topic-sports"), -3);
  assert.equal(profile.explicitSource.get("source-trusted"), 4);

  assert.equal(profile.hasExplicitPreferences, true);

  // Explicit preferences alone are not behavioural evidence, so the
  // user is still treated as cold start.
  assert.equal(profile.isColdStart, true);
  assert.equal(profile.signalCount, 0);
});

// ============================================================
// READING SIGNALS
// ============================================================

test("a completed read generalizes to the story's topic and source", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "story-1",
        openedAt: daysAgo(0),
        durationSeconds: 300,
        completed: true,
        story: story({
          id: "story-1",
          sourceId: "source-1",
          topicIds: ["topic-ai"]
        })
      }
    ]
  });

  // Fresh completed read: full 2.0, no decay.
  assert.equal(round(profile.behavioralTopic.get("topic-ai")), 2);
  assert.equal(round(profile.behavioralSource.get("source-1")), 2);

  // 300s saturates to 0.5, plus the 0.2 baseline => 0.7 intensity.
  assert.equal(round(profile.readingTopic.get("topic-ai")), 1.4);

  assert.equal(profile.signalCount, 1);
  assert.equal(profile.isColdStart, false);
});

test("reading signal is split across a story's topics", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "story-1",
        openedAt: daysAgo(0),
        durationSeconds: 300,
        completed: true,
        story: story({
          id: "story-1",
          topicIds: ["topic-ai", "topic-business"]
        })
      }
    ]
  });

  // A 2-topic story must not deliver double the affinity of a
  // 1-topic story.
  assert.equal(round(profile.behavioralTopic.get("topic-ai")), 1);
  assert.equal(round(profile.behavioralTopic.get("topic-business")), 1);

  // The source, however, gets the full amount.
  assert.equal(round(profile.behavioralSource.get("source-1")), 2);
});

test("older reads contribute less than recent ones", () => {
  const build = (ageDays) =>
    buildUserProfile({
      nowMs: NOW,
      readingHistory: [
        {
          storyId: "story-1",
          openedAt: daysAgo(ageDays),
          durationSeconds: 300,
          completed: true,
          story: story({ id: "story-1", topicIds: ["topic-ai"] })
        }
      ]
    }).behavioralTopic.get("topic-ai");

  assert.equal(round(build(0)), 2);

  // One half-life (14 days) later, worth exactly half.
  assert.equal(round(build(14)), 1);
  assert.equal(round(build(28)), 0.5);
});

test("a bounce read produces negative topic affinity", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "story-1",
        openedAt: daysAgo(0),
        durationSeconds: 3,
        completed: false,
        story: story({ id: "story-1", topicIds: ["topic-sports"] })
      }
    ]
  });

  assert.equal(round(profile.behavioralTopic.get("topic-sports")), -0.3);

  // A bounce is not evidence of interest, so it must not count
  // toward escaping cold start.
  assert.equal(profile.signalCount, 0);

  // And it must not register as positive reading interest.
  assert.equal(profile.readingTopic.get("topic-sports"), undefined);
});

test("every read is tracked per story even when affinity is neutral", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "story-1",
        openedAt: daysAgo(1),
        durationSeconds: 15,
        completed: false,
        story: story({ id: "story-1", clusterId: "cluster-1" })
      }
    ]
  });

  // 15s falls between the thresholds so it yields no affinity...
  assert.equal(profile.behavioralTopic.size, 0);

  // ...but the already-read penalty still needs to know about it.
  assert.equal(profile.readStories.get("story-1").count, 1);
  assert.equal(profile.readClusters.get("cluster-1").count, 1);
});

test("repeat reads keep the most recent timestamp", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "story-1",
        openedAt: daysAgo(10),
        durationSeconds: 40,
        completed: false,
        story: story({ id: "story-1" })
      },
      {
        storyId: "story-1",
        openedAt: daysAgo(2),
        durationSeconds: 60,
        completed: true,
        story: story({ id: "story-1" })
      }
    ]
  });

  const read = profile.readStories.get("story-1");

  assert.equal(read.count, 2);
  assert.equal(read.completed, true);
  assert.equal(read.totalDurationSeconds, 100);

  // The penalty must recover from the LATEST read, not the first.
  assert.equal(read.lastReadAtMs, daysAgo(2).getTime());
});

test("reads with unusable timestamps still register", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "story-1",
        openedAt: null,
        durationSeconds: 300,
        completed: true,
        story: story({ id: "story-1", topicIds: ["topic-ai"] })
      }
    ]
  });

  // Missing timestamp is treated as undecayed rather than dropped.
  assert.equal(round(profile.behavioralTopic.get("topic-ai")), 2);
  assert.equal(profile.readStories.get("story-1").lastReadAtMs, null);
});

// ============================================================
// FEEDBACK
// ============================================================

test("like and dislike push topic affinity in opposite directions", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    feedback: [
      {
        storyId: "liked",
        feedback: "LIKE",
        createdAt: daysAgo(0),
        story: story({ id: "liked", topicIds: ["topic-ai"] })
      },
      {
        storyId: "disliked",
        feedback: "DISLIKE",
        createdAt: daysAgo(0),
        story: story({
          id: "disliked",
          sourceId: "source-tabloid",
          topicIds: ["topic-gossip"]
        })
      }
    ]
  });

  assert.equal(round(profile.behavioralTopic.get("topic-ai")), 2.5);
  assert.equal(round(profile.behavioralTopic.get("topic-gossip")), -3);
  assert.equal(round(profile.behavioralSource.get("source-tabloid")), -3);

  // The like feeds its own dedicated accumulator; the dislike does
  // not pollute it.
  assert.equal(round(profile.likeTopic.get("topic-ai")), 2.5);
  assert.equal(profile.likeTopic.get("topic-gossip"), undefined);

  // Per-story lookups are available for the scorer's penalties.
  assert.equal(profile.feedbackByStory.get("disliked").feedback, "DISLIKE");

  // Only the like counts as a positive signal.
  assert.equal(profile.signalCount, 1);
});

test("dislike is remembered far longer than a skip", () => {
  const after30Days = (entries) =>
    buildUserProfile({ nowMs: NOW, ...entries });

  const dislike = after30Days({
    feedback: [
      {
        storyId: "s1",
        feedback: "DISLIKE",
        createdAt: daysAgo(30),
        story: story({ id: "s1", topicIds: ["topic-x"] })
      }
    ]
  }).behavioralTopic.get("topic-x");

  const skip = after30Days({
    skips: [
      {
        storyId: "s2",
        createdAt: daysAgo(30),
        story: story({ id: "s2", topicIds: ["topic-y"] })
      }
    ]
  }).behavioralTopic.get("topic-y");

  // Dislike keeps ~70% of its strength after a month.
  assert.ok(Math.abs(dislike) > 2);

  // A month-old skip has almost entirely faded, which is the whole
  // point of the skip/dislike distinction.
  assert.ok(Math.abs(skip) < 0.06);
});

test("unknown feedback values are ignored safely", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    feedback: [
      {
        storyId: "s1",
        feedback: "SHRUG",
        createdAt: daysAgo(0),
        story: story({ id: "s1", topicIds: ["topic-ai"] })
      }
    ]
  });

  assert.equal(profile.behavioralTopic.size, 0);

  // The row is still recorded so nothing silently disappears.
  assert.equal(profile.feedbackByStory.get("s1").feedback, "SHRUG");
});

// ============================================================
// BOOKMARKS
// ============================================================

test("bookmark is the strongest positive signal", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    bookmarks: [
      {
        storyId: "saved",
        createdAt: daysAgo(0),
        story: story({ id: "saved", topicIds: ["topic-ai"] })
      }
    ]
  });

  // 3.0 beats a like (2.5) and a completed read (2.0).
  assert.equal(round(profile.behavioralTopic.get("topic-ai")), 3);
  assert.equal(round(profile.bookmarkTopic.get("topic-ai")), 3);

  assert.equal(profile.bookmarkedStories.has("saved"), true);
  assert.equal(profile.signalCount, 1);
});

// ============================================================
// COLD START
// ============================================================

test("signal strength ramps up to full personalization", () => {
  const withReads = (count) =>
    buildUserProfile({
      nowMs: NOW,
      readingHistory: Array.from({ length: count }, (_, index) => ({
        storyId: `story-${index}`,
        openedAt: daysAgo(0),
        durationSeconds: 300,
        completed: true,
        story: story({ id: `story-${index}`, topicIds: ["topic-ai"] })
      }))
    });

  assert.equal(withReads(0).signalStrength, 0);
  assert.equal(withReads(0).isColdStart, true);

  assert.equal(withReads(1).signalStrength, 0.2);
  assert.equal(withReads(3).signalStrength, 0.6);

  // Caps at 1 so a power user is not weighted differently from a
  // merely established one.
  assert.equal(withReads(5).signalStrength, 1);
  assert.equal(withReads(50).signalStrength, 1);
});

test("emptyProfile is a usable zero profile", () => {
  const profile = emptyProfile(NOW);

  assert.equal(profile.nowMs, NOW);
  assert.equal(profile.signalCount, 0);
  assert.equal(profile.isColdStart, true);
  assert.equal(profile.hasExplicitPreferences, false);
  assert.equal(profile.explicitTopic.size, 0);
  assert.equal(profile.readStories.size, 0);
});

test("signals missing their story row do not throw", () => {
  const profile = buildUserProfile({
    nowMs: NOW,
    readingHistory: [
      {
        storyId: "orphan",
        openedAt: daysAgo(0),
        durationSeconds: 300,
        completed: true,
        story: null
      }
    ],
    feedback: [{ storyId: "orphan-2", feedback: "LIKE", createdAt: daysAgo(0) }],
    skips: [{ storyId: "orphan-3", createdAt: daysAgo(0) }],
    bookmarks: [{ storyId: "orphan-4", createdAt: daysAgo(0) }]
  });

  // No affinity can be attributed without a story, but the per-story
  // lookups still work and nothing crashes.
  assert.equal(profile.behavioralTopic.size, 0);
  assert.equal(profile.behavioralSource.size, 0);
  assert.equal(profile.readStories.has("orphan"), true);
  assert.equal(profile.feedbackByStory.has("orphan-2"), true);
  assert.equal(profile.skipByStory.has("orphan-3"), true);
  assert.equal(profile.bookmarkedStories.has("orphan-4"), true);
});
