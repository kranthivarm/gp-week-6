const db = require("../db");

module.exports = async (req, res, next) => {
  const key = req.header("X-Api-Key");
  const secret = req.header("X-Api-Secret");

  if (!key || !secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { rows } = await db.query(
    "SELECT * FROM merchants WHERE api_key=$1 AND api_secret=$2",
    [key, secret]
  );

  if (!rows.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.merchant = rows[0];
  next();
};
