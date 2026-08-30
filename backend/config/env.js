require("dotenv").config();

const requiredEnv = [
  "JWT_SECRET",
  "REDIS_URL"
];


for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12);

if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 14) {
  throw new Error("BCRYPT_ROUNDS must be an integer between 10 and 14");
}

try {
  const redisUrl = new URL(process.env.REDIS_URL);
  if (!['redis:', 'rediss:'].includes(redisUrl.protocol)) {
    throw new Error("unsupported protocol");
  }
} catch {
  throw new Error("REDIS_URL must be a valid redis:// or rediss:// URL");
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,
  jwtSecret: process.env.JWT_SECRET,
  jwtIssuer: process.env.JWT_ISSUER || "newslens-api",
  jwtAudience: process.env.JWT_AUDIENCE || "newslens-web",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL,
  elasticsearchUrl: process.env.ELASTICSEARCH_URL,
  bcryptRounds,
};


module.exports = config;
