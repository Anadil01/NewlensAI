const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const {
  getCache,
  setCache,
  deleteCache
} = require("../utils/cache");

const buildStoriesCacheKey = ({
  page,
  limit,
  search
}) => {
  return `stories:page:${page}:limit:${limit}:search:${search}`;
};

const getStories = async ({
  page = 1,
  limit = 6,
  search = ""
}) => {
  const cacheKey = buildStoriesCacheKey({
    page,
    limit,
    search
  });

  const cachedResult = await getCache(cacheKey);

  if (cachedResult) {
    console.log("Stories cache HIT:", cacheKey);
    return cachedResult;
  }

  console.log("Stories cache MISS:", cacheKey);

  const where = search
    ? {
        OR: [
          {
            title: {
              contains: search,
              mode: "insensitive"
            }
          },
          {
            author: {
              contains: search,
              mode: "insensitive"
            }
          }
        ]
      }
    : {};

  const total = await prisma.story.count({
    where
  });

  const stories = await prisma.story.findMany({
    where,
    orderBy: [
      {
        points: "desc"
      },
      {
        id: "asc"
      }
    ],
    skip: (page - 1) * limit,
    take: limit
  });

  const result = {
    stories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(
        Math.ceil(total / limit),
        1
      ),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };

  await setCache(
    cacheKey,
    result,
    60
  );

  return result;
};



const getSingleStory = async (id) => {
  const story = await prisma.story.findUnique({
    where: {
      id
    }
  });

  if (!story) {
    throw new AppError(
      "Story not found",
      404
    );
  }

  return story;
};

module.exports = {
  getStories,
  getSingleStory
};