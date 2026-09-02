// ============================================================
// SCORING + RANKING ENGINE
// ============================================================
//
// The assembly point. Everything else in this directory is a pure
// component; this file wires them into one pipeline:
//
//   1. PREPARE    flatten Prisma rows into a flat ranking shape
//   2. SCORE      weighted sum of positive signals
//   3. PENALIZE   multiply by the history-based penalties
//   4. DIVERSIFY  greedy re-rank for cluster/source/topic spread
//
// Two design rules hold throughout:
//
//   - Positive signals ADD, penalties MULTIPLY. A penalty can never
//     produce a negative score, and a story with zero positive
//     signal cannot be rescued by a lenient penalty.
//
//   - Cold start is not a special branch. It is the same pipeline
//     with the personalization terms naturally near zero and the
//     quality terms carrying the feed.
//
// PURE MODULE: no database, no clock. `nowMs` comes from the profile.
// ============================================================

const { SCORE_WEIGHTS, COLD_START } = require("./weights");

const { extractTopicIds } = require("./signals");

const {
  storyTopicAffinity,
  sourceAffinity,
  readingInterest,
  likeSignal,
  bookmarkSignal
} = require("./affinity");

const { computeQuality, buildClusterStats } = require("./quality");

const { computePenalties } = require("./penalties");

const { diversify } = require("./diversify");

const { round, clamp01 } = require("./normalize");

// ------------------------------------------------------------
// PREPARE
//
// Prisma returns `storyTopics: [{ topicId }]`. Walking that nested
// shape once per signal per story would be wasteful and would leak
// the persistence shape into every module, so topics are flattened
// up front and every downstream component takes plain `topicIds`.
// ------------------------------------------------------------

const prepareStory = (story) => ({
  ...story,
  topicIds: extractTopicIds(story)
});

const prepareCandidates = (stories) => stories.map(prepareStory);

// ------------------------------------------------------------
// WEIGHTS FOR THIS STORY
//
// `points` is null for most RSS stories, so applying the popularity
// weight to a hard 0 would permanently handicap every RSS story
// against every aggregator story. Instead its weight is handed to
// freshness, which we can always compute.
// ------------------------------------------------------------

const resolveWeights = (quality) => {
  if (quality.popularity.known) {
    return SCORE_WEIGHTS;
  }

  return {
    ...SCORE_WEIGHTS,
    freshness: SCORE_WEIGHTS.freshness + SCORE_WEIGHTS.popularity,
    popularity: 0
  };
};

// ------------------------------------------------------------
// POSITIVE SCORE
// ------------------------------------------------------------

/**
 * Scores one prepared story for one user profile.
 *
 * Affinity terms are signed (-1..+1) so a disliked topic actively
 * subtracts. Everything else is 0..1 and can only add.
 *
 * @returns {{ score: number, breakdown: object }}
 */
const scoreStory = (profile, story, { clusterStats } = {}) => {
  const topicIds = story.topicIds || [];

  // --- personalization ---

  const topic = storyTopicAffinity(profile, topicIds);
  const source = sourceAffinity(profile, story.sourceId);

  const reading = readingInterest(profile, topicIds, story.sourceId);
  const liked = likeSignal(profile, topicIds, story.sourceId);
  const bookmarked = bookmarkSignal(profile, topicIds, story.sourceId);

  // --- story quality ---

  const quality = computeQuality(story, {
    nowMs: profile.nowMs,
    clusterStats
  });

  const weights = resolveWeights(quality);

  const positive =
    weights.topicAffinity * topic.value +
    weights.sourceAffinity * source.value +
    weights.readingInterest * reading +
    weights.likeSignal * liked +
    weights.bookmarkSignal * bookmarked +
    weights.freshness * quality.freshness.value +
    weights.popularity * quality.popularity.value +
    weights.clusterImportance * quality.clusterImportance.value;

  // A story whose affinity terms are negative enough to drive the
  // whole sum below zero is floored at 0 rather than allowed to go
  // negative: penalties are multiplicative, and multiplying a
  // negative score by a penalty would INCREASE its rank.
  const base = Math.max(positive, 0);

  // --- penalties ---

  const penalties = computePenalties(profile, story);

  const score = base * penalties.multiplier;

  return {
    score,

    breakdown: {
      base: round(base),
      score: round(score),

      topicAffinity: round(topic.value),
      sourceAffinity: round(source.value),
      readingInterest: round(reading),
      likeSignal: round(liked),
      bookmarkSignal: round(bookmarked),

      freshness: round(quality.freshness.value),
      ageHours:
        quality.freshness.ageHours === null
          ? null
          : round(quality.freshness.ageHours, 2),

      popularity: round(quality.popularity.value),
      popularityKnown: quality.popularity.known,

      clusterImportance: round(quality.clusterImportance.value),
      clusterSourceCount: quality.clusterImportance.sourceCount,

      penaltyMultiplier: round(penalties.multiplier),
      penaltiesApplied: penalties.applied
    }
  };
};

// ------------------------------------------------------------
// RANKING
// ------------------------------------------------------------

/**
 * Scores and orders a candidate set.
 *
 * `clusterStats` is derived from the candidates ONCE, not per story:
 * cluster importance needs the distinct-source count for an event,
 * and recomputing that inside the per-story loop would make ranking
 * quadratic.
 *
 * @param {object} profile   From `buildUserProfile`.
 * @param {Array}  stories   Raw Prisma story rows.
 * @param {object} options
 * @param {number} options.limit  Page size to fill.
 * @returns {{ items: Array, meta: object }}
 */
const rankStories = (profile, stories, { limit = 20 } = {}) => {
  const candidates = prepareCandidates(stories);

  const clusterStats = buildClusterStats(candidates);

  const scored = candidates.map((story) => {
    const { score, breakdown } = scoreStory(profile, story, { clusterStats });

    return { story, score, breakdown };
  });

  // Pre-sorting is not required for correctness — the greedy pass
  // scans the whole remaining set at every slot — but it makes the
  // ordering deterministic for equal-scoring stories.
  scored.sort((a, b) => b.score - a.score || compareIds(a, b));

  const items = diversify(scored, limit);

  return {
    items,

    meta: {
      candidateCount: candidates.length,
      returnedCount: items.length,
      clusterCount: clusterStats.size,

      // Surfaced so the API can tell the client the feed is still
      // warming up rather than silently serving a generic ranking.
      personalized: profile.signalCount > 0 || profile.hasExplicitPreferences,
      signalCount: profile.signalCount,
      signalStrength: round(clamp01(profile.signalStrength)),
      coldStart: profile.signalCount < COLD_START.fullSignalCount
    }
  };
};

/**
 * Stable tiebreaker. Without it, two stories with identical scores
 * could swap places between requests and cause visible feed jitter
 * on pagination.
 */
const compareIds = (a, b) => {
  const left = a.story.id ?? "";
  const right = b.story.id ?? "";

  return left < right ? -1 : left > right ? 1 : 0;
};

module.exports = {
  prepareStory,
  prepareCandidates,
  resolveWeights,
  scoreStory,
  rankStories
};
