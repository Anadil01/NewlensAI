// ============================================================
// STORY QUALITY SIGNALS
// ============================================================
//
// These terms are the same for every user: they describe the story
// itself, not the reader. They are what keeps the feed usable for a
// cold-start user and what stops a highly personalized feed from
// going stale.
//
//   FRESHNESS          how recently it was published
//   POPULARITY         how much engagement it attracted
//   CLUSTER IMPORTANCE how many distinct sources covered the event
//
// All three return 0..1 so `SCORE_WEIGHTS` alone decides how much
// each can contribute.
//
// PURE MODULE: no database. `nowMs` is always passed in.
// ============================================================

const { FRESHNESS, POPULARITY, CLUSTER } = require("./weights");

const {
  hoursBetween,
  decayByHalfLife,
  saturate,
  clamp01
} = require("./normalize");

// ------------------------------------------------------------
// FRESHNESS
//
// News value collapses fast, so this is exponential decay rather
// than a linear ramp: a 2-hour-old story is worth far more than
// twice a 24-hour-old one.
//
// `publishedAt` is nullable in the schema, so `createdAt` (the time
// we ingested it) is the fallback. Without that fallback every
// story missing a publish date would score 0 and be invisible.
// ------------------------------------------------------------

const storyTimestampMs = (story) => {
  const source = story.publishedAt ?? story.createdAt ?? null;

  if (source === null) {
    return null;
  }

  const ms = source instanceof Date ? source.getTime() : Date.parse(source);

  return Number.isFinite(ms) ? ms : null;
};

const freshness = (story, nowMs) => {
  const timestampMs = storyTimestampMs(story);

  const ageHours = hoursBetween(nowMs, timestampMs);

  if (ageHours === null) {
    // No usable date at all. Treat as mid-aged rather than 0 so an
    // otherwise relevant story is not buried by a data gap.
    return {
      value: 0.5,
      ageHours: null,
      estimated: true
    };
  }

  // Beyond the cutoff a story is no longer "news" and contributes
  // nothing here. Relevance can still surface it.
  if (ageHours >= FRESHNESS.maxAgeHours) {
    return {
      value: 0,
      ageHours,
      estimated: false
    };
  }

  return {
    value: clamp01(decayByHalfLife(ageHours, FRESHNESS.halfLifeHours)),
    ageHours,
    estimated: false
  };
};

// ------------------------------------------------------------
// POPULARITY
//
// `points` comes from aggregator sources (Hacker News etc.) and is
// null for most RSS stories. Null must mean "unknown", not
// "unpopular", otherwise every RSS story is permanently handicapped
// against every HN story.
//
// The curve saturates so a 5000-point story cannot bulldoze the
// personalization terms.
// ------------------------------------------------------------

const popularity = (story) => {
  const points = story.points;

  if (points === null || points === undefined) {
    return {
      value: 0,
      known: false
    };
  }

  return {
    value: saturate(points, POPULARITY.saturationPoints),
    known: true,
    points
  };
};

// ------------------------------------------------------------
// CLUSTER IMPORTANCE
//
// If ten different outlets covered an event, it is objectively more
// significant than something only one blog wrote up. DISTINCT
// SOURCES is the metric, not story count: a single outlet publishing
// five follow-ups is not a bigger story.
//
// `StoryCluster` does not denormalize this, so it is computed from
// the candidate set by `buildClusterStats` and passed in.
// ------------------------------------------------------------

/**
 * Builds per-cluster statistics from the candidate stories.
 *
 * Computed once per request rather than per story, which keeps
 * ranking linear in the number of candidates.
 */
const buildClusterStats = (stories) => {
  const stats = new Map();

  for (const story of stories) {
    if (!story.clusterId) {
      continue;
    }

    let entry = stats.get(story.clusterId);

    if (!entry) {
      entry = {
        storyCount: 0,
        sourceIds: new Set()
      };

      stats.set(story.clusterId, entry);
    }

    entry.storyCount += 1;

    if (story.sourceId) {
      entry.sourceIds.add(story.sourceId);
    }
  }

  return stats;
};

const clusterImportance = (story, clusterStats) => {
  if (!story.clusterId) {
    return {
      value: 0,
      sourceCount: 0,
      storyCount: 0
    };
  }

  const entry = clusterStats?.get(story.clusterId);

  if (!entry) {
    return {
      value: 0,
      sourceCount: 0,
      storyCount: 0
    };
  }

  const sourceCount = entry.sourceIds.size;

  // A cluster covered by only one source carries no more weight than
  // an unclustered story.
  if (sourceCount <= 1) {
    return {
      value: 0,
      sourceCount,
      storyCount: entry.storyCount
    };
  }

  // Linear ramp up to the saturation point: the difference between 1
  // and 3 sources is meaningful, between 8 and 10 is not.
  const value = clamp01(
    (sourceCount - 1) / (CLUSTER.saturationSourceCount - 1)
  );

  return {
    value,
    sourceCount,
    storyCount: entry.storyCount
  };
};

// ------------------------------------------------------------
// COMBINED
// ------------------------------------------------------------

const computeQuality = (story, { nowMs, clusterStats }) => {
  const fresh = freshness(story, nowMs);
  const pop = popularity(story);
  const cluster = clusterImportance(story, clusterStats);

  return {
    freshness: fresh,
    popularity: pop,
    clusterImportance: cluster
  };
};

module.exports = {
  storyTimestampMs,
  freshness,
  popularity,
  buildClusterStats,
  clusterImportance,
  computeQuality
};
