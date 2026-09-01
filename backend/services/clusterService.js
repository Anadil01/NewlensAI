const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const getClusters = async ({ page = 1, limit = 10 }) => {
  const where = {
    stories: {
      some: {}
    }
  };

  const [total, clusters] = await prisma.$transaction([
    prisma.storyCluster.count({ where }),

    prisma.storyCluster.findMany({
      where,

      orderBy: {
        updatedAt: "desc"
      },

      skip: (page - 1) * limit,
      take: limit,

      include: {
        _count: {
          select: {
            stories: true
          }
        },

        stories: {
          orderBy: [
            { publishedAt: "desc" },
            { createdAt: "desc" }
          ],

          select: {
            id: true,
            title: true,
            excerpt: true,
            publishedAt: true,

            source: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    })
  ]);

  const formattedClusters = clusters.map((cluster) => {
    const representativeStory =
      cluster.stories[0] || null;

    const sourceCount =
      new Set(
        cluster.stories.map(
          (story) => story.source.id
        )
      ).size;

    return {
      id: cluster.id,

      title: cluster.title,

      description: cluster.description,

      storyCount:
        cluster._count.stories,

      sourceCount,

      latestPublishedAt:
        representativeStory?.publishedAt || null,

      representativeStory,

      createdAt:
        cluster.createdAt,

      updatedAt:
        cluster.updatedAt
    };
  });

  return {
    clusters: formattedClusters,

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

const getCluster = async (clusterId) => {
  const cluster = await prisma.storyCluster.findUnique({
    where: { id: clusterId },
    include: {
      stories: {
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        include: {
          source: {
            select: {
              id: true, name: true, slug: true, websiteUrl: true,
              politicalLean: true, reliabilityScore: true
            }
          },
          aiSummaries: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { summary: true, entities: true, model: true, version: true, createdAt: true }
          },
          biasAnalysis: {
            select: { biasScore: true, tone: true, confidence: true, signals: true }
          },
          storyTopics: {
            include: { topic: { select: { id: true, name: true, slug: true } } }
          }
        }
      }
    }
  });

  if (!cluster) {
    throw new AppError("Story cluster not found", 404);
  }

  return {
    ...cluster,
    sourceCount: new Set(cluster.stories.map((story) => story.sourceId)).size
  };
};

const getRelatedStories = async (storyId) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: {
      id: true,
      clusterId: true
    }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  // A story without a cluster has no related cluster stories.
  if (!story.clusterId) {
    return {
      storyId,
      clusterId: null,
      stories: [],
      relatedCount: 0
    };
  }

  const stories = await prisma.story.findMany({
    where: {
      clusterId: story.clusterId,
      id: {
        not: storyId
      }
    },
    orderBy: [
      { publishedAt: "desc" },
      { createdAt: "desc" }
    ],
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
          topic: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      aiSummaries: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1,
        select: {
          summary: true,
          model: true,
          version: true,
          createdAt: true
        }
      }
    }
  });

  return {
    storyId,
    clusterId: story.clusterId,
    stories,
    relatedCount: stories.length
  };
};


module.exports = {
  getClusters,
  getCluster,
  getRelatedStories
};
