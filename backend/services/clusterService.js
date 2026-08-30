const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const getClusters = async ({ page = 1, limit = 10 }) => {
  const where = { stories: { some: {} } };
  const [total, clusters] = await prisma.$transaction([
    prisma.storyCluster.count({ where }),
    prisma.storyCluster.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { stories: true } },
        stories: {
          take: 1,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            excerpt: true,
            publishedAt: true,
            source: { select: { name: true, slug: true } }
          }
        }
      }
    })
  ]);

  return {
    clusters,
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

module.exports = { getClusters, getCluster };
