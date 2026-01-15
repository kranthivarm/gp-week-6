const { Worker } = require("bullmq");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");

new Worker(
  "payments",
  async (job) => {
    const { paymentId } = job.data;

    const { rows } = await db.query(
      "SELECT * FROM payments WHERE id=$1",
      [paymentId]
    );
    const payment = rows[0];

    await new Promise(r => setTimeout(r, process.env.TEST_MODE === "true" ? 1000 : 5000));

    const success =
      process.env.TEST_MODE === "true"
        ? true
        : Math.random() < (payment.method === "upi" ? 0.9 : 0.95);

    await db.query(
      "UPDATE payments SET status=$1 WHERE id=$2",
      [success ? "success" : "failed", paymentId]
    );

    await webhookQueue.add("deliver", {
      merchantId: payment.merchant_id,
      event: success ? "payment.success" : "payment.failed",
      payload: { payment },
    });
  },
  { connection: require("../redis") }
);
