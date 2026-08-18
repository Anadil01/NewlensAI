require("dotenv").config();

const requiredEnv = [
  "JWT_SECRET"
];


for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL,
  elasticsearchUrl: process.env.ELASTICSEARCH_URL,
};


module.exports = config;
