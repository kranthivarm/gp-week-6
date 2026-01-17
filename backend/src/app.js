const express = require("express");
const cors = require("cors");
const app = express();
/* ✅ CORS MUST be before routes */
app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:3002"],
  credentials: true
}));


app.use(express.json());

app.use("/api/v1/orders", require("./routes/orders.routes")); 
app.use("/api/v1/payments", require("./routes/payments.routes"));
// app.use("/api/v1/payments/:id/refunds", require("./routes/refunds.routes"));
app.use("/api/v1/refunds", require("./routes/refunds.routes"));
app.use("/api/v1/webhooks", require("./routes/webhooks.routes"));
app.use("/api/v1/test", require("./routes/test.routes"));
// Health check route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = app;
