const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const webhookQueue = require("../queues/webhook.queue");

// router.get("/", auth, async (req, res) => {
//   const { rows } = await db.query(
//     "SELECT * FROM webhook_logs WHERE merchant_id=$1",
//     [req.merchant.id]
//   );
//   res.json({ data: rows });
// });

router.get("/", auth, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  
  const { rows } = await db.query(
    "SELECT * FROM webhook_logs WHERE merchant_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [req.merchant.id, limit, offset]
  );
  
  const { rows: [{ count }] } = await db.query(
    "SELECT COUNT(*) as count FROM webhook_logs WHERE merchant_id=$1",
    [req.merchant.id]
  );
  
  res.json({ 
    data: rows, 
    total: parseInt(count),
    limit,
    offset
  });
});

router.post("/:id/retry", auth, async (req, res) => {
//   await db.query(
//     "UPDATE webhook_logs SET status='pending', attempts=0 WHERE id=$1",
//     [req.params.id]
//   );

//   res.json({ message: "Webhook retry scheduled" });
// });


  // Get webhook log details
  const { rows } = await db.query(
    "SELECT * FROM webhook_logs WHERE id=$1 AND merchant_id=$2",
    [req.params.id, req.merchant.id]
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ error: "Webhook not found" });
  }
  
  const log = rows[0];
  
  // Reset attempts
  await db.query(
    "UPDATE webhook_logs SET status='pending', attempts=0, next_retry_at=NOW() WHERE id=$1",
    [req.params.id]
  );
  
  // Re-enqueue the webhook job
  await webhookQueue.add("deliver", {
    merchantId: log.merchant_id,
    event: log.event,
    payload: log.payload,
    webhookLogId: log.id
  });
  
  res.json({ id: req.params.id, status: "pending", message: "Webhook retry scheduled" });
});
module.exports = router;
