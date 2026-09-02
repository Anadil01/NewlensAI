// ============================================================
// NORMALIZATION HELPERS
// ============================================================
//
// Pure math used across the recommendation engine. Different raw
// signals have wildly different ranges:
//
//   popularity  0 -> 10,000
//   preference -5 -> +5
//   freshness   0 -> 1
//
// Everything must be mapped into a predictable range before the
// weights in `weights.js` can mean anything.
// ============================================================

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

// ------------------------------------------------------------
// CLAMP
// ------------------------------------------------------------

const clamp = (value, min, max) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.min(Math.max(numeric, min), max);
};

const clamp01 = (value) => clamp(value, 0, 1);

const clampSigned = (value) => clamp(value, -1, 1);

// ------------------------------------------------------------
// SATURATION
//
// Maps 0..Infinity into 0..1 with diminishing returns, so a story
// with 10,000 points does not obliterate one with 500.
//
//   saturate(0, s)  = 0
//   saturate(s, s)  = 0.5
//   saturate(3s, s) = 0.75
// ------------------------------------------------------------

const saturate = (value, saturationPoint) => {
  const numeric = Math.max(Number(value) || 0, 0);

  const scale = Number(saturationPoint) || 1;

  return numeric / (numeric + scale);
};

// ------------------------------------------------------------
// SQUASH
//
// Maps -Infinity..Infinity into -1..+1. Used for affinity so that
// a user with hundreds of interactions cannot produce a runaway
// score relative to a user with a handful.
// ------------------------------------------------------------

const squash = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.tanh(numeric);
};

// ------------------------------------------------------------
// TIME
// ------------------------------------------------------------

const toTimestamp = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
};

const hoursBetween = (nowMs, thenMs) => {
  if (thenMs === null) {
    return null;
  }

  return Math.max((nowMs - thenMs) / MS_PER_HOUR, 0);
};

const daysBetween = (nowMs, thenMs) => {
  if (thenMs === null) {
    return null;
  }

  return Math.max((nowMs - thenMs) / MS_PER_DAY, 0);
};

// ------------------------------------------------------------
// EXPONENTIAL DECAY
//
// Standard half-life decay used for signal recency:
//
//   decay(0, h)   = 1
//   decay(h, h)   = 0.5
//   decay(2h, h)  = 0.25
//
// A missing timestamp is treated as fully decayed-in (weight 1)
// rather than discarded, so signals without a usable date still
// count. This keeps legacy rows meaningful.
// ------------------------------------------------------------

const decayByHalfLife = (ageDays, halfLifeDays) => {
  if (ageDays === null || ageDays === undefined) {
    return 1;
  }

  const halfLife = Number(halfLifeDays);

  if (!Number.isFinite(halfLife) || halfLife <= 0) {
    return 1;
  }

  const age = Math.max(Number(ageDays) || 0, 0);

  return Math.pow(0.5, age / halfLife);
};

// ------------------------------------------------------------
// LINEAR RECOVERY
//
// Used by penalties that should fade out completely rather than
// decay asymptotically. Returns a multiplier that starts at
// `floor` and reaches 1 after `recoveryDays`.
//
//   recover(0, 0.2, 7)   = 0.2
//   recover(3.5, 0.2, 7) = 0.6
//   recover(7, 0.2, 7)   = 1
//   recover(99, 0.2, 7)  = 1
// ------------------------------------------------------------

const recoverPenalty = (ageDays, floor, recoveryDays) => {
  if (ageDays === null || ageDays === undefined) {
    return clamp01(floor);
  }

  const window = Number(recoveryDays);

  if (!Number.isFinite(window) || window <= 0) {
    return clamp01(floor);
  }

  const progress = clamp01(Math.max(Number(ageDays) || 0, 0) / window);

  const safeFloor = clamp01(floor);

  return safeFloor + (1 - safeFloor) * progress;
};

// ------------------------------------------------------------
// ROUNDING
//
// Keeps score payloads readable in API responses and makes test
// assertions stable against floating-point noise.
// ------------------------------------------------------------

const round = (value, precision = 4) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  const factor = Math.pow(10, precision);

  return Math.round(numeric * factor) / factor;
};

module.exports = {
  MS_PER_HOUR,
  MS_PER_DAY,

  clamp,
  clamp01,
  clampSigned,

  saturate,
  squash,

  toTimestamp,
  hoursBetween,
  daysBetween,

  decayByHalfLife,
  recoverPenalty,

  round
};
