// backend/src/redis.js
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST ||"localhost",   
  port: Number(process.env.REDIS_PORT)||6379, 
  maxRetriesPerRequest: null,  // Required for BullMQ
  enableReadyCheck: false,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = redis;
