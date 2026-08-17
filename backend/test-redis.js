const redisClient = require("./utils/redis");

const testRedis = async () => {
  try {
    await redisClient.connect();

    console.log("Redis connection successful");

    await redisClient.set(
      "newslens:test",
      "Redis is working"
    );

    const value = await redisClient.get(
      "newslens:test"
    );

    console.log("Redis value:", value);

    await redisClient.del("newslens:test");

    await redisClient.quit();

    console.log("Redis connection closed");
  } catch (error) {
    console.error(
      "Redis connection failed:",
      error
    );

    process.exit(1);
  }
};

testRedis();