const express = require("express");
const app = express();

app.use(express.json());

app.use("/api/v1/orders", require("./routes/orders.routes")); 
app.use("/api/v1/payments", require("./routes/payments.routes"));
app.use("/api/v1/refunds", require("./routes/refunds.routes"));
app.use("/api/v1/webhooks", require("./routes/webhooks.routes"));
app.use("/api/v1/test", require("./routes/test.routes"));
// Health check route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = app;
