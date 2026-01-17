const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../db");
const { randomId } = require("../utils/idGenerator");

// Create order
router.post("/", auth, async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Invalid amount"
        }
      });
    }

    const orderId = randomId("order_");

    await db.query(
      `INSERT INTO orders(id, merchant_id, amount, currency, receipt, status, created_at)
       VALUES($1, $2, $3, $4, $5, 'created', NOW())`,
      [orderId, req.merchant.id, amount, currency, receipt]
    );

    res.status(201).json({
      id: orderId,
      amount,
      currency,
      receipt,
      status: "created",
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to create order"
      }
    });
  }
});

// Get order
router.get("/:id", auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM orders WHERE id=$1 AND merchant_id=$2",
      [req.params.id, req.merchant.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          description: "Order not found"
        }
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        description: "Failed to fetch order"
      }
    });
  }
});

module.exports = router;