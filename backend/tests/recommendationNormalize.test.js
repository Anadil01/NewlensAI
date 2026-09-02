const test = require("node:test");
const assert = require("node:assert/strict");

const {
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
  round,
  MS_PER_DAY,
  MS_PER_HOUR
} = require("../recommendation/normalize");

// ============================================================
// CLAMP
// ============================================================

test("clamp bounds values and rejects non-numbers", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(50, 0, 10), 10);

  // Non-numeric input falls back to the minimum rather than NaN,
  // which would silently poison every downstream score.
  assert.equal(clamp(undefined, 0, 10), 0);
  assert.equal(clamp(null, 2, 10), 2);
  assert.equal(clamp(Number.NaN, 3, 10), 3);
  assert.equal(clamp(Infinity, 0, 10), 0);
});

test("clamp01 and clampSigned use the documented ranges", () => {
  assert.equal(clamp01(1.5), 1);
  assert.equal(clamp01(-0.5), 0);

  assert.equal(clampSigned(2), 1);
  assert.equal(clampSigned(-2), -1);
  assert.equal(clampSigned(0.25), 0.25);
});

// ============================================================
// SATURATE
// ============================================================

test("saturate maps 0..Infinity into 0..1 with diminishing returns", () => {
  assert.equal(saturate(0, 500), 0);

  // At the saturation point the value is exactly half.
  assert.equal(saturate(500, 500), 0.5);

  assert.equal(saturate(1500, 500), 0.75);

  // Negative input is treated as zero.
  assert.equal(saturate(-100, 500), 0);

  // Never reaches 1, so popularity can never fully dominate.
  assert.ok(saturate(1_000_000, 500) < 1);
});

test("saturate keeps huge outliers close together", () => {
  const big = saturate(10_000, 500);
  const bigger = saturate(100_000, 500);

  // A 10x difference in raw points is worth less than 0.1 here.
  assert.ok(bigger - big < 0.1);
});

// ============================================================
// SQUASH
// ============================================================

test("squash bounds affinity to -1..+1", () => {
  assert.equal(squash(0), 0);

  assert.ok(squash(1) > 0.76 && squash(1) < 0.77);

  assert.ok(squash(100) <= 1);
  assert.ok(squash(-100) >= -1);

  // Symmetric.
  assert.equal(round(squash(2) + squash(-2)), 0);

  assert.equal(squash(Number.NaN), 0);
});

// ============================================================
// TIME
// ============================================================

test("toTimestamp accepts dates and strings, rejects junk", () => {
  const date = new Date("2026-09-01T10:00:00Z");

  assert.equal(toTimestamp(date), date.getTime());
  assert.equal(toTimestamp("2026-09-01T10:00:00Z"), date.getTime());

  assert.equal(toTimestamp(null), null);
  assert.equal(toTimestamp(undefined), null);
  assert.equal(toTimestamp("not-a-date"), null);
});

test("hoursBetween and daysBetween never return negatives", () => {
  const now = Date.now();

  assert.equal(hoursBetween(now, now - 3 * MS_PER_HOUR), 3);
  assert.equal(daysBetween(now, now - 2 * MS_PER_DAY), 2);

  // A future timestamp clamps to 0 instead of producing a negative
  // age, which would otherwise invert decay into amplification.
  assert.equal(hoursBetween(now, now + MS_PER_HOUR), 0);
  assert.equal(daysBetween(now, now + MS_PER_DAY), 0);

  assert.equal(hoursBetween(now, null), null);
  assert.equal(daysBetween(now, null), null);
});

// ============================================================
// DECAY
// ============================================================

test("decayByHalfLife halves the signal every half-life", () => {
  assert.equal(decayByHalfLife(0, 14), 1);
  assert.equal(decayByHalfLife(14, 14), 0.5);
  assert.equal(decayByHalfLife(28, 14), 0.25);
  assert.equal(decayByHalfLife(42, 14), 0.125);
});

test("decayByHalfLife treats missing age as undecayed", () => {
  // Rows without a usable timestamp still count rather than
  // being silently dropped.
  assert.equal(decayByHalfLife(null, 14), 1);
  assert.equal(decayByHalfLife(undefined, 14), 1);

  // A nonsensical half-life must not produce NaN or Infinity.
  assert.equal(decayByHalfLife(10, 0), 1);
  assert.equal(decayByHalfLife(10, -5), 1);
});

test("a skip decays much faster than a dislike", () => {
  const skipAfter7 = decayByHalfLife(7, 7);
  const dislikeAfter7 = decayByHalfLife(7, 60);

  assert.equal(skipAfter7, 0.5);

  // Dislike still retains most of its strength after a week.
  assert.ok(dislikeAfter7 > 0.9);
});

// ============================================================
// PENALTY RECOVERY
// ============================================================

test("recoverPenalty rises linearly from floor to 1", () => {
  assert.equal(recoverPenalty(0, 0.2, 7), 0.2);
  assert.equal(round(recoverPenalty(3.5, 0.2, 7)), 0.6);
  assert.equal(recoverPenalty(7, 0.2, 7), 1);

  // Fully recovered penalties stay at 1 and never exceed it.
  assert.equal(recoverPenalty(99, 0.2, 7), 1);
});

test("recoverPenalty handles missing age and bad windows", () => {
  // No timestamp means we cannot prove recovery, so the penalty
  // stays at its strongest.
  assert.equal(recoverPenalty(null, 0.15, 14), 0.15);
  assert.equal(recoverPenalty(5, 0.15, 0), 0.15);
});

// ============================================================
// ROUND
// ============================================================

test("round stabilises floating point noise", () => {
  assert.equal(round(0.1 + 0.2), 0.3);
  assert.equal(round(1 / 3, 2), 0.33);
  assert.equal(round(Number.NaN), 0);
});
