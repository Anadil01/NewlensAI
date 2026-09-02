// ============================================================
// USER SIGNAL PROFILE
// ============================================================
//
// Turns raw persistence rows into a single in-memory profile that
// the scorer can consult in O(1) per story.
//
// This module is PURE: it performs no database access and reads no
// clock. `nowMs` is always injected so ranking is deterministic and
// testable.
//
// Two distinct kinds of output are produced:
//
//   1. AFFINITY accumulators (topic/source level)
//      "this user tends to like AI stories"
//
//   2. PER-STORY interaction lookups
//      "this user already read THIS story"
//
// The old implementation conflated the two, which is why reading a
// story used to make that same story rank higher.
// ============================================================

const {
  BEHAVIOR_SIGNALS,
  READING,
  COLD_START
} = require("./weights");

const {
  toTimestamp,
  daysBetween,
  decayByHalfLife,
  clamp01,
  saturate
} = require("./normalize");

// ------------------------------------------------------------
// ACCUMULATOR HELPERS
// ------------------------------------------------------------

const addTo = (map, key, amount) => {
  if (!key || !amount) {
    return;
  }

  map.set(key, (map.get(key) || 0) + amount);
};

/**
 * Spreads a signal across every topic on a story plus its source.
 *
 * A story with 4 topics should not deliver 4x the affinity of a
 * story with 1 topic, so the per-topic amount is divided by the
 * topic count.
 */
const spreadSignal = ({
  story,
  amount,
  topicMap,
  sourceMap
}) => {
  if (!story || !amount) {
    return;
  }

  const topicIds = extractTopicIds(story);

  if (topicIds.length) {
    const perTopic = amount / topicIds.length;

    for (const topicId of topicIds) {
      addTo(topicMap, topicId, perTopic);
    }
  }

  addTo(sourceMap, story.sourceId, amount);
};

const extractTopicIds = (story) => {
  if (!story || !Array.isArray(story.storyTopics)) {
    return [];
  }

  return story.storyTopics
    .map((entry) => entry.topicId || entry.topic?.id)
    .filter(Boolean);
};

// ------------------------------------------------------------
// READING CLASSIFICATION
// ------------------------------------------------------------

/**
 * Classifies a single reading-history row into a behavioural signal.
 *
 * A completed read is the strongest evidence of interest. An
 * incomplete-but-long read is moderate evidence. A sub-10-second
 * read is a bounce and counts slightly against the topic.
 */
const classifyRead = (reading) => {
  const durationSeconds = Math.max(
    Number(reading.durationSeconds) || 0,
    0
  );

  if (reading.completed) {
    return BEHAVIOR_SIGNALS.COMPLETED_READ;
  }

  if (durationSeconds >= READING.longReadSeconds) {
    return BEHAVIOR_SIGNALS.LONG_READ;
  }

  if (durationSeconds < READING.shortReadSeconds) {
    return BEHAVIOR_SIGNALS.SHORT_READ;
  }

  return null;
};

// ------------------------------------------------------------
// PROFILE BUILDER
// ------------------------------------------------------------

/**
 * @param {object} input
 * @param {number} input.nowMs                Injected clock.
 * @param {Array}  input.topicPreferences     [{ topicId, preference }]
 * @param {Array}  input.sourcePreferences    [{ sourceId, preference }]
 * @param {Array}  input.readingHistory       [{ storyId, openedAt, durationSeconds, completed, story }]
 * @param {Array}  input.feedback             [{ storyId, feedback, createdAt, story }]
 * @param {Array}  input.skips                [{ storyId, createdAt, story }]
 * @param {Array}  input.bookmarks            [{ storyId, createdAt, story }]
 */
const buildUserProfile = ({
  nowMs,
  topicPreferences = [],
  sourcePreferences = [],
  readingHistory = [],
  feedback = [],
  skips = [],
  bookmarks = []
}) => {
  const now = Number(nowMs) || Date.now();

  // ----------------------------------------------------------
  // EXPLICIT PREFERENCES
  // ----------------------------------------------------------

  const explicitTopic = new Map(
    topicPreferences.map(({ topicId, preference }) => [
      topicId,
      Number(preference) || 0
    ])
  );

  const explicitSource = new Map(
    sourcePreferences.map(({ sourceId, preference }) => [
      sourceId,
      Number(preference) || 0
    ])
  );

  // ----------------------------------------------------------
  // BEHAVIOURAL ACCUMULATORS
  //
  // `behavioral*` is the combined signal used for affinity.
  // The narrower accumulators feed their own weighted score
  // terms so their contribution stays visible and tunable.
  // ----------------------------------------------------------

  const behavioralTopic = new Map();
  const behavioralSource = new Map();

  const readingTopic = new Map();
  const readingSource = new Map();

  const likeTopic = new Map();
  const likeSource = new Map();

  const bookmarkTopic = new Map();
  const bookmarkSource = new Map();

  // ----------------------------------------------------------
  // PER-STORY INTERACTION LOOKUPS
  // ----------------------------------------------------------

  const readStories = new Map();
  const readClusters = new Map();
  const feedbackByStory = new Map();
  const skipByStory = new Map();
  const bookmarkedStories = new Map();

  // ----------------------------------------------------------
  // READING HISTORY
  // ----------------------------------------------------------

  let meaningfulReadCount = 0;

  for (const reading of readingHistory) {
    const openedAtMs = toTimestamp(reading.openedAt);

    const ageDays = daysBetween(now, openedAtMs);

    // --- per-story: powers the already-read penalty ---

    const existing = readStories.get(reading.storyId);

    const durationSeconds = Math.max(
      Number(reading.durationSeconds) || 0,
      0
    );

    readStories.set(reading.storyId, {
      count: (existing?.count || 0) + 1,

      // Keep the MOST RECENT read; the penalty recovers from it.
      lastReadAtMs:
        existing?.lastReadAtMs === null ||
        existing?.lastReadAtMs === undefined
          ? openedAtMs
          : openedAtMs === null
            ? existing.lastReadAtMs
            : Math.max(existing.lastReadAtMs, openedAtMs),

      completed: Boolean(existing?.completed) || Boolean(reading.completed),

      totalDurationSeconds:
        (existing?.totalDurationSeconds || 0) + durationSeconds
    });

    // --- cluster level: user already knows about this event ---

    const clusterId = reading.story?.clusterId;

    if (clusterId) {
      const existingCluster = readClusters.get(clusterId);

      readClusters.set(clusterId, {
        count: (existingCluster?.count || 0) + 1,

        storyIds: new Set([
          ...(existingCluster?.storyIds || []),
          reading.storyId
        ])
      });
    }

    // --- affinity: generalized to topics + source ---

    const signal = classifyRead(reading);

    if (!signal) {
      continue;
    }

    if (signal.value > 0) {
      meaningfulReadCount += 1;
    }

    const decay = decayByHalfLife(ageDays, signal.halfLifeDays);

    const amount = signal.value * decay;

    spreadSignal({
      story: reading.story,
      amount,
      topicMap: behavioralTopic,
      sourceMap: behavioralSource
    });

    // Positive reading interest is tracked separately so the
    // scorer can reward "you read a lot about this" independently
    // of explicit likes.
    if (amount > 0) {
      // Longer reads produce a stronger interest signal, saturating
      // so a single marathon read cannot dominate.
      const intensity = clamp01(
        saturate(durationSeconds, READING.saturationSeconds) + 0.2
      );

      spreadSignal({
        story: reading.story,
        amount: amount * intensity,
        topicMap: readingTopic,
        sourceMap: readingSource
      });
    }
  }

  // ----------------------------------------------------------
  // FEEDBACK (LIKE / DISLIKE)
  // ----------------------------------------------------------

  let likeCount = 0;

  for (const entry of feedback) {
    feedbackByStory.set(entry.storyId, {
      feedback: entry.feedback,
      createdAtMs: toTimestamp(entry.createdAt)
    });

    const signal =
      entry.feedback === "LIKE"
        ? BEHAVIOR_SIGNALS.LIKE
        : entry.feedback === "DISLIKE"
          ? BEHAVIOR_SIGNALS.DISLIKE
          : null;

    if (!signal) {
      continue;
    }

    if (entry.feedback === "LIKE") {
      likeCount += 1;
    }

    const ageDays = daysBetween(now, toTimestamp(entry.createdAt));

    const amount = signal.value * decayByHalfLife(ageDays, signal.halfLifeDays);

    spreadSignal({
      story: entry.story,
      amount,
      topicMap: behavioralTopic,
      sourceMap: behavioralSource
    });

    if (entry.feedback === "LIKE") {
      spreadSignal({
        story: entry.story,
        amount,
        topicMap: likeTopic,
        sourceMap: likeSource
      });
    }
  }

  // ----------------------------------------------------------
  // SKIPS
  //
  // Short-lived negative signal. A skip means "not right now",
  // not "never show me this topic again", so its half-life is
  // deliberately short.
  // ----------------------------------------------------------

  for (const entry of skips) {
    const createdAtMs = toTimestamp(entry.createdAt);

    skipByStory.set(entry.storyId, {
      createdAtMs
    });

    const ageDays = daysBetween(now, createdAtMs);

    const amount =
      BEHAVIOR_SIGNALS.SKIP.value *
      decayByHalfLife(ageDays, BEHAVIOR_SIGNALS.SKIP.halfLifeDays);

    spreadSignal({
      story: entry.story,
      amount,
      topicMap: behavioralTopic,
      sourceMap: behavioralSource
    });
  }

  // ----------------------------------------------------------
  // BOOKMARKS
  //
  // The strongest intent signal available: the user deliberately
  // saved this for later.
  // ----------------------------------------------------------

  for (const entry of bookmarks) {
    const createdAtMs = toTimestamp(entry.createdAt);

    bookmarkedStories.set(entry.storyId, {
      createdAtMs
    });

    const ageDays = daysBetween(now, createdAtMs);

    const amount =
      BEHAVIOR_SIGNALS.BOOKMARK.value *
      decayByHalfLife(ageDays, BEHAVIOR_SIGNALS.BOOKMARK.halfLifeDays);

    spreadSignal({
      story: entry.story,
      amount,
      topicMap: behavioralTopic,
      sourceMap: behavioralSource
    });

    spreadSignal({
      story: entry.story,
      amount,
      topicMap: bookmarkTopic,
      sourceMap: bookmarkSource
    });
  }

  // ----------------------------------------------------------
  // COLD START STRENGTH
  //
  // How much we trust behavioural personalization for this user.
  // 0 = brand new (fall back to explicit preferences + trending),
  // 1 = enough history to personalize fully.
  // ----------------------------------------------------------

  const signalCount =
    meaningfulReadCount + likeCount + bookmarkedStories.size;

  const signalStrength = clamp01(
    signalCount / COLD_START.fullSignalCount
  );

  return {
    nowMs: now,

    explicitTopic,
    explicitSource,

    behavioralTopic,
    behavioralSource,

    readingTopic,
    readingSource,

    likeTopic,
    likeSource,

    bookmarkTopic,
    bookmarkSource,

    readStories,
    readClusters,
    feedbackByStory,
    skipByStory,
    bookmarkedStories,

    signalCount,
    signalStrength,
    isColdStart: signalCount === 0,

    hasExplicitPreferences:
      explicitTopic.size > 0 || explicitSource.size > 0
  };
};

/**
 * An empty profile. Used by non-personalized feed modes so the
 * scorer never has to null-check.
 */
const emptyProfile = (nowMs) =>
  buildUserProfile({
    nowMs
  });

module.exports = {
  buildUserProfile,
  emptyProfile,
  classifyRead,
  extractTopicIds,
  spreadSignal
};
