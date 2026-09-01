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

const getTopics = async () =>
  prisma.topic.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          storyTopics: true
        }
      }
    }
  });

const replacePreferences = async (userId, preferences) => {
  const topicIds = preferences.map(({ topicId }) => topicId);

  const topicCount = await prisma.topic.count({
    where: {
      id: {
        in: topicIds
      }
    }
  });

  if (topicCount !== topicIds.length) {
    throw new AppError("One or more topics do not exist", 400);
  }

  await prisma.$transaction([
    prisma.userPreference.deleteMany({
      where: { userId }
    }),

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

// ============================================================
// CLUSTER-AWARE DIVERSIFICATION
// ============================================================
//
// A cluster represents one real-world news event.
//
// Example:
//
// Cluster A:
//   Story A1
//   Story A2
//   Story A3
//
// Cluster B:
//   Story B1
//   Story B2
//
// Cluster C:
//   Story C1
//
// Instead of showing:
//
//   A1, A2, A3, B1, B2, C1
//
// We diversify the feed:
//
//   A1, B1, C1, A2, B2, A3
//
// This prevents one real-world event from dominating the feed.
//
// IMPORTANT:
// The input is expected to already be sorted by relevanceScore.
// Therefore, the first story inside each cluster is the strongest
// story from that cluster.
//
// Unclustered stories are treated as individual groups so they
// are never accidentally merged together.
// ============================================================

const diversifyByCluster = (stories) => {
  if (!stories.length) {
    return [];
  }

  // ----------------------------------------------------------
  // Group stories by cluster.
  //
  // Map insertion order is important here.
  // The first time we see a cluster determines the order in
  // which that cluster participates in diversification.
  // ----------------------------------------------------------

  const clusters = new Map();

  for (const story of stories) {
    // Clustered stories use their real cluster ID.
    //
    // Unclustered stories get a unique synthetic ID so that
    // each unclustered story remains independent.
    const clusterId =
      story.clusterId || `story:${story.id}`;

    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, []);
    }

    clusters.get(clusterId).push(story);
  }

  // ----------------------------------------------------------
  // Round-robin through clusters.
  //
  // Example:
  //
  // cluster-a: [a1, a2, a3]
  // cluster-b: [b1, b2]
  // cluster-c: [c1]
  //
  // Round 1:
  //   a1, b1, c1
  //
  // Round 2:
  //   a2, b2
  //
  // Round 3:
  //   a3
  //
  // Final:
  //   a1, b1, c1, a2, b2, a3
  // ----------------------------------------------------------

  const diversified = [];

  const clusterGroups = Array.from(
    clusters.values()
  );

  const maxClusterSize = Math.max(
    ...clusterGroups.map(
      (clusterStories) => clusterStories.length
    )
  );

  for (
    let position = 0;
    position < maxClusterSize;
    position++
  ) {
    for (const clusterStories of clusterGroups) {
      if (position >= clusterStories.length) {
        continue;
      }

      const story = clusterStories[position];

      diversified.push({
        ...story,

        // Useful metadata for the frontend.
        clusterInfo: story.cluster
          ? {
              id: story.cluster.id,
              title: story.cluster.title,
              description: story.cluster.description
            }
          : null,

        isClusterRepresentative:
          Boolean(story.clusterId) &&
          position === 0
      });
    }
  }

  return diversified;
};

// ============================================================
// CLUSTER DIMINISHING RETURNS
// ============================================================
//
// Stories belonging to the same cluster receive progressively
// smaller relevance multipliers.
//
// First story:  1.00
// Second story: 0.80
// Third story:  0.65
// Fourth+:     0.55
//
// This does NOT remove stories.
//
// It only reduces the score of repeated coverage of the same
// real-world event.
//
// Example:
//
// A1 = 10 * 1.00 = 10
// A2 = 10 * 0.80 = 8
// A3 = 10 * 0.65 = 6.5
// A4 = 10 * 0.55 = 5.5
//
// Unclustered stories are not penalized.
// ============================================================

const applyClusterDiminishingReturns = (stories) => {
  const clusterCounts = new Map();

  return stories.map((story) => {
    // Unclustered stories don't compete with each other.
    if (!story.clusterId) {
      return story;
    }

    const count =
      clusterCounts.get(story.clusterId) || 0;

    clusterCounts.set(
      story.clusterId,
      count + 1
    );

    // First story = 100%
    // Second story = 80%
    // Third story = 65%
    // Fourth+ = 55%

    let multiplier;

    if (count === 0) {
      multiplier = 1;
    } else if (count === 1) {
      multiplier = 0.8;
    } else if (count === 2) {
      multiplier = 0.65;
    } else {
      multiplier = 0.55;
    }

    const originalScore =
      story.relevanceScore ?? 0;

    const adjustedScore =
      originalScore * multiplier;

    return {
      ...story,

      relevanceScore: Number(
        adjustedScore.toFixed(3)
      ),

      scoring: {
        ...story.scoring,

        clusterDiminishingReturns: {
          clusterPosition: count + 1,
          multiplier,
          originalScore,
          adjustedScore: Number(
            adjustedScore.toFixed(3)
          )
        }
      }
    };
  });
};

// ============================================================
// PERSONALIZED FEED
// ============================================================

const getPersonalizedFeed = async ({
  userId,
  page = 1,
  limit = 10,
  mode = "personalized"
}) => {
  // ============================================================
  // 1. GET USER TOPIC PREFERENCES
  // ============================================================

  const preferences =
    await getPreferences(userId);

  const preferenceByTopic = new Map(
    preferences.map(
      ({ topicId, preference }) => [
        topicId,
        preference
      ]
    )
  );

  // ============================================================
  // 2. GET USER SOURCE PREFERENCES
  //
  // Source preferences only affect personalized mode.
  // ============================================================

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
    sourcePreferences.map(
      ({ sourceId, preference }) => [
        sourceId,
        preference
      ]
    )
  );

  // ============================================================
  // 3. GET SKIPPED STORIES
  //
  // Skipped stories never appear in any feed mode.
  // ============================================================

  const skippedStories =
    await prisma.storySkip.findMany({
      where: {
        userId
      },

      select: {
        storyId: true
      }
    });

  const skippedStoryIds = new Set(
    skippedStories.map(
      ({ storyId }) => storyId
    )
  );

  // ============================================================
  // 4. FETCH RECENT CANDIDATES
  // ============================================================

  const candidates =
    await prisma.story.findMany({
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

        cluster: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },

        storyTopics: {
          include: {
            topic: true
          }
        }
      },

      orderBy: [
        {
          publishedAt: "desc"
        },
        {
          createdAt: "desc"
        }
      ],

      take: MAX_CANDIDATES
    });

  // ============================================================
  // 5. REMOVE SKIPPED STORIES
  // ============================================================

  const eligibleStories =
    candidates.filter(
      (story) =>
        !skippedStoryIds.has(story.id)
    );

  // ============================================================
  // LATEST MODE
  // ============================================================

  if (mode === "latest") {
    const latestStories =
      eligibleStories.map((story) => ({
        ...story,

        relevanceScore: null,

        scoring: {
          mode: "latest"
        }
      }));

    // ----------------------------------------------------------
    // Latest feed is primarily chronological.
    // ----------------------------------------------------------

    const chronologicalStories =
      latestStories.sort((a, b) => {
        return (
          new Date(
            b.publishedAt || b.createdAt
          ) -
          new Date(
            a.publishedAt || a.createdAt
          )
        );
      });

    const total =
      chronologicalStories.length;

    const stories =
      chronologicalStories.slice(
        (page - 1) * limit,
        page * limit
      );

    return {
      stories,

      personalization: {
        topicPreferenceCount:
          preferences.length,

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

    const trendingStories =
      eligibleStories
        .map((story) => {
          const publishedTime =
            new Date(
              story.publishedAt ||
                story.createdAt
            ).getTime();

          // ----------------------------------------------------
          // Story age in hours.
          // ----------------------------------------------------

          const ageHours =
            Math.max(
              (now - publishedTime) /
                (1000 * 60 * 60),
              0
            );

          // ----------------------------------------------------
          // Recency decay.
          //
          // 0 hours  -> 1.00
          // 24 hours -> 0.50
          // 48 hours -> ~0.33
          // ----------------------------------------------------

          const recencyMultiplier =
            1 /
            (1 + ageHours / 24);

          // ----------------------------------------------------
          // Popularity.
          // ----------------------------------------------------

          const popularityScore =
            Math.min(
              Math.max(
                story.points || 0,
                0
              ),
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

              recencyMultiplier:
                Number(
                  recencyMultiplier.toFixed(3)
                )
            }
          };
        })

        // ------------------------------------------------------
        // Highest trending score first.
        // ------------------------------------------------------

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
              b.publishedAt ||
                b.createdAt
            ) -
            new Date(
              a.publishedAt ||
                a.createdAt
            )
          );
        });

    // ----------------------------------------------------------
    // CLUSTER DIVERSIFICATION
    // ----------------------------------------------------------

    const diversifiedTrending =
      diversifyByCluster(
        trendingStories
      );

    const total =
      diversifiedTrending.length;

    const stories =
      diversifiedTrending.slice(
        (page - 1) * limit,
        page * limit
      );

    return {
      stories,

      personalization: {
        topicPreferenceCount:
          preferences.length,

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

  const scoredStories =
    eligibleStories
      .map((story) => {
        // ------------------------------------------------------
        // TOPIC SCORE
        // ------------------------------------------------------

        const topicScore =
          story.storyTopics.reduce(
            (score, { topicId }) => {
              return (
                score +
                (
                  preferenceByTopic.get(
                    topicId
                  ) || 0
                )
              );
            },
            0
          );

        // ------------------------------------------------------
        // SOURCE SCORE
        // ------------------------------------------------------

        const sourceScore =
          preferenceBySource.get(
            story.sourceId
          ) || 0;

        // ------------------------------------------------------
        // POPULARITY SCORE
        // ------------------------------------------------------

        const popularityScore =
          Math.min(
            Math.max(
              story.points || 0,
              0
            ),
            1000
          ) / 1000;

        // ------------------------------------------------------
        // FINAL RELEVANCE SCORE
        // ------------------------------------------------------

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

            popularityScore:
              Number(
                popularityScore.toFixed(3)
              )
          },

          relevanceScore:
            Number(
              relevanceScore.toFixed(3)
            )
        };
      })

      // --------------------------------------------------------
      // Don't recommend strongly negative stories.
      // --------------------------------------------------------

      .filter(
        (story) =>
          story.relevanceScore >= 0
      )

      // --------------------------------------------------------
      // Highest relevance first.
      // --------------------------------------------------------

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
            b.publishedAt ||
              b.createdAt
          ) -
          new Date(
            a.publishedAt ||
              a.createdAt
          )
        );
      });

  // ============================================================
  // CLUSTER-AWARE DIMINISHING RETURNS
  // ============================================================

  const clusterAdjustedStories =
    applyClusterDiminishingReturns(
      scoredStories
    );

  // ------------------------------------------------------------
  // Re-sort after applying diminishing returns.
  // ------------------------------------------------------------

  const rerankedStories =
    clusterAdjustedStories.sort(
      (a, b) => {
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
            b.publishedAt ||
              b.createdAt
          ) -
          new Date(
            a.publishedAt ||
              a.createdAt
          )
        );
      }
    );

  // ============================================================
  // CLUSTER-AWARE DIVERSIFICATION
  //
  // IMPORTANT:
  // This does NOT remove duplicate cluster stories.
  //
  // It spreads them throughout the feed.
  // ============================================================

  const diversifiedStories =
    diversifyByCluster(
      rerankedStories
    );

  // ============================================================
  // PAGINATION
  // ============================================================

  const total =
    diversifiedStories.length;

  const stories =
    diversifiedStories.slice(
      (page - 1) * limit,
      page * limit
    );

  // ============================================================
  // RESPONSE
  // ============================================================

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

// ============================================================
// READING HISTORY
// ============================================================

const recordReading = async ({
  userId,
  storyId,
  durationSeconds,
  completed
}) => {
  const story =
    await prisma.story.findUnique({
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
    throw new AppError(
      "Story not found",
      404
    );
  }

  // Completing a story is a stronger signal than simply
  // opening it.
  //
  // A short read does not change recommendations, preventing
  // accidental taps from distorting the feed.

  const affinityDelta =
    completed
      ? 2
      : durationSeconds >= 30
        ? 1
        : 0;

  await prisma.$transaction(
    async (transaction) => {
      await transaction.readingHistory.create({
        data: {
          userId,
          storyId,
          durationSeconds,
          completed
        }
      });

      if (!affinityDelta) {
        return;
      }

      for (const { topicId } of story.storyTopics) {
        const current =
          await transaction.userPreference.findUnique({
            where: {
              userId_topicId: {
                userId,
                topicId
              }
            }
          });

        const preference =
          Math.min(
            5,
            (current?.preference || 0) +
              affinityDelta
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
    }
  );

  return {
    recorded: true,
    affinityDelta,
    topicCount:
      story.storyTopics.length
  };
};

// ============================================================
// TOPIC FOLLOW
// ============================================================

const followTopic = async ({
  userId,
  topicId
}) => {
  const topic =
    await prisma.topic.findUnique({
      where: {
        id: topicId
      }
    });

  if (!topic) {
    throw new AppError(
      "Topic not found",
      404
    );
  }

  const preference =
    await prisma.userPreference.upsert({
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

const unfollowTopic = async ({
  userId,
  topicId
}) => {
  const topic =
    await prisma.topic.findUnique({
      where: {
        id: topicId
      }
    });

  if (!topic) {
    throw new AppError(
      "Topic not found",
      404
    );
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

// ============================================================
// SOURCE PREFERENCES
// ============================================================

const getSourcePreferences = async (
  userId
) => {
  return prisma.userSourcePreference.findMany({
    where: {
      userId
    },

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

const followSource = async ({
  userId,
  sourceId
}) => {
  const source =
    await prisma.sources.findUnique({
      where: {
        id: sourceId
      }
    });

  if (!source) {
    throw new AppError(
      "Source not found",
      404
    );
  }

  const preference =
    await prisma.userSourcePreference.upsert({
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

const unfollowSource = async ({
  userId,
  sourceId
}) => {
  const source =
    await prisma.sources.findUnique({
      where: {
        id: sourceId
      }
    });

  if (!source) {
    throw new AppError(
      "Source not found",
      404
    );
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

// ============================================================
// STORY FEEDBACK
// ============================================================

const setStoryFeedback = async ({
  userId,
  storyId,
  feedback
}) => {
  const story =
    await prisma.story.findUnique({
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
    throw new AppError(
      "Story not found",
      404
    );
  }

  const existingFeedback =
    await prisma.storyFeedback.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

  // Convert feedback into its recommendation signal.
  const signal =
    feedback === "LIKE"
      ? 1
      : -1;

  const previousSignal =
    existingFeedback
      ? existingFeedback.feedback === "LIKE"
        ? 1
        : -1
      : 0;

  const preferenceDelta =
    signal - previousSignal;

  await prisma.$transaction(
    async (transaction) => {
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
        const current =
          await transaction.userPreference.findUnique({
            where: {
              userId_topicId: {
                userId,
                topicId
              }
            }
          });

        const currentPreference =
          current?.preference || 0;

        const preference =
          Math.max(
            -5,
            Math.min(
              5,
              currentPreference +
                preferenceDelta
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
    }
  );

  return {
    storyId,
    feedback,

    previousFeedback:
      existingFeedback?.feedback ||
      null,

    preferenceDelta,

    topicCount:
      story.storyTopics.length
  };
};

const getStoryFeedback = async ({
  userId,
  storyId
}) => {
  const story =
    await prisma.story.findUnique({
      where: {
        id: storyId
      },

      select: {
        id: true
      }
    });

  if (!story) {
    throw new AppError(
      "Story not found",
      404
    );
  }

  const feedback =
    await prisma.storyFeedback.findUnique({
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
  const existingFeedback =
    await prisma.storyFeedback.findUnique({
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

  const story =
    await prisma.story.findUnique({
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
    throw new AppError(
      "Story not found",
      404
    );
  }

  // Removing LIKE removes +1.
  // Removing DISLIKE removes -1, therefore +1.

  const preferenceDelta =
    existingFeedback.feedback === "LIKE"
      ? -1
      : 1;

  await prisma.$transaction(
    async (transaction) => {
      await transaction.storyFeedback.delete({
        where: {
          userId_storyId: {
            userId,
            storyId
          }
        }
      });

      for (const { topicId } of story.storyTopics) {
        const current =
          await transaction.userPreference.findUnique({
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

        const preference =
          Math.max(
            -5,
            Math.min(
              5,
              current.preference +
                preferenceDelta
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
    }
  );

  return {
    removed: true,
    storyId,

    previousFeedback:
      existingFeedback.feedback,

    preferenceDelta,

    topicCount:
      story.storyTopics.length
  };
};

// ============================================================
// STORY SKIP
// ============================================================

const skipStory = async ({
  userId,
  storyId
}) => {
  // ----------------------------------------------------------
  // 1. Make sure the story exists
  // ----------------------------------------------------------

  const story =
    await prisma.story.findUnique({
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
    throw new AppError(
      "Story not found",
      404
    );
  }

  // ----------------------------------------------------------
  // 2. Check whether the story was already skipped
  // ----------------------------------------------------------

  const existingSkip =
    await prisma.storySkip.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

  // Already skipped → do nothing.

  if (existingSkip) {
    return {
      skipped: true,
      storyId,
      alreadySkipped: true,
      preferenceDelta: 0,
      topicCount:
        story.storyTopics.length
    };
  }

  // ----------------------------------------------------------
  // 3. Skip signal
  //
  // A skip is a negative recommendation signal.
  // ----------------------------------------------------------

  const preferenceDelta = -1;

  // ----------------------------------------------------------
  // 4. Store skip + update topic preferences atomically
  // ----------------------------------------------------------

  await prisma.$transaction(
    async (transaction) => {
      await transaction.storySkip.create({
        data: {
          userId,
          storyId
        }
      });

      for (const { topicId } of story.storyTopics) {
        const current =
          await transaction.userPreference.findUnique({
            where: {
              userId_topicId: {
                userId,
                topicId
              }
            }
          });

        const preference =
          Math.max(
            -5,
            (current?.preference || 0) +
              preferenceDelta
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
    }
  );

  return {
    skipped: true,
    storyId,
    alreadySkipped: false,
    preferenceDelta,

    topicCount:
      story.storyTopics.length
  };
};

const getStorySkip = async ({
  userId,
  storyId
}) => {
  const story =
    await prisma.story.findUnique({
      where: {
        id: storyId
      },

      select: {
        id: true
      }
    });

  if (!story) {
    throw new AppError(
      "Story not found",
      404
    );
  }

  const skip =
    await prisma.storySkip.findUnique({
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
  const existingSkip =
    await prisma.storySkip.findUnique({
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

  const story =
    await prisma.story.findUnique({
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
    throw new AppError(
      "Story not found",
      404
    );
  }

  // Removing a -1 skip restores +1.

  const preferenceDelta = 1;

  await prisma.$transaction(
    async (transaction) => {
      await transaction.storySkip.delete({
        where: {
          userId_storyId: {
            userId,
            storyId
          }
        }
      });

      for (const { topicId } of story.storyTopics) {
        const current =
          await transaction.userPreference.findUnique({
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

        const preference =
          Math.min(
            5,
            current.preference +
              preferenceDelta
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
    }
  );

  return {
    removed: true,
    storyId,
    preferenceDelta,

    topicCount:
      story.storyTopics.length
  };
};

// ============================================================
// EXPORTS
// ============================================================

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

  skipStory,
  getStorySkip,
  removeStorySkip,

  // Cluster-aware feed helpers
  diversifyByCluster,
  applyClusterDiminishingReturns
};