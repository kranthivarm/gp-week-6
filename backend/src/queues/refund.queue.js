// const { Queue } = require("bullmq");
// // const redis = require("../redis");
// const Redis = require("ioredis");

// const connection = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT) || 6379,
//   maxRetriesPerRequest: null,
//   enableReadyCheck: false,
// });

// module.exports = new Queue("refunds", { connection: redis });

const { Queue } = require("bullmq");
const { createRedisConnection } = require("../config/redis.config");

module.exports = new Queue("refunds", { 
  connection: createRedisConnection() 
});