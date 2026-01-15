const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");

router.get("/", auth, async (req, res) => {
  const { rows } = await db.query(
    "SELECT * FROM webhook_logs WHERE merchant_id=$1",
    [req.merchant.id]
  );
  res.json({ data: rows });
});

router.post("/:id/retry", auth, async (req, res) => {
  await db.query(
    "UPDATE webhook_logs SET status='pending', attempts=0 WHERE id=$1",
    [req.params.id]
  );

  res.json({ message: "Webhook retry scheduled" });
});

module.exports = router;
