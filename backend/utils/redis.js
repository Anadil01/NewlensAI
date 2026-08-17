const { createClient } = require("redis");

const config = require("../config/env");

const redisClient = createClient({
  url: config.redisUrl
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

module.exports = {
  redisClient,
  connectRedis
};