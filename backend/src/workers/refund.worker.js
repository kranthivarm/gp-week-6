const { Worker } = require("bullmq");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");

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
});
