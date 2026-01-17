const { Worker } = require("bullmq");

// const Redis = require("ioredis");
// const redisConfig = require("../config/redis.config");

const { createRedisConnection } = require("../config/redis.config");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");
// const connection = new Redis(redisConfig);

new Worker(
  "payments",
  async (job) => {
    const { paymentId } = job.data;
    console.log(`Processing payment: ${paymentId}`);

    const { rows } = await db.query(
      "SELECT * FROM payments WHERE id=$1",
      [paymentId]
    );
    const payment = rows[0];
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }
    // await new Promise(r => setTimeout(r, process.env.TEST_MODE === "true" ? 1000 : 5000));

    // const success =
    //   process.env.TEST_MODE === "true"
    //     ? true
    //     : Math.random() < (payment.method === "upi" ? 0.9 : 0.95);

    // Determine delay
    let delay;
    if (process.env.TEST_MODE === "true") {
      delay = parseInt(process.env.TEST_PROCESSING_DELAY || "1000");
    } else {
      delay = 5000 + Math.floor(Math.random() * 5000); // Random 5000-10000
    }
    await new Promise(r => setTimeout(r, delay));

    // Determine success
    let success;
    if (process.env.TEST_MODE === "true") {
      success = process.env.TEST_PAYMENT_SUCCESS !== "false"; // Default true
    } else {
      success = Math.random() < (payment.method === "upi" ? 0.9 : 0.95);
    }


    // await db.query(
    //   "UPDATE payments SET status=$1 WHERE id=$2",
    //   [success ? "success" : "failed", paymentId]
    // );
    if (success) {
      await db.query(
        "UPDATE payments SET status='success' WHERE id=$1",
        [paymentId]
      );
      console.log(`✅ Payment ${paymentId} succeeded`);
    } else {
      await db.query(
        "UPDATE payments SET status='failed', error_code='PAYMENT_FAILED', error_description='Payment processing failed' WHERE id=$1",
        [paymentId]
      );
    }

    
    await webhookQueue.add("deliver", {
      merchantId: payment.merchant_id,
      event: success ? "payment.success" : "payment.failed",
      payload: { payment },
    });
  },
  // { connection: require("../redis") }
  { connection: createRedisConnection() }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

console.log("Payment worker started");

module.exports = worker;