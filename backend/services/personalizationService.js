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

const getPersonalizedFeed = async ({
  userId,
  page = 1,
  limit = 10,
  mode = "personalized"
}) => {
  // ------------------------------------------------------------
  // 1. Get user's topic preferences
  // ------------------------------------------------------------
  const preferences = await getPreferences(userId);

  const preferenceByTopic = new Map(
    preferences.map(({ topicId, preference }) => [
      topicId,
      preference
    ])
  );

  // ------------------------------------------------------------
  // 2. Get user's source preferences
  //
  // Source preferences are only needed for the
  // personalized feed.
  // ------------------------------------------------------------
  const sourcePreferences =
    mode === "personalized"
      ? await prisma.userSourcePreference.findMany({
          where: { userId },
          select: {
            sourceId: true,
            preference: true
          }
        })
      : [];

  const preferenceBySource = new Map(
    sourcePreferences.map(({ sourceId, preference }) => [
      sourceId,
      preference
    ])
  );

  // ------------------------------------------------------------
  // 3. Get stories skipped by this user
  //
  // Skipped stories should never appear in any feed mode.
  // ------------------------------------------------------------
  const skippedStories = await prisma.storySkip.findMany({
    where: {
      userId
    },
    select: {
      storyId: true
    }
  });

  const skippedStoryIds = new Set(
    skippedStories.map(({ storyId }) => storyId)
  );

  // ------------------------------------------------------------
  // 4. Fetch recent candidate stories
  // ------------------------------------------------------------
  const candidates = await prisma.story.findMany({
    include: {
      source: {
        select: {
          id: true,
          name: true,
          slug: true,
          websiteUrl: true,
          politicalLean: true,
          reliabilityScore: true
        }
      },

      storyTopics: {
        include: {
          topic: true
        }
      }
    },

    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" }
    ],

    take: MAX_CANDIDATES
  });

  // ============================================================
  // LATEST MODE
  // ============================================================

  if (mode === "latest") {
    const latestStories = candidates
      .filter(
        (story) => !skippedStoryIds.has(story.id)
      )
      .map((story) => ({
        ...story,

        relevanceScore: null,

        scoring: {
          mode: "latest"
        }
      }));

    const total = latestStories.length;

    const stories = latestStories.slice(
      (page - 1) * limit,
      page * limit
    );

    return {
      stories,

      personalization: {
        topicPreferenceCount: preferences.length,
        sourcePreferenceCount: 0,
        mode: "latest"
      },

      pagination: {
        total,
        page,
        limit,

        totalPages: Math.max(
          Math.ceil(total / limit),
          1
        ),

        hasNextPage:
          page * limit < total,

        hasPreviousPage:
          page > 1
      }
    };
  }

  // ============================================================
  // TRENDING MODE
  // ============================================================

  if (mode === "trending") {
    const now = Date.now();

    const trendingStories = candidates
      .filter(
        (story) => !skippedStoryIds.has(story.id)
      )
      .map((story) => {
        const publishedTime = new Date(
          story.publishedAt || story.createdAt
        ).getTime();

        // Age of story in hours.
        const ageHours = Math.max(
          (now - publishedTime) / (1000 * 60 * 60),
          0
        );

        // Stories lose some trending strength as they age.
        //
        // At age 0:
        // recencyMultiplier = 1
        //
        // At age 24h:
        // recencyMultiplier ≈ 0.5
        //
        // At age 48h:
        // recencyMultiplier ≈ 0.33
        const recencyMultiplier =
          1 / (1 + ageHours / 24);

        const popularityScore =
          Math.min(
            Math.max(story.points || 0, 0),
            1000
          );

        const trendingScore =
          popularityScore *
          recencyMultiplier;

        return {
          ...story,

          relevanceScore: Number(
            trendingScore.toFixed(3)
          ),

          scoring: {
            mode: "trending",

            popularityScore,

            ageHours: Number(
              ageHours.toFixed(2)
            ),

            recencyMultiplier: Number(
              recencyMultiplier.toFixed(3)
            )
          }
        };
      })

      .sort((a, b) => {
        if (
          b.relevanceScore !==
          a.relevanceScore
        ) {
          return (
            b.relevanceScore -
            a.relevanceScore
          );
        }

        return (
          new Date(
            b.publishedAt || b.createdAt
          ) -
          new Date(
            a.publishedAt || a.createdAt
          )
        );
      });

    const total = trendingStories.length;

    const stories = trendingStories.slice(
      (page - 1) * limit,
      page * limit
    );

    return {
      stories,

      personalization: {
        topicPreferenceCount: preferences.length,
        sourcePreferenceCount: 0,
        mode: "trending"
      },

      pagination: {
        total,
        page,
        limit,

        totalPages: Math.max(
          Math.ceil(total / limit),
          1
        ),

        hasNextPage:
          page * limit < total,

        hasPreviousPage:
          page > 1
      }
    };
  }

  // ============================================================
  // PERSONALIZED MODE
  // ============================================================

  const scoredStories = candidates
    .filter(
      (story) => !skippedStoryIds.has(story.id)
    )
    .map((story) => {
      // --------------------------------------------------------
      // Topic score
      // --------------------------------------------------------
      const topicScore =
        story.storyTopics.reduce(
          (score, { topicId }) => {
            return (
              score +
              (
                preferenceByTopic.get(topicId) ||
                0
              )
            );
          },
          0
        );

      // --------------------------------------------------------
      // Source score
      // --------------------------------------------------------
      const sourceScore =
        preferenceBySource.get(
          story.sourceId
        ) || 0;

      // --------------------------------------------------------
      // Popularity score
      // --------------------------------------------------------
      const popularityScore =
        Math.min(
          Math.max(story.points || 0, 0),
          1000
        ) / 1000;

      // --------------------------------------------------------
      // Final score
      // --------------------------------------------------------
      const relevanceScore =
        topicScore +
        sourceScore +
        popularityScore;

      return {
        ...story,

        scoring: {
          mode: "personalized",

          topicScore,

          sourceScore,

          popularityScore: Number(
            popularityScore.toFixed(3)
          )
        },

        relevanceScore: Number(
          relevanceScore.toFixed(3)
        )
      };
    })

    // Don't recommend strongly negative stories.
    .filter(
      (story) =>
        story.relevanceScore >= 0
    )

    // Highest relevance first.
    .sort((a, b) => {
      if (
        b.relevanceScore !==
        a.relevanceScore
      ) {
        return (
          b.relevanceScore -
          a.relevanceScore
        );
      }

      return (
        new Date(
          b.publishedAt || b.createdAt
        ) -
        new Date(
          a.publishedAt || a.createdAt
        )
      );
    });

  const total = scoredStories.length;

  const stories = scoredStories.slice(
    (page - 1) * limit,
    page * limit
  );

  return {
    stories,

    personalization: {
      topicPreferenceCount:
        preferences.length,

      sourcePreferenceCount:
        sourcePreferences.length,

      mode: "personalized"
    },

    pagination: {
      total,
      page,
      limit,

      totalPages: Math.max(
        Math.ceil(total / limit),
        1
      ),

      hasNextPage:
        page * limit < total,

      hasPreviousPage:
        page > 1
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

const getSourcePreferences = async (userId) => {
  return prisma.userSourcePreference.findMany({
    where: { userId },
    include: {
      source: true
    },
    orderBy: {
      source: {
        name: "asc"
      }
    }
  });
};

const followSource = async ({ userId, sourceId }) => {
  const source = await prisma.sources.findUnique({
    where: { id: sourceId }
  });

  if (!source) {
    throw new AppError("Source not found", 404);
  }

  const preference = await prisma.userSourcePreference.upsert({
    where: {
      userId_sourceId: {
        userId,
        sourceId
      }
    },
    create: {
      userId,
      sourceId,
      preference: 5
    },
    update: {
      preference: 5
    },
    include: {
      source: true
    }
  });

  return preference;
};

const unfollowSource = async ({ userId, sourceId }) => {
  const source = await prisma.sources.findUnique({
    where: { id: sourceId }
  });

  if (!source) {
    throw new AppError("Source not found", 404);
  }

  await prisma.userSourcePreference.deleteMany({
    where: {
      userId,
      sourceId
    }
  });

  return {
    unfollowed: true,
    sourceId
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

const skipStory = async ({
  userId,
  storyId
}) => {
  // ------------------------------------------------------------
  // 1. Make sure the story exists
  // ------------------------------------------------------------
  const story = await prisma.story.findUnique({
    where: {
      id: storyId
    },
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

  // ------------------------------------------------------------
  // 2. Check whether the story was already skipped
  // ------------------------------------------------------------
  const existingSkip = await prisma.storySkip.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    }
  });

  // Already skipped → do nothing
  if (existingSkip) {
    return {
      skipped: true,
      storyId,
      alreadySkipped: true,
      preferenceDelta: 0,
      topicCount: story.storyTopics.length
    };
  }

  // ------------------------------------------------------------
  // 3. Skip signal
  //
  // A skip is a weak negative signal.
  // Unlike DISLIKE (-1), we use -1 here as well because
  // the user explicitly rejected the story.
  // ------------------------------------------------------------
  const preferenceDelta = -1;

  // ------------------------------------------------------------
  // 4. Store skip + update topic preferences atomically
  // ------------------------------------------------------------
  await prisma.$transaction(async (transaction) => {
    await transaction.storySkip.create({
      data: {
        userId,
        storyId
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

      const preference = Math.max(
        -5,
        (current?.preference || 0) + preferenceDelta
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
    skipped: true,
    storyId,
    alreadySkipped: false,
    preferenceDelta,
    topicCount: story.storyTopics.length
  };
};

// FIX: Moved getStorySkip outside of skipStory
const getStorySkip = async ({
  userId,
  storyId
}) => {
  const story = await prisma.story.findUnique({
    where: {
      id: storyId
    },
    select: {
      id: true
    }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  const skip = await prisma.storySkip.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    }
  });

  return skip;
};

const removeStorySkip = async ({
  userId,
  storyId
}) => {
  const existingSkip = await prisma.storySkip.findUnique({
    where: {
      userId_storyId: {
        userId,
        storyId
      }
    }
  });

  if (!existingSkip) {
    return {
      removed: false,
      storyId,
      preferenceDelta: 0
    };
  }

  const story = await prisma.story.findUnique({
    where: {
      id: storyId
    },
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

  // Removing a -1 skip restores +1.
  const preferenceDelta = 1;

  await prisma.$transaction(async (transaction) => {
    await transaction.storySkip.delete({
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

      const preference = Math.min(
        5,
        current.preference + preferenceDelta
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
  getSourcePreferences,
  followSource,
  unfollowSource,

  setStoryFeedback,
  getStoryFeedback,
  removeStoryFeedback,

  // FIX: Added the missing exports for story skips
  skipStory,
  getStorySkip,
  removeStorySkip
};