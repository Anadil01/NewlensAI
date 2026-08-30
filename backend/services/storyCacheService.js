const {
    deleteCacheByPattern
  } = require("../utils/cache");
  
const invalidateStoryCaches = async () => {
  const deleted = await deleteCacheByPattern("stories:*");

  console.log(`Story caches invalidated (${deleted} keys)`);

  return deleted;
};

module.exports = {
  invalidateStoryCaches
};
