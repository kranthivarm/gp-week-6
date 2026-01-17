const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const queue = require("../queues/refund.queue");
const { randomId } = require("../utils/idGenerator");

// router.post("/:paymentId/refunds", auth, async (req, res) => {
//   const id = randomId("rfnd_");

//   await db.query(
//     "INSERT INTO refunds(id,payment_id,merchant_id,amount,status) VALUES($1,$2,$3,$4,'pending')",
//     [id, req.params.paymentId, req.merchant.id, req.body.amount]
//   );

//   await queue.add("process", { refundId: id });

//   res.status(201).json({ id, status: "pending" });
// });

router.post("/:paymentId/refunds", auth, async (req, res) => {
  const { amount, reason } = req.body;
  
  // 1. Get payment and verify ownership
  const paymentResult = await db.query(
    "SELECT * FROM payments WHERE id=$1 AND merchant_id=$2",
    [req.params.paymentId, req.merchant.id]
  );
  
  if (paymentResult.rows.length === 0) {
    return res.status(404).json({ error: "Payment not found" });
  }
  
  const payment = paymentResult.rows[0];
  
  // 2. Check payment status
  if (payment.status !== 'success') {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Payment not in refundable state"
      }
    });
  }
  
  // 3. Calculate total refunded (both pending and processed)
  const refundTotal = await db.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE payment_id=$1 AND status IN ('pending', 'processed')",
    [req.params.paymentId]
  );
  
  const totalRefunded = parseInt(refundTotal.rows[0].total);
  
  // 4. Validate refund amount
  if (amount + totalRefunded > payment.amount) {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST_ERROR",
        description: "Refund amount exceeds available amount"
      }
    });
  }
  
  // 5. Create refund
  const id = randomId("rfnd_");
  await db.query(
    `INSERT INTO refunds(id, payment_id, merchant_id, amount, reason, status, created_at) 
     VALUES($1, $2, $3, $4, $5, 'pending', NOW())`,
    [id, req.params.paymentId, req.merchant.id, amount, reason]
  );
  
  await queue.add("process", { refundId: id });
  
  res.status(201).json({ 
    id, 
    payment_id: req.params.paymentId,
    amount, 
    reason,
    status: "pending",
    created_at: new Date().toISOString()
  });
});

module.exports = router;
