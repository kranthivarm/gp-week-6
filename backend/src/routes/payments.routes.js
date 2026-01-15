const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const queue = require("../queues/payment.queue");
const { randomId } = require("../utils/idGenerator");

router.post("/", auth, async (req, res) => {
  const id = randomId("pay_");

  await db.query(
    "INSERT INTO payments(id, merchant_id, status) VALUES($1,$2,'pending')",
    [id, req.merchant.id]
  );

  await queue.add("process", { paymentId: id });

  res.status(201).json({ id, status: "pending" });
});

module.exports = router;
