const { redisClient, isRedisReady } = require("./redis");

const withCacheFallback = async (operation, fallback) => {
  if (!isRedisReady()) {
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    console.warn("Cache operation failed; continuing without cache:", error.message);
    return fallback;
  }
};

const getCache = async (key) => {
  const value = await withCacheFallback(() => redisClient.get(key), null);

  console.log(
    `[CACHE GET] ${key} =>`,
    value ? "HIT" : "MISS"
  );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Ignoring malformed cache value:", error.message);
    void deleteCache(key);
    return null;
  }
};

const setCache = async (
  key,
  value,
  ttlSeconds = 60
) => {
  return withCacheFallback(() => redisClient.set(
    key,
    JSON.stringify(value),
    {
      EX: ttlSeconds
    }
  ), null);
};

const deleteCache = async (key) => {
  return withCacheFallback(() => redisClient.del(key), 0);
};

const deleteCacheByPattern = async (pattern) => {
  return withCacheFallback(async () => {
    let cursor = "0";
    let deleted = 0;

    do {
      const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length > 0) {
        deleted += await redisClient.del(result.keys);
      }
    } while (cursor !== "0");

    return deleted;
  }, 0);
};

const existsCache = async (key) => {
  return withCacheFallback(() => redisClient.exists(key), 0);
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  existsCache
};
