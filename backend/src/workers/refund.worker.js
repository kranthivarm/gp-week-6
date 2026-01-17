// const { Worker } = require("bullmq");

// // const Redis = require("ioredis");
// // const redisConfig = require("../config/redis.config");
// const { createRedisConnection } = require("../config/redis.config");
// const db = require("../db");
// const webhookQueue = require("../queues/webhook.queue");

// // const connection = new Redis(redisConfig);
// new Worker("refunds", async (job) => {
//   const { refundId } = job.data;

//   const { rows } = await db.query(
//     "SELECT * FROM refunds WHERE id=$1",
//     [refundId]
//   );
//   const refund = rows[0];

//   await new Promise(r => setTimeout(r, 3000));

//   await db.query(
//     "UPDATE refunds SET status='processed', processed_at=NOW() WHERE id=$1",
//     [refundId]
//   );

//   await webhookQueue.add("deliver", {
//     merchantId: refund.merchant_id,
//     event: "refund.processed",
//     payload: { refund },
//   });
// } , 
// // { connection: require("../redis") }
// { connection: createRedisConnection() }
// );


// worker.on("completed", (job) => {
//   console.log(`Refund job ${job.id} completed`);
// });

// worker.on("failed", (job, err) => {
//   console.error(`Refund job ${job.id} failed:`, err.message);
// });

// console.log("Refund worker started");

// module.exports = worker;

const { Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redis.config");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");

const worker = new Worker(
  "refunds",
  async (job) => {
    const { refundId } = job.data;
    console.log(`Processing refund: ${refundId}`);

    const { rows } = await db.query("SELECT * FROM refunds WHERE id=$1", [refundId]);
    const refund = rows[0];

    if (!refund) {
      throw new Error(`Refund ${refundId} not found`);
    }

    const delay = 3000 + Math.floor(Math.random() * 2000);
    await new Promise(r => setTimeout(r, delay));

    await db.query("UPDATE refunds SET status='processed', processed_at=NOW() WHERE id=$1", [refundId]);
    console.log(`✅ Refund ${refundId} processed`);

    await webhookQueue.add("deliver", {
      merchantId: refund.merchant_id,
      event: "refund.processed",
      payload: { refund: { ...refund, status: "processed", processed_at: new Date() } },
    });
  },
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