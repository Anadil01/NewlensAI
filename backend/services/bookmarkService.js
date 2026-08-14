const User = require("../models/User");
const Story = require("../models/Story");
const AppError = require("../utils/AppError");

const toggleBookmark = async (userId, storyId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const storyExists = await Story.exists({
    _id: storyId
  });

  if (!storyExists) {
    throw new AppError("Story not found", 404);
  }

  const alreadyBookmarked = user.bookmarks.some(
    (id) => id.toString() === storyId.toString()
  );

  if (alreadyBookmarked) {
    user.bookmarks = user.bookmarks.filter(
      (id) => id.toString() !== storyId.toString()
    );
  } else {
    user.bookmarks.push(storyId);
  }

  await user.save();

  return {
    bookmarks: user.bookmarks,
    bookmarked: !alreadyBookmarked
  };
};

const getBookmarks = async (userId) => {
    const user = await User.findById(userId)
      .populate("bookmarks");
  
    if (!user) {
      throw new AppError("User not found", 404);
    }
  
    return {
      bookmarks: user.bookmarks
    };
  };


module.exports = {
  toggleBookmark,
  getBookmarks
};