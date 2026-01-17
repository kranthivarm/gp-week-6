const Redis = require("ioredis");

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Factory function to create new connections
function createRedisConnection() {
  return new Redis(redisConfig);
}

module.exports = {
  redisConfig,
  createRedisConnection,
};