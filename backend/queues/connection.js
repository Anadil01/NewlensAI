const IORedis = require("ioredis");

const config = require("../config/env");

const connection = new IORedis(
  config.redisUrl,
  {
    maxRetriesPerRequest: null,
    connectTimeout: 5000,
    retryStrategy: (retries) => {
      if (retries > 10) {
        return null;
      }

      return Math.min(retries * 100, 1000);
    }
  }
);

connection.on("connect", () => {
  console.log("BullMQ Redis connecting...");
});

connection.on("ready", () => {
  console.log("BullMQ Redis ready");
});

connection.on("error", (error) => {
  console.error(
    "BullMQ Redis error:",
    error
  );
});

module.exports = connection;
