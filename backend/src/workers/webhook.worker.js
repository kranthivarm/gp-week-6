const { Worker } = require("bullmq");
// const Redis = require("ioredis");
// const redisConfig = require("../config/redis.config");

const { createRedisConnection } = require("../config/redis.config");
const axios = require("axios");
const db = require("../db");
const sign = require("../utils/webhookSignature");
const retryDelay = require("../utils/retrySchedule");
// const connection = new Redis(redisConfig);

// new Worker("webhooks", async (job) => {
//   const { merchantId, event, payload } = job.data;

//   const merchant = (await db.query(
//     "SELECT * FROM merchants WHERE id=$1",
//     [merchantId]
//   )).rows[0];

//   if (!merchant.webhook_url) return;

//   const body = JSON.stringify({
//     event,
//     timestamp: Math.floor(Date.now() / 1000),
//     data: payload,
//   });

//   const signature = sign(body, merchant.webhook_secret);

//   try {
//     await axios.post(merchant.webhook_url, body, {
//       headers: {
//         "Content-Type": "application/json",
//         "X-Webhook-Signature": signature,
//       },
//       timeout: 5000,
//     });
//   } catch (e) {
//     throw e;
//   }
// });


new Worker("webhooks", async (job) => {
  const { merchantId, event, payload, webhookLogId } = job.data;

  // Fetch or create webhook log
  let logId = webhookLogId;
  if (!logId) {
    const result = await db.query(
      `INSERT INTO webhook_logs(id, merchant_id, event, payload, status, attempts, created_at) 
       VALUES(gen_random_uuid(), $1, $2, $3, 'pending', 0, NOW()) RETURNING id`,
      [merchantId, event, JSON.stringify(payload)]
    );
    logId = result.rows[0].id;
  }

  // Get current attempts
  const logResult = await db.query("SELECT attempts FROM webhook_logs WHERE id=$1", [logId]);
  const currentAttempts = logResult.rows[0].attempts + 1;

  const merchant = (await db.query("SELECT * FROM merchants WHERE id=$1", [merchantId])).rows[0];

  if (!merchant.webhook_url) {
    await db.query("UPDATE webhook_logs SET status='failed' WHERE id=$1", [logId]);
    return;
  }

  const body = JSON.stringify({ event, timestamp: Math.floor(Date.now() / 1000), data: payload });
  const signature = sign(body, merchant.webhook_secret);

  let responseCode, responseBody, success = false;

  try {
    const response = await axios.post(merchant.webhook_url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      timeout: 5000,
    });
    
    responseCode = response.status;
    responseBody = JSON.stringify(response.data);
    success = responseCode >= 200 && responseCode < 300;
  } catch (e) {
    responseCode = e.response?.status || 0;
    responseBody = e.message;
  }

  // Update webhook log
  if (success) {
    await db.query(
      `UPDATE webhook_logs SET status='success', attempts=$1, last_attempt_at=NOW(), 
       response_code=$2, response_body=$3 WHERE id=$4`,
      [currentAttempts, responseCode, responseBody, logId]
    );
  } else {
    if (currentAttempts >= 5) {
      // Permanently failed
      await db.query(
        `UPDATE webhook_logs SET status='failed', attempts=$1, last_attempt_at=NOW(), 
         response_code=$2, response_body=$3 WHERE id=$4`,
        [currentAttempts, responseCode, responseBody, logId]
      );
    } else {
      // Schedule retry
      const nextRetryDelay = retryDelay(currentAttempts + 1);
      await db.query(
        `UPDATE webhook_logs SET status='pending', attempts=$1, last_attempt_at=NOW(), 
         next_retry_at=NOW() + INTERVAL '${nextRetryDelay} milliseconds',
         response_code=$2, response_body=$3 WHERE id=$4`,
        [currentAttempts, responseCode, responseBody, logId]
      );
      
      // Re-enqueue with delay
      await webhookQueue.add("deliver", 
        { merchantId, event, payload, webhookLogId: logId },
        { delay: nextRetryDelay }
      );
    }
  }
},
//  { connection: require("../redis") }
 { connection: createRedisConnection() }
);

worker.on("completed", (job) => {
  console.log(`Webhook job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Webhook job ${job.id} failed:`, err.message);
});

console.log("Webhook worker started");

module.exports = worker;