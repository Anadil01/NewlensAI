const Story = require("../models/Story");
const User = require("../models/User");
const scrapeStories = require("../services/scraperService");

exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .sort({ points: -1 });

    res.json(stories);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getSingleStory = async (req, res) => {
  try {
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

    const alreadyBookmarked =
      user.bookmarks.includes(storyId);

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

    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};