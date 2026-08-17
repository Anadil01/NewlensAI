const { redisClient } = require("./redis");

const getCache = async (key) => {
  const value = await redisClient.get(key);

  console.log(
    `[CACHE GET] ${key} =>`,
    value ? "HIT" : "MISS"
  );

  if (!value) {
    return null;
  }

  return JSON.parse(value);
};

const setCache = async (
  key,
  value,
  ttlSeconds = 60
) => {
  console.log(`[CACHE SET] ${key}`);

  const result = await redisClient.set(
    key,
    JSON.stringify(value),
    {
      EX: ttlSeconds
    }
  );

  console.log(
    `[CACHE SET RESULT] ${key} =>`,
    result
  );

  const ttl = await redisClient.ttl(key);

  console.log(
    `[CACHE TTL] ${key} =>`,
    ttl
  );
};

const deleteCache = async (key) => {
  const result = await redisClient.del(key);

  console.log(
    `[CACHE DELETE] ${key} =>`,
    result
  );
};

const deleteCacheByPattern = async (pattern) => {
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100
    });

    cursor = result.cursor;

    if (result.keys.length > 0) {
      await redisClient.del(result.keys);
    }
  } while (cursor !== "0");
};

const existsCache = async (key) => {
  return redisClient.exists(key);
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern,
  existsCache
};