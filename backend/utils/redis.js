const { createClient } = require("redis");

const config = require("../config/env");

const redisClient = createClient({
  url: config.redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error("Redis reconnect retry limit reached");
      }

      return Math.min(retries * 100, 1000);
    }
  }
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis ready");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

const connectRedis = async () => {
  if (redisClient.isOpen) {
    return;
  }

  await redisClient.connect();

  console.log("Redis connected successfully");
};

const isRedisReady = () => redisClient.isReady;

module.exports = {
  redisClient,
  connectRedis,
  isRedisReady
};
