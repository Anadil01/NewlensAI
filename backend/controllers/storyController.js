const scrapeStories = require("../services/scraperService");

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const ApiResponse = require("../utils/ApiResponse");

const bookmarkService = require("../services/bookmarkService");
const storyService = require("../services/storyService");

exports.getStories = asyncHandler(
  async (req, res) => {
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

    const search =
      req.query.search?.trim() || "";

    const result =
      await storyService.getStories({
        page,
        limit,
        search
      });

    return ApiResponse.success(
      res,
      result,
      "Stories fetched successfully"
    );
  }
);



exports.getSingleStory = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const story =
      await storyService.getSingleStory(id);

    return ApiResponse.success(
      res,
      story,
      "Story fetched successfully"
    );
  }
);

exports.triggerScrape = asyncHandler(async (req, res) => {
  const result = await scrapeStories();

console.log(
  `Scrape completed: ${result.inserted} inserted, ${result.skipped} skipped`
);
 
  return ApiResponse.success(
    res,
    null,
    "Scraping completed successfully"
  );
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const result = await bookmarkService.toggleBookmark(
    req.user,
    req.params.id
  );

  return ApiResponse.success(
    res,
    result,
    result.bookmarked
      ? "Bookmark added"
      : "Bookmark removed"
  );
});

exports.getBookmarks = asyncHandler(async (req, res) => {
  const result = await bookmarkService.getBookmarks(
    req.user
  );

  return ApiResponse.success(
    res,
    result,
    "Bookmarks fetched successfully"
  );
});