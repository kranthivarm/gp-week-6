const router = require("express").Router();
const { QueueEvents } = require("bullmq");
const redis = require("../redis");

// router.get("/jobs/status", async (req, res) => {
//   res.json({
//     pending: 0,
//     processing: 1,
//     completed: 100,
//     failed: 0,
//     worker_status: "running",
//   });
// });
router.get("/jobs/status", async (req, res) => {
  const paymentQueue = require("../queues/payment.queue");
  const webhookQueue = require("../queues/webhook.queue");
  const refundQueue = require("../queues/refund.queue");
  
  const [
    paymentPending,
    paymentActive,
    paymentCompleted,
    paymentFailed,
    webhookPending,
    webhookActive,
    refundPending,
    refundActive
  ] = await Promise.all([
    paymentQueue.getWaitingCount(),
    paymentQueue.getActiveCount(),
    paymentQueue.getCompletedCount(),
    paymentQueue.getFailedCount(),
    webhookQueue.getWaitingCount(),
    webhookQueue.getActiveCount(),
    refundQueue.getWaitingCount(),
    refundQueue.getActiveCount()
  ]);
  
  res.json({
    pending: paymentPending + webhookPending + refundPending,
    processing: paymentActive + webhookActive + refundActive,
    completed: paymentCompleted,
    failed: paymentFailed,
    worker_status: "running"
  });
});

module.exports = router;
