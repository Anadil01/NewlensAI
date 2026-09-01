const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateAffinityScores
} = require("../services/personalizationService");

test("topic affinity sums preferences across all story topics", () => {
  const story = {
    sourceId: "source-1",

    storyTopics: [
      { topicId: "ai" },
      { topicId: "startups" }
    ]
  };

  const preferenceByTopic = new Map([
    ["ai", 5],
    ["startups", 3]
  ]);

  const preferenceBySource = new Map();

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, 8);
  assert.equal(result.sourceScore, 0);
});

test("source affinity uses the user's source preference", () => {
  const story = {
    sourceId: "source-1",

    storyTopics: [
      { topicId: "ai" }
    ]
  };

  const preferenceByTopic = new Map([
    ["ai", 5]
  ]);

  const preferenceBySource = new Map([
    ["source-1", 4]
  ]);

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, 5);
  assert.equal(result.sourceScore, 4);
});

test("missing topic preferences contribute zero", () => {
  const story = {
    sourceId: "source-1",

    storyTopics: [
      { topicId: "ai" },
      { topicId: "unknown-topic" }
    ]
  };

  const preferenceByTopic = new Map([
    ["ai", 5]
  ]);

  const preferenceBySource = new Map();

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, 5);
  assert.equal(result.sourceScore, 0);
});

test("missing source preference contributes zero", () => {
  const story = {
    sourceId: "unknown-source",

    storyTopics: [
      { topicId: "ai" }
    ]
  };

  const preferenceByTopic = new Map([
    ["ai", 5]
  ]);

  const preferenceBySource = new Map();

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, 5);
  assert.equal(result.sourceScore, 0);
});

test("topic and source affinity remain independent", () => {
  const story = {
    sourceId: "source-1",

    storyTopics: [
      { topicId: "ai" },
      { topicId: "startups" }
    ]
  };

  const preferenceByTopic = new Map([
    ["ai", 5],
    ["startups", -2]
  ]);

  const preferenceBySource = new Map([
    ["source-1", 4]
  ]);

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, 3);
  assert.equal(result.sourceScore, 4);
});

test("negative topic preferences reduce topic affinity", () => {
  const story = {
    sourceId: "source-1",

    storyTopics: [
      { topicId: "politics" }
    ]
  };

  const preferenceByTopic = new Map([
    ["politics", -5]
  ]);

  const preferenceBySource = new Map();

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, -5);
  assert.equal(result.sourceScore, 0);
});

test("a story with no topics has zero topic affinity", () => {
  const story = {
    sourceId: "source-1",
    storyTopics: []
  };

  const preferenceByTopic = new Map([
    ["ai", 5]
  ]);

  const preferenceBySource = new Map([
    ["source-1", 4]
  ]);

  const result =
    calculateAffinityScores({
      story,
      preferenceByTopic,
      preferenceBySource
    });

  assert.equal(result.topicScore, 0);
  assert.equal(result.sourceScore, 4);
});