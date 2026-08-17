const redisClient = require("./utils/redis");
const {
  getCache,
  setCache,
  deleteCache,
  existsCache
} = require("./utils/cache");

const testCache = async () => {
  try {
    await redisClient.connect();

    const key = "newslens:test-cache";

    const data = {
      message: "Cache is working",
      timestamp: new Date().toISOString()
    };

    await setCache(key, data, 60);

    console.log("Cache set:", data);

    console.log(
      "Cache exists:",
      await existsCache(key)
    );

    const cachedData = await getCache(key);

    console.log(
      "Cache retrieved:",
      cachedData
    );

    await deleteCache(key);

    console.log(
      "Cache exists after delete:",
      await existsCache(key)
    );

    await redisClient.quit();
  } catch (error) {
    console.error("Cache test failed:", error);
    process.exit(1);
  }
};

testCache();