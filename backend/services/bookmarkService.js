const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const toggleBookmark = async (userId, storyId) => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify story exists
  const story = await prisma.story.findUnique({
    where: {
      id: storyId
    }
  });

  if (!story) {
    throw new AppError("Story not found", 404);
  }

  // Check whether bookmark already exists
  const existingBookmark =
    await prisma.bookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

  // Remove bookmark
  if (existingBookmark) {
    await prisma.bookmark.delete({
      where: {
        id: existingBookmark.id
      }
    });

    return {
      bookmarked: false
    };
  }

  // Add bookmark
  await prisma.bookmark.create({
    data: {
      userId,
      storyId
    }
  });

  return {
    bookmarked: true
  };
};

const getBookmarks = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId
    },
    include: {
      story: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    bookmarks
  };
};

module.exports = {
  toggleBookmark,
  getBookmarks
};