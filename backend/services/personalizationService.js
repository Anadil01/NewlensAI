const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const MAX_CANDIDATES = 250;

const getPreferences = async (userId) => {
  return prisma.userPreference.findMany({
    where: { userId },
    include: { topic: true },
    orderBy: { topic: { name: "asc" } }
  });
};

const getTopics = async () => prisma.topic.findMany({
  orderBy: { name: "asc" },
  include: { _count: { select: { storyTopics: true } } }
});

const replacePreferences = async (userId, preferences) => {
  const topicIds = preferences.map(({ topicId }) => topicId);
  const topicCount = await prisma.topic.count({
    where: { id: { in: topicIds } }
  });

  if (topicCount !== topicIds.length) {
    throw new AppError("One or more topics do not exist", 400);
  }

  await prisma.$transaction([
    prisma.userPreference.deleteMany({ where: { userId } }),
    prisma.userPreference.createMany({
      data: preferences.map(({ topicId, preference }) => ({
        userId,
        topicId,
        preference
      }))
    })
  ]);

  return getPreferences(userId);
};

const getPersonalizedFeed = async ({ userId, page = 1, limit = 10 }) => {
  const preferences = await getPreferences(userId);
  const preferenceByTopic = new Map(
    preferences.map(({ topicId, preference }) => [topicId, preference])
  );

  // A small, recent candidate pool keeps scoring predictable while allowing
  // preference matches to outrank merely popular stories.
  const candidates = await prisma.story.findMany({
    include: {
      source: {
        select: {
          id: true, name: true, slug: true, websiteUrl: true,
          politicalLean: true, reliabilityScore: true
        }
      },
      storyTopics: { include: { topic: true } }
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" }
    ],
    take: MAX_CANDIDATES
  });

  const scoredStories = candidates
    .map((story) => {
      const topicScore = story.storyTopics.reduce(
        (score, { topicId }) => score + (preferenceByTopic.get(topicId) || 0),
        0
      );
      const popularityScore = Math.min(Math.max(story.points || 0, 0), 1000) / 1000;

      return {
        ...story,
        relevanceScore: Number((topicScore + popularityScore).toFixed(3))
      };
    })
    .filter((story) => story.relevanceScore >= 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore ||
      (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));

  const total = scoredStories.length;
  const stories = scoredStories.slice((page - 1) * limit, page * limit);

  return {
    stories,
    personalization: {
      preferenceCount: preferences.length,
      mode: preferences.length ? "personalized" : "cold_start"
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
};

const recordReading = async ({ userId, storyId, durationSeconds, completed }) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { storyTopics: { select: { topicId: true } } }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  // Completing a story is a stronger signal than simply opening it. A short
  // read does not change recommendations, preventing accidental taps from
  // distorting the feed.
  const affinityDelta = completed ? 2 : (durationSeconds >= 30 ? 1 : 0);

  await prisma.$transaction(async (transaction) => {
    await transaction.readingHistory.create({
      data: { userId, storyId, durationSeconds, completed }
    });

    if (!affinityDelta) {
      return;
    }

    for (const { topicId } of story.storyTopics) {
      const current = await transaction.userPreference.findUnique({
        where: { userId_topicId: { userId, topicId } }
      });
      const preference = Math.min(5, (current?.preference || 0) + affinityDelta);

      await transaction.userPreference.upsert({
        where: { userId_topicId: { userId, topicId } },
        create: { userId, topicId, preference },
        update: { preference }
      });
    }
  });

  return { recorded: true, affinityDelta, topicCount: story.storyTopics.length };
};

const followTopic = async ({ userId, topicId }) => {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  });

  if (!topic) {
    throw new AppError("Topic not found", 404);
  }

  const preference = await prisma.userPreference.upsert({
    where: {
      userId_topicId: {
        userId,
        topicId
      }
    },
    create: {
      userId,
      topicId,
      preference: 5
    },
    update: {
      preference: 5
    },
    include: {
      topic: true
    }
  });

  return preference;
};

const unfollowTopic = async ({ userId, topicId }) => {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId }
  });

  if (!topic) {
    throw new AppError("Topic not found", 404);
  }

  await prisma.userPreference.deleteMany({
    where: {
      userId,
      topicId
    }
  });

  return {
    unfollowed: true,
    topicId
  };
};

const setStoryFeedback = async ({
  userId,
  storyId,
  feedback
}) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      storyTopics: {
        select: {
          topicId: true
        }
      }
    }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  const existingFeedback = await prisma.storyFeedback.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    }
  });

  // Convert feedback into its recommendation signal.
  const signal = feedback === "LIKE" ? 1 : -1;
  const previousSignal = existingFeedback
    ? (existingFeedback.feedback === "LIKE" ? 1 : -1)
    : 0;

  // If the user submits the same feedback again,
  // don't change their preferences.
  const preferenceDelta = signal - previousSignal;

  await prisma.$transaction(async (transaction) => {
    await transaction.storyFeedback.upsert({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      },
      create: {
        userId,
        storyId,
        feedback
      },
      update: {
        feedback
      }
    });

    if (preferenceDelta === 0) {
      return;
    }

    for (const { topicId } of story.storyTopics) {
      const current = await transaction.userPreference.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId
          }
        }
      });

      const currentPreference = current?.preference || 0;

      const preference = Math.max(
        -5,
        Math.min(
          5,
          currentPreference + preferenceDelta
        )
      );

      await transaction.userPreference.upsert({
        where: {
          userId_topicId: {
            userId,
            topicId
          }
        },
        create: {
          userId,
          topicId,
          preference
        },
        update: {
          preference
        }
      });
    }
  });

  return {
    storyId,
    feedback,
    previousFeedback: existingFeedback?.feedback || null,
    preferenceDelta,
    topicCount: story.storyTopics.length
  };
};

const getStoryFeedback = async ({
  userId,
  storyId
}) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { id: true }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  const feedback = await prisma.storyFeedback.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    }
  });

  return feedback;
};

const removeStoryFeedback = async ({
  userId,
  storyId
}) => {
  const existingFeedback = await prisma.storyFeedback.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    }
  });

  if (!existingFeedback) {
    return {
      removed: false,
      storyId,
      preferenceDelta: 0
    };
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      storyTopics: {
        select: {
          topicId: true
        }
      }
    }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  // Removing LIKE removes +1.
  // Removing DISLIKE removes -1, therefore +1.
  const preferenceDelta =
    existingFeedback.feedback === "LIKE" ? -1 : 1;

  await prisma.$transaction(async (transaction) => {
    await transaction.storyFeedback.delete({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

    for (const { topicId } of story.storyTopics) {
      const current = await transaction.userPreference.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId
          }
        }
      });

      if (!current) {
        continue;
      }

      const preference = Math.max(
        -5,
        Math.min(
          5,
          current.preference + preferenceDelta
        )
      );

      await transaction.userPreference.update({
        where: {
          userId_topicId: {
            userId,
            topicId
          }
        },
        data: {
          preference
        }
      });
    }
  });

  return {
    removed: true,
    storyId,
    previousFeedback: existingFeedback.feedback,
    preferenceDelta,
    topicCount: story.storyTopics.length
  };
};

module.exports = {
  getTopics,
  getPreferences,
  replacePreferences,
  getPersonalizedFeed,
  recordReading,
  followTopic,
  unfollowTopic,
  setStoryFeedback,
  getStoryFeedback,
  removeStoryFeedback
};