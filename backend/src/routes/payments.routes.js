// const router = require("express").Router();
// const auth = require("../middleware/auth");
// const db = require("../db");
// const queue = require("../queues/payment.queue");
// const { randomId } = require("../utils/idGenerator");

// router.post("/", auth, async (req, res) => {

//   const idempotencyKey = req.header("Idempotency-Key");
  
//   // Check for existing idempotency key BEFORE any DB operations
//   if (idempotencyKey) {
//     const { rows } = await db.query(
//       "SELECT * FROM idempotency_keys WHERE key=$1 AND merchant_id=$2 AND expires_at > NOW()",
//       [idempotencyKey, req.merchant.id]
//     );
    
//     if (rows.length > 0) {
//       // Return cached response
//       return res.status(201).json(rows[0].response);
//     }
//   }
//   const id = randomId("pay_");

//   // await db.query(
//   //   "INSERT INTO payments(id, merchant_id, status) VALUES($1,$2,'pending')",
//   //   [id, req.merchant.id]
//   // );

//   // await queue.add("process", { paymentId: id });

//   const { order_id, method, vpa, amount, currency } = req.body;

//   // Validate required fields first
//   if (!order_id || !method || !amount || !currency) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   await db.query(
//     `INSERT INTO payments(id, merchant_id, order_id, amount, currency, method, vpa, status, created_at) 
//     VALUES($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())`,
//     [id, req.merchant.id, order_id, amount, currency, method, vpa]
//   );

//   if (idempotencyKey) {
//     await db.query(
//       `INSERT INTO idempotency_keys(key, merchant_id, response, created_at, expires_at) 
//        VALUES($1, $2, $3, NOW(), NOW() + INTERVAL '24 hours')`,
//       [idempotencyKey, req.merchant.id, JSON.stringify(responseData)]
//     );
//   }
//   // res.status(201).json({ id, status: "pending" });

//   res.status(201).json({
//     id,
//     order_id,
//     amount,
//     currency,
//     method,
//     vpa,
//     status: "pending",
//     created_at: new Date().toISOString()
//   });
// });

// module.exports = router;
const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const queue = require("../queues/payment.queue");
const { randomId } = require("../utils/idGenerator");

// Create payment
router.post("/", auth, async (req, res) => {
  try {
    const idempotencyKey = req.header("Idempotency-Key");

    // Check idempotency key BEFORE any operations
    if (idempotencyKey) {
      const { rows } = await db.query(
        "SELECT response FROM idempotency_keys WHERE key=$1 AND merchant_id=$2 AND expires_at > NOW()",
        [idempotencyKey, req.merchant.id]
      );

      if (rows.length > 0) {
        // Return cached response
        return res.status(201).json(rows[0].response);
      }
    }

    const { order_id, method, vpa, card_number, card_expiry, card_cvv } = req.body;

    // Validate required fields
    if (!order_id || !method) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Missing required fields: order_id, method"
        }
      });
    }

    // Validate method
    if (!["upi", "card"].includes(method)) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Invalid method. Must be 'upi' or 'card'"
        }
      });
    }

    // Validate method-specific fields
    if (method === "upi" && !vpa) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "VPA is required for UPI payments"
        }
      });
    }

    if (method === "card" && (!card_number || !card_expiry || !card_cvv)) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Card details are required for card payments"
        }
      });
    }

    // Get order details
    const orderResult = await db.query(
      "SELECT * FROM orders WHERE id=$1 AND merchant_id=$2",
      [order_id, req.merchant.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          description: "Order not found"
        }
      });
    }

    const order = orderResult.rows[0];
    const paymentId = randomId("pay_");

    // Create payment
    await db.query(
      `INSERT INTO payments(id, order_id, merchant_id, amount, currency, method, vpa, card_number, card_expiry, card_cvv, status, created_at)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())`,
      [
        paymentId,
        order_id,
        req.merchant.id,
        order.amount,
        order.currency,
        method,
        method === "upi" ? vpa : null,
        method === "card" ? card_number : null,
        method === "card" ? card_expiry : null,
        method === "card" ? card_cvv : null
      ]
    );

    // Enqueue payment processing job
    await queue.add("process", { paymentId });

    // Prepare response
    const response = {
      id: paymentId,
      order_id,
      amount: order.amount,
      currency: order.currency,
      method,
      ...(method === "upi" && { vpa }),
      ...(method === "card" && { card_number, card_expiry }),
      status: "pending",
      created_at: new Date().toISOString()
    };

    // Store idempotency response
    if (idempotencyKey) {
      await db.query(
        `INSERT INTO idempotency_keys(key, merchant_id, response, created_at, expires_at)
         VALUES($1, $2, $3, NOW(), NOW() + INTERVAL '24 hours')`,
        [idempotencyKey, req.merchant.id, JSON.stringify(response)]
      );
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to create payment"
      }
    });
  }
});

// Get payment
router.get("/:id", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM payments WHERE id=$1 AND merchant_id=$2",
      [req.params.id, req.merchant.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          description: "Payment not found"
        }
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to fetch payment"
      }
    });
  }
});

// Capture payment
router.post("/:id/capture", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const { rows } = await db.query(
      "SELECT * FROM payments WHERE id=$1 AND merchant_id=$2",
      [req.params.id, req.merchant.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          description: "Payment not found"
        }
      });
    }

    const payment = rows[0];

    if (payment.status !== "success") {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Payment not in capturable state"
        }
      });
    }

    await db.query(
      "UPDATE payments SET captured=true, updated_at=NOW() WHERE id=$1",
      [req.params.id]
    );

    res.json({
      ...payment,
      captured: true,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Capture payment error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to capture payment"
      }
    });
  }
});
const refundQueue = require("../queues/refund.queue");

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
  
  await refundQueue.add("process", { refundId: id });
  
  res.status(201).json({ 
    id, 
    payment_id: req.params.paymentId,
    amount, 
    reason,
    status: "pending",
    created_at: new Date().toISOString()
  });
});

// module.exports = router;


module.exports = router;