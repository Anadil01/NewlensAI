const Story = require("../models/Story");
const User = require("../models/User");
const scrapeStories = require("../services/scraperService");
const mongoose = require("mongoose");

exports.getStories = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 6, 1),
      24
    );
    const search = req.query.search?.trim() || "";
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { author: { $regex: search, $options: "i" } }
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
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getSingleStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid story ID"
      });
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.triggerScrape = async (req, res) => {
  try {
    await scrapeStories();

    res.json({
      message: "Scraping completed successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const storyId = req.params.id;
    
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      return res.status(400).json({
        message: "Invalid story ID"
      });
    }

    const storyExists = await Story.exists({ _id: storyId });

    if (!storyExists) {
      return res.status(404).json({
        message: "Story not found"
      });
    }

    const alreadyBookmarked =
      user.bookmarks.some((id) => id.toString() === storyId);

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
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user)
      .populate("bookmarks");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
