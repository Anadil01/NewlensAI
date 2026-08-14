const Story = require("../models/Story");
const AppError = require("../utils/AppError");

const getStories = async ({
    page = 1,
    limit = 6,
    search = ""
  }) => {
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
    const story = await Story.findById(id);
  
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