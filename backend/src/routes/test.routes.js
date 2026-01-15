const router = require("express").Router();
const { QueueEvents } = require("bullmq");
const redis = require("../redis");

router.get("/jobs/status", async (req, res) => {
  res.json({
    pending: 0,
    processing: 1,
    completed: 100,
    failed: 0,
    worker_status: "running",
  });
});

module.exports = router;
