const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const queue = require("../queues/refund.queue");
const { randomId } = require("../utils/idGenerator");

router.post("/:paymentId/refunds", auth, async (req, res) => {
  const id = randomId("rfnd_");

  await db.query(
    "INSERT INTO refunds(id,payment_id,merchant_id,amount,status) VALUES($1,$2,$3,$4,'pending')",
    [id, req.params.paymentId, req.merchant.id, req.body.amount]
  );

  await queue.add("process", { refundId: id });

  res.status(201).json({ id, status: "pending" });
});

module.exports = router;
