const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const getStories = async ({
  page = 1,
  limit = 6,
  search = ""
}) => {
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
    orderBy: {
      points: "desc"
    },
    skip: (page - 1) * limit,
    take: limit
  });

  return {
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