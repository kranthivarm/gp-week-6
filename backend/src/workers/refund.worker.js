const { Worker } = require("bullmq");

// const Redis = require("ioredis");
// const redisConfig = require("../config/redis.config");
const { createRedisConnection } = require("../config/redis.config");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");

// const connection = new Redis(redisConfig);
new Worker("refunds", async (job) => {
  const { refundId } = job.data;

  const { rows } = await db.query(
    "SELECT * FROM refunds WHERE id=$1",
    [refundId]
  );
  const refund = rows[0];

  await new Promise(r => setTimeout(r, 3000));

  await db.query(
    "UPDATE refunds SET status='processed', processed_at=NOW() WHERE id=$1",
    [refundId]
  );

  await webhookQueue.add("deliver", {
    merchantId: refund.merchant_id,
    event: "refund.processed",
    payload: { refund },
  });
} , 
// { connection: require("../redis") }
{ connection: createRedisConnection() }
);


worker.on("completed", (job) => {
  console.log(`Refund job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Refund job ${job.id} failed:`, err.message);
});

console.log("Refund worker started");

module.exports = worker;