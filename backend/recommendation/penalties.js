// ============================================================
// PENALTIES
// ============================================================
//
// Penalties are MULTIPLICATIVE and applied to the positive score.
// 1 means "no penalty", 0 means "remove from the feed".
//
// This layer fixes two inverted behaviours in the previous design:
//
//   1. Reading a story used to make that same story rank HIGHER,
//      because the read bonus was applied to the story itself.
//      Now reading a story suppresses it.
//
//   2. Skips were hard-filtered forever, so the skip penalty was
//      dead code and a skip was effectively permanent. Now a skip
//      suppresses strongly at first and recovers over a week.
//
// PURE MODULE: no database, no clock.
// ============================================================

const { PENALTIES } = require("./weights");

const {
  daysBetween,
  recoverPenalty,
  clamp01
} = require("./normalize");

// ------------------------------------------------------------
// ALREADY READ
//
// The single most important correctness fix. A story the user has
// already opened should not be served again at the top of the feed.
//
// The penalty is not permanent: after `recoveryDays` the story is
// no longer actively suppressed, which matters for long-running
// stories the user may want to revisit.
// ------------------------------------------------------------

const alreadyReadPenalty = (profile, storyId) => {
  const read = profile.readStories.get(storyId);

  if (!read) {
    return {
      multiplier: 1,
      applied: false
    };
  }

  const ageDays = daysBetween(profile.nowMs, read.lastReadAtMs);

  let multiplier = recoverPenalty(
    ageDays,
    PENALTIES.alreadyRead.floor,
    PENALTIES.alreadyRead.recoveryDays
  );

  // A story the user finished is even less worth re-serving than one
  // they merely opened.
  if (read.completed) {
    multiplier *= 0.6;
  }

  // Repeat opens without completion suggest the user keeps landing
  // on it by accident; suppress a little harder each time.
  if (read.count > 1) {
    multiplier *= Math.pow(0.85, Math.min(read.count - 1, 3));
  }

  return {
    multiplier: clamp01(multiplier),
    applied: true,
    readCount: read.count,
    completed: Boolean(read.completed),
    ageDays
  };
};

// ------------------------------------------------------------
// CLUSTER ALREADY SEEN
//
// The user read a DIFFERENT story about the same event. They already
// know what happened, so near-duplicate coverage is low value.
//
// This is distinct from cluster diminishing returns, which limits
// repetition WITHIN one response. This limits repetition against the
// user's history.
// ------------------------------------------------------------

const clusterSeenPenalty = (profile, story) => {
  if (!story.clusterId) {
    return {
      multiplier: 1,
      applied: false
    };
  }

  const seen = profile.readClusters.get(story.clusterId);

  if (!seen) {
    return {
      multiplier: 1,
      applied: false
    };
  }

  // If the only story they read in this cluster IS this story, the
  // already-read penalty already covers it. Applying both would
  // double-penalize.
  const otherStoriesRead = [...seen.storyIds].filter(
    (id) => id !== story.id
  );

  if (otherStoriesRead.length === 0) {
    return {
      multiplier: 1,
      applied: false
    };
  }

  return {
    multiplier: PENALTIES.clusterAlreadySeen,
    applied: true,
    otherStoriesRead: otherStoriesRead.length
  };
};

// ------------------------------------------------------------
// SKIP
//
// "Not right now" rather than "never again". Recovers fully within
// a week so a single dismissal does not permanently hide a topic.
// ------------------------------------------------------------

const skipPenalty = (profile, storyId) => {
  const skip = profile.skipByStory.get(storyId);

  if (!skip) {
    return {
      multiplier: 1,
      applied: false
    };
  }

  const ageDays = daysBetween(profile.nowMs, skip.createdAtMs);

  return {
    multiplier: recoverPenalty(
      ageDays,
      PENALTIES.skip.floor,
      PENALTIES.skip.recoveryDays
    ),
    applied: true,
    ageDays
  };
};

// ------------------------------------------------------------
// DISLIKE
//
// An explicit, deliberate negative judgement on this exact story.
// Unlike a skip this does not recover: the user has told us plainly
// that they do not want it.
// ------------------------------------------------------------

const dislikePenalty = (profile, storyId) => {
  const entry = profile.feedbackByStory.get(storyId);

  if (!entry || entry.feedback !== "DISLIKE") {
    return {
      multiplier: 1,
      applied: false
    };
  }

  return {
    multiplier: PENALTIES.dislike,
    applied: true
  };
};

// ------------------------------------------------------------
// ALREADY BOOKMARKED
//
// A bookmarked story is saved and reachable from the bookmarks page,
// so it does not need to occupy prime feed real estate. The topic
// affinity earned by the bookmark still boosts SIMILAR stories.
// ------------------------------------------------------------

const alreadyBookmarkedPenalty = (profile, storyId) => {
  if (!profile.bookmarkedStories.has(storyId)) {
    return {
      multiplier: 1,
      applied: false
    };
  }

  return {
    multiplier: PENALTIES.alreadyBookmarked,
    applied: true
  };
};

// ------------------------------------------------------------
// COMBINED
// ------------------------------------------------------------

/**
 * Applies every penalty to a story and returns the combined
 * multiplier plus a breakdown for API explainability.
 */
const computePenalties = (profile, story) => {
  const alreadyRead = alreadyReadPenalty(profile, story.id);
  const clusterSeen = clusterSeenPenalty(profile, story);
  const skip = skipPenalty(profile, story.id);
  const dislike = dislikePenalty(profile, story.id);
  const bookmarked = alreadyBookmarkedPenalty(profile, story.id);

  const multiplier = clamp01(
    alreadyRead.multiplier *
      clusterSeen.multiplier *
      skip.multiplier *
      dislike.multiplier *
      bookmarked.multiplier
  );

  const applied = [];

  if (alreadyRead.applied) applied.push("alreadyRead");
  if (clusterSeen.applied) applied.push("clusterAlreadySeen");
  if (skip.applied) applied.push("skipped");
  if (dislike.applied) applied.push("disliked");
  if (bookmarked.applied) applied.push("alreadyBookmarked");

  return {
    multiplier,
    applied,

    alreadyRead,
    clusterSeen,
    skip,
    dislike,
    bookmarked
  };
};

module.exports = {
  alreadyReadPenalty,
  clusterSeenPenalty,
  skipPenalty,
  dislikePenalty,
  alreadyBookmarkedPenalty,
  computePenalties
};
