const {
    deleteCacheByPattern
  } = require("../utils/cache");
  
  const invalidateStoryCaches = async () => {
    await deleteCacheByPattern("stories:*");
  
    console.log("Story caches invalidated");
  };
  
  module.exports = {
    invalidateStoryCaches
  };