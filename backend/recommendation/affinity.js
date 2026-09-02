// ============================================================
// TOPIC + SOURCE AFFINITY
// ============================================================
//
// Combines two independent sources of truth into a single bounded
// affinity value in -1..+1:
//
//   1. EXPLICIT   what the user told us in their settings
//   2. BEHAVIOURAL what the user actually did
//
// Keeping these separate is the central fix over the previous
// design, where behaviour permanently overwrote the user's stated
// preferences. Now `UserPreference` means only what its name says,
// and behaviour is a decaying layer applied on top at read time.
//
// PURE MODULE: no database, no clock.
// ============================================================

const { AFFINITY } = require("./weights");

const { squash, clampSigned, clamp01 } = require("./normalize");

// ------------------------------------------------------------
// COMPONENT NORMALIZATION
// ------------------------------------------------------------

/**
 * Explicit preference is stored as an integer in -5..+5, so it maps
 * linearly onto -1..+1.
 */
const normalizeExplicit = (preference) => {
  const value = Number(preference) || 0;

  return clampSigned(value / AFFINITY.explicitScale);
};

/**
 * Behavioural totals are unbounded (a heavy user can accumulate
 * dozens of points on one topic), so they are squashed rather than
 * divided. `behavioralSaturation` sets how quickly that happens.
 */
const normalizeBehavioral = (total) => {
  const value = Number(total) || 0;

  return squash(value / AFFINITY.behavioralSaturation);
};

// ------------------------------------------------------------
// BLENDING
// ------------------------------------------------------------

/**
 * Blends explicit and behavioural components.
 *
 * `signalStrength` (0..1) scales down the behavioural half for users
 * who have not interacted enough for it to be trustworthy. A brand
 * new user is driven entirely by their explicit choices.
 *
 * When a user has no explicit preference for a topic at all, the
 * explicit weight is not simply treated as 0 — that would dilute a
 * strong behavioural signal by 60%. Instead the behavioural
 * component takes over the full weight.
 */
const blend = ({
  explicit,
  behavioral,
  hasExplicit,
  signalStrength = 1
}) => {
  const strength = clamp01(signalStrength);

  const behavioralComponent = behavioral * strength;

  if (!hasExplicit) {
    return clampSigned(behavioralComponent);
  }

  const blended =
    AFFINITY.explicitWeight * explicit +
    AFFINITY.behavioralWeight * behavioralComponent;

  return clampSigned(blended);
};

// ------------------------------------------------------------
// TOPIC AFFINITY
// ------------------------------------------------------------

/**
 * Affinity for a single topic.
 *
 * @returns {object} the value plus its components, so the API can
 *                   explain *why* a story was ranked where it was.
 */
const topicAffinity = (profile, topicId) => {
  const hasExplicit = profile.explicitTopic.has(topicId);

  const explicit = normalizeExplicit(profile.explicitTopic.get(topicId));

  const behavioral = normalizeBehavioral(
    profile.behavioralTopic.get(topicId)
  );

  return {
    value: blend({
      explicit,
      behavioral,
      hasExplicit,
      signalStrength: profile.signalStrength
    }),
    explicit,
    behavioral,
    hasExplicit
  };
};

/**
 * Affinity for a story, which may carry several topics.
 *
 * The MAXIMUM is blended with the MEAN rather than using either
 * alone:
 *
 *   - mean alone punishes a story that is strongly relevant on one
 *     topic but incidentally tagged with three others
 *   - max alone lets one loosely-related tag carry an otherwise
 *     irrelevant story
 *
 * Weighting the max at 70% keeps "strongly about something I like"
 * as the dominant consideration while still rewarding stories that
 * are relevant across the board.
 */
const storyTopicAffinity = (profile, topicIds) => {
  if (!topicIds || topicIds.length === 0) {
    return {
      value: 0,
      topics: []
    };
  }

  const topics = topicIds.map((topicId) => ({
    topicId,
    ...topicAffinity(profile, topicId)
  }));

  const values = topics.map((topic) => topic.value);

  const mean =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  // For negative affinity the most negative topic drives the result:
  // one strongly disliked topic should sink the story even if the
  // others are neutral.
  const extreme =
    Math.abs(Math.min(...values)) > Math.abs(Math.max(...values))
      ? Math.min(...values)
      : Math.max(...values);

  return {
    value: clampSigned(0.7 * extreme + 0.3 * mean),
    topics
  };
};

// ------------------------------------------------------------
// SOURCE AFFINITY
// ------------------------------------------------------------

const sourceAffinity = (profile, sourceId) => {
  const hasExplicit = profile.explicitSource.has(sourceId);

  const explicit = normalizeExplicit(profile.explicitSource.get(sourceId));

  const behavioral = normalizeBehavioral(
    profile.behavioralSource.get(sourceId)
  );

  return {
    value: blend({
      explicit,
      behavioral,
      hasExplicit,
      signalStrength: profile.signalStrength
    }),
    explicit,
    behavioral,
    hasExplicit
  };
};

// ------------------------------------------------------------
// SECONDARY SIGNAL LOOKUPS
//
// These feed their own weighted score terms. Unlike affinity they
// are one-sided: they answer "how much positive evidence is there",
// so they are clamped to 0..1 and never go negative.
// ------------------------------------------------------------

/**
 * Averages a per-topic accumulator across a story's topics and
 * folds in the source-level value, then squashes to 0..1.
 */
const positiveSignal = ({
  topicMap,
  sourceMap,
  topicIds,
  sourceId,
  saturation
}) => {
  let topicTotal = 0;

  if (topicIds && topicIds.length) {
    for (const topicId of topicIds) {
      topicTotal += Math.max(topicMap.get(topicId) || 0, 0);
    }

    topicTotal /= topicIds.length;
  }

  const sourceTotal = Math.max(sourceMap.get(sourceId) || 0, 0);

  // Topic evidence is the primary driver; source is supporting.
  const combined = topicTotal + 0.5 * sourceTotal;

  return clamp01(squash(combined / saturation));
};

const readingInterest = (profile, topicIds, sourceId) =>
  positiveSignal({
    topicMap: profile.readingTopic,
    sourceMap: profile.readingSource,
    topicIds,
    sourceId,
    saturation: AFFINITY.behavioralSaturation
  });

const likeSignal = (profile, topicIds, sourceId) =>
  positiveSignal({
    topicMap: profile.likeTopic,
    sourceMap: profile.likeSource,
    topicIds,
    sourceId,
    saturation: AFFINITY.behavioralSaturation
  });

const bookmarkSignal = (profile, topicIds, sourceId) =>
  positiveSignal({
    topicMap: profile.bookmarkTopic,
    sourceMap: profile.bookmarkSource,
    topicIds,
    sourceId,
    saturation: AFFINITY.behavioralSaturation
  });

module.exports = {
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
};
