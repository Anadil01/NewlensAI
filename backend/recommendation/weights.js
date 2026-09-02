// ============================================================
// RECOMMENDATION WEIGHTS
// ============================================================
//
// Every tunable constant in the recommendation engine lives in
// this file. Nothing else in `backend/recommendation` should
// hard-code a magic number.
//
// Ranges are documented next to each value so the weights stay
// meaningful relative to one another.
// ============================================================

// ------------------------------------------------------------
// SCORE WEIGHTS
//
// Each of these multiplies a NORMALIZED signal. Affinity terms
// are in -1..+1, everything else is in 0..1, so the weight is
// the maximum contribution that term can make.
// ------------------------------------------------------------

const SCORE_WEIGHTS = {
  // Primary personalization driver.
  topicAffinity: 3.0,

  // Secondary personalization driver.
  sourceAffinity: 1.5,

  // Generalized reading behaviour (topic/source level).
  readingInterest: 1.5,

  // Explicit positive feedback, generalized.
  likeSignal: 1.0,

  // Strongest intent signal we have.
  bookmarkSignal: 1.2,

  // This is news: freshness must be able to out-rank weak affinity.
  freshness: 2.0,

  // Present, but never allowed to dominate personal relevance.
  popularity: 0.8,

  // Multi-source coverage is a proxy for newsworthiness.
  clusterImportance: 1.0
};

// ------------------------------------------------------------
// BEHAVIOURAL SIGNAL WEIGHTS
//
// Raw (pre-decay, pre-normalization) contribution of a single
// user interaction to topic/source affinity.
//
// `halfLifeDays` controls how long the system remembers it.
// A DISLIKE is remembered far longer than a SKIP, which is the
// core semantic difference between the two.
// ------------------------------------------------------------

const BEHAVIOR_SIGNALS = {
  COMPLETED_READ: {
    value: 2.0,
    halfLifeDays: 14
  },

  LONG_READ: {
    value: 1.0,
    halfLifeDays: 14
  },

  SHORT_READ: {
    value: -0.3,
    halfLifeDays: 14
  },

  LIKE: {
    value: 2.5,
    halfLifeDays: 30
  },

  BOOKMARK: {
    value: 3.0,
    halfLifeDays: 30
  },

  DISLIKE: {
    value: -3.0,
    halfLifeDays: 60
  },

  SKIP: {
    value: -1.0,
    halfLifeDays: 7
  }
};

// ------------------------------------------------------------
// READING THRESHOLDS
// ------------------------------------------------------------

const READING = {
  // At or above this, an incomplete read still counts as interest.
  longReadSeconds: 30,

  // Below this, an incomplete read counts as a bounce.
  shortReadSeconds: 10,

  // Duration that saturates the per-story reading interest score.
  saturationSeconds: 300
};

// ------------------------------------------------------------
// PENALTIES
//
// Penalties are MULTIPLICATIVE. 1 means "no penalty" and 0 means
// "remove from feed entirely".
// ------------------------------------------------------------

const PENALTIES = {
  // The user already opened this exact story.
  alreadyRead: {
    // Multiplier immediately after reading.
    floor: 0.15,

    // Penalty fades as the read recedes into the past, so a story
    // read a month ago is no longer actively suppressed.
    recoveryDays: 14
  },

  // The user already read a DIFFERENT story in the same cluster,
  // i.e. they already know about this event.
  clusterAlreadySeen: 0.45,

  // Explicit skip. Short memory: decays to 1 over `recoveryDays`.
  skip: {
    floor: 0.2,
    recoveryDays: 7
  },

  // Explicit dislike on this exact story.
  dislike: 0.1,

  // The user already bookmarked this story, so they have it saved.
  alreadyBookmarked: 0.5
};

// ------------------------------------------------------------
// FRESHNESS
// ------------------------------------------------------------

const FRESHNESS = {
  // Hours after which freshness has decayed to 0.5.
  halfLifeHours: 12,

  // Stories older than this get a freshness of 0.
  maxAgeHours: 72
};

// ------------------------------------------------------------
// POPULARITY
// ------------------------------------------------------------

const POPULARITY = {
  // Points value that maps to a normalized popularity of ~1.
  saturationPoints: 500
};

// ------------------------------------------------------------
// CLUSTER IMPORTANCE
// ------------------------------------------------------------

const CLUSTER = {
  // Distinct source count that saturates cluster importance.
  saturationSourceCount: 5,

  // Max stories from one cluster allowed in a single ranked page.
  maxPerCluster: 2
};

// ------------------------------------------------------------
// DIVERSIFICATION
// ------------------------------------------------------------

const DIVERSITY = {
  // Multiplier applied per previous appearance of the same source.
  sourceRepeatPenalty: 0.75,

  // Multiplier applied per previous appearance of the same topic.
  topicRepeatPenalty: 0.85,

  // Hard cap on back-to-back stories sharing a primary topic.
  maxConsecutiveTopic: 2,

  // Multiplier for an extra story from an already-placed cluster.
  clusterRepeatPenalty: 0.6
};

// ------------------------------------------------------------
// AFFINITY BLENDING
// ------------------------------------------------------------

const AFFINITY = {
  // How explicit preference and learned behaviour are combined.
  explicitWeight: 0.6,
  behavioralWeight: 0.4,

  // Explicit preferences are stored as integers in -5..+5.
  explicitScale: 5,

  // Raw behavioural sum that maps to a normalized affinity of ~0.76
  // (tanh(1)). Prevents runaway scores from heavy users.
  behavioralSaturation: 6
};

// ------------------------------------------------------------
// COLD START
// ------------------------------------------------------------

const COLD_START = {
  // Number of meaningful interactions required before behavioural
  // personalization is trusted at full strength.
  fullSignalCount: 5
};

// ------------------------------------------------------------
// CANDIDATES
// ------------------------------------------------------------

const CANDIDATES = {
  // Upper bound on stories pulled into memory for ranking.
  maxCandidates: 400,

  // Only rank stories published within this window.
  windowHours: 72
};

module.exports = {
  SCORE_WEIGHTS,
  BEHAVIOR_SIGNALS,
  READING,
  PENALTIES,
  FRESHNESS,
  POPULARITY,
  CLUSTER,
  DIVERSITY,
  AFFINITY,
  COLD_START,
  CANDIDATES
};
