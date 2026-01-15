const { Worker } = require("bullmq");
const axios = require("axios");
const db = require("../db");
const sign = require("../utils/webhookSignature");
const retryDelay = require("../utils/retrySchedule");

new Worker("webhooks", async (job) => {
  const { merchantId, event, payload } = job.data;

  const merchant = (await db.query(
    "SELECT * FROM merchants WHERE id=$1",
    [merchantId]
  )).rows[0];

  if (!merchant.webhook_url) return;

  const body = JSON.stringify({
    event,
    timestamp: Math.floor(Date.now() / 1000),
    data: payload,
  });

  const signature = sign(body, merchant.webhook_secret);

  try {
    await axios.post(merchant.webhook_url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      timeout: 5000,
    });
  } catch (e) {
    throw e;
  }
});
