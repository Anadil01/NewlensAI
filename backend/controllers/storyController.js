const Story = require("../models/Story");
const User = require("../models/User");
const scrapeStories = require("../services/scraperService");

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

exports.getStories = asyncHandler(async (req, res) => {
  const page = Math.max(
    parseInt(req.query.page, 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(req.query.limit, 10) || 6,
      1
    ),
    24
  );

  const search = req.query.search?.trim() || "";

  const query = search
    ? {
        $or: [
          {
            title: {
              $regex: search,
              $options: "i"
            }
          },
          {
            author: {
              $regex: search,
              $options: "i"
            }
          }
        ]
      }
    : {};

  const total = await Story.countDocuments(query);

  const stories = await Story.find(query)
    .sort({ points: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
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
  });
});

exports.getSingleStory = asyncHandler( async (req, res) => {
  const { id } = req.params;
  
    const story = await Story.findById(id);

    if (!story) {
      throw new AppError("Story not found", 404);
    }

    res.json(story);
 
  
});

exports.triggerScrape = asyncHandler(async (req, res) => {
  await scrapeStories();

  res.json({
    message: "Scraping completed successfully"
  });
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user);
  const storyId = req.params.id;

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const storyExists = await Story.exists({ _id: storyId });

  if (!storyExists) {
    throw new AppError("Story not found", 404);
  }

  const alreadyBookmarked = user.bookmarks.some(
    (id) => id.toString() === storyId
  );

  if (alreadyBookmarked) {
    user.bookmarks = user.bookmarks.filter(
      (id) => id.toString() !== storyId
    );
  } else {
    user.bookmarks.push(storyId);
  }

  await user.save();

  res.json({
    message: alreadyBookmarked
      ? "Bookmark removed"
      : "Bookmark added",
    bookmarks: user.bookmarks
  });
});

exports.getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user)
    .populate("bookmarks");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json(user.bookmarks);
});
