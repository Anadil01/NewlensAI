// ============================================================
// DIVERSIFICATION / CLUSTER-AWARE RE-RANKING
// ============================================================
//
// Scoring alone produces a technically correct but unreadable feed:
// if a user loves one topic, the top 20 slots become 20 stories about
// the same topic, from the same two outlets, half of them covering
// the identical event.
//
// This pass fixes that. It does NOT change any story's score. It runs
// a GREEDY SELECTION over the already-scored list: at each slot it
// picks the highest score *after* applying penalties that depend on
// what has already been placed.
//
// Two kinds of constraint:
//
//   HARD (cluster cap)      near-duplicate coverage of one event is
//                           dropped outright — that is deduplication
//                           and always desirable.
//
//   SOFT (source, topic,    the story is pushed down, not removed.
//         consecutive run)  If nothing else is available it can still
//                           be placed, so the feed never comes back
//                           short just to satisfy a preference.
//
// PURE MODULE: no database, no clock.
// ============================================================

const { CLUSTER, DIVERSITY } = require("./weights");

// ------------------------------------------------------------
// PLACEMENT STATE
//
// Tracks what has already been placed in the response being built.
// ------------------------------------------------------------

const createPlacementState = () => ({
  clusterCounts: new Map(),
  sourceCounts: new Map(),
  topicCounts: new Map(),

  // Length of the current run of consecutive same-topic stories, and
  // the topic that run is made of.
  runTopicId: null,
  runLength: 0,

  placedCount: 0
});

/**
 * A story's primary topic is the first in its topic list. Ingestion
 * orders topics by classification confidence, so the first is the
 * best single label for "what this story is about".
 */
const primaryTopicOf = (story) => {
  const topicIds = story.topicIds;

  if (!topicIds || topicIds.length === 0) {
    return null;
  }

  return topicIds[0];
};

const recordPlacement = (state, story) => {
  if (story.clusterId) {
    state.clusterCounts.set(
      story.clusterId,
      (state.clusterCounts.get(story.clusterId) || 0) + 1
    );
  }

  if (story.sourceId) {
    state.sourceCounts.set(
      story.sourceId,
      (state.sourceCounts.get(story.sourceId) || 0) + 1
    );
  }

  for (const topicId of story.topicIds || []) {
    state.topicCounts.set(topicId, (state.topicCounts.get(topicId) || 0) + 1);
  }

  const primaryTopicId = primaryTopicOf(story);

  if (primaryTopicId !== null && primaryTopicId === state.runTopicId) {
    state.runLength += 1;
  } else {
    state.runTopicId = primaryTopicId;
    state.runLength = 1;
  }

  state.placedCount += 1;

  return state;
};

// ------------------------------------------------------------
// CLUSTER CAP  (hard)
//
// At most `maxPerCluster` stories about the same event. The first is
// the primary account; a second can add a different outlet's angle;
// beyond that it is repetition.
//
// Unclustered stories are unconstrained — a null clusterId means "we
// could not group this", not "these are all the same event".
// ------------------------------------------------------------

const clusterAdjustment = (state, story) => {
  if (!story.clusterId) {
    return { multiplier: 1, blocked: false, placed: 0 };
  }

  const placed = state.clusterCounts.get(story.clusterId) || 0;

  if (placed >= CLUSTER.maxPerCluster) {
    return { multiplier: 0, blocked: true, placed };
  }

  if (placed === 0) {
    return { multiplier: 1, blocked: false, placed };
  }

  // Allowed, but a second story about a known event should have to
  // beat a genuinely new story to earn its slot.
  return {
    multiplier: Math.pow(DIVERSITY.clusterRepeatPenalty, placed),
    blocked: false,
    placed
  };
};

// ------------------------------------------------------------
// SOURCE REPETITION  (soft)
//
// Compounding, so one prolific outlet cannot own the page even if the
// user genuinely likes it. Four stories in means a 0.75^4 multiplier.
// ------------------------------------------------------------

const sourceAdjustment = (state, story) => {
  if (!story.sourceId) {
    return { multiplier: 1, placed: 0 };
  }

  const placed = state.sourceCounts.get(story.sourceId) || 0;

  return {
    multiplier: Math.pow(DIVERSITY.sourceRepeatPenalty, placed),
    placed
  };
};

// ------------------------------------------------------------
// TOPIC REPETITION  (soft)
//
// Gentler than the source penalty. A user who likes one topic SHOULD
// see more of it; this only stops it becoming the entire feed.
//
// Measured on the primary topic so a story with many secondary labels
// is not penalized for being well classified.
// ------------------------------------------------------------

const topicAdjustment = (state, story) => {
  const primaryTopicId = primaryTopicOf(story);

  if (primaryTopicId === null) {
    return { multiplier: 1, placed: 0, breaksRun: false };
  }

  const placed = state.topicCounts.get(primaryTopicId) || 0;

  // Hard-ish cap on back-to-back stories: even a topic the user loves
  // reads as spam three in a row. Soft, so it defers rather than drops.
  const inRun =
    primaryTopicId === state.runTopicId &&
    state.runLength >= DIVERSITY.maxConsecutiveTopic;

  return {
    multiplier: inRun ? 0 : Math.pow(DIVERSITY.topicRepeatPenalty, placed),
    placed,
    breaksRun: inRun
  };
};

// ------------------------------------------------------------
// COMBINED ADJUSTMENT
// ------------------------------------------------------------

const diversityAdjustment = (state, story) => {
  const cluster = clusterAdjustment(state, story);
  const source = sourceAdjustment(state, story);
  const topic = topicAdjustment(state, story);

  return {
    multiplier: cluster.multiplier * source.multiplier * topic.multiplier,

    // Only the cluster cap removes a story from consideration.
    blocked: cluster.blocked,

    // Deferred rather than dropped: eligible again once the run ends.
    deferred: topic.breaksRun,

    cluster,
    source,
    topic
  };
};

// ------------------------------------------------------------
// GREEDY RE-RANKING
//
// Why greedy rather than sorting once: every adjustment depends on
// what has already been placed, so the penalties are only knowable
// slot by slot. A single sort cannot express that.
//
// Cost is O(remaining x limit). With the 400-candidate cap in
// `weights.js` and a page-sized limit this is a few thousand cheap
// comparisons per request.
// ------------------------------------------------------------

/**
 * @param {Array<{ story: object, score: number }>} scored
 *        Stories with their final personalized score, any order.
 * @param {number} limit  How many stories to place.
 * @returns {Array} Ordered results, each carrying the diversity
 *          multiplier that was applied for explainability.
 */
const diversify = (scored, limit) => {
  const state = createPlacementState();

  const remaining = [...scored];

  const selected = [];

  const targetCount = Math.min(
    Number.isFinite(limit) ? limit : remaining.length,
    remaining.length
  );

  while (selected.length < targetCount && remaining.length > 0) {
    let bestIndex = -1;
    let bestAdjusted = -Infinity;
    let bestAdjustment = null;

    // Fallback tracking: if every remaining story is deferred by the
    // consecutive-topic rule, we still have to fill the slot.
    let fallbackIndex = -1;
    let fallbackScore = -Infinity;
    let fallbackAdjustment = null;

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];

      const adjustment = diversityAdjustment(state, candidate.story);

      if (adjustment.blocked) {
        continue;
      }

      if (adjustment.deferred) {
        if (candidate.score > fallbackScore) {
          fallbackScore = candidate.score;
          fallbackIndex = index;
          fallbackAdjustment = adjustment;
        }

        continue;
      }

      const adjusted = candidate.score * adjustment.multiplier;

      if (adjusted > bestAdjusted) {
        bestAdjusted = adjusted;
        bestIndex = index;
        bestAdjustment = adjustment;
      }
    }

    // Everything eligible was deferred: relax the consecutive-topic
    // rule rather than returning a short feed.
    if (bestIndex === -1) {
      if (fallbackIndex === -1) {
        // Only hard cluster blocks left. Nothing more can be placed.
        break;
      }

      bestIndex = fallbackIndex;
      bestAdjusted = fallbackScore;
      bestAdjustment = fallbackAdjustment;
    }

    const [chosen] = remaining.splice(bestIndex, 1);

    recordPlacement(state, chosen.story);

    selected.push({
      ...chosen,
      position: selected.length,
      diversity: {
        multiplier: bestAdjustment.multiplier,
        adjustedScore: bestAdjusted,
        clusterPlaced: bestAdjustment.cluster.placed,
        sourcePlaced: bestAdjustment.source.placed,
        topicPlaced: bestAdjustment.topic.placed,
        relaxedTopicRun: bestAdjustment.deferred === true
      }
    });
  }

  return selected;
};

module.exports = {
  createPlacementState,
  primaryTopicOf,
  recordPlacement,
  clusterAdjustment,
  sourceAdjustment,
  topicAdjustment,
  diversityAdjustment,
  diversify
};
