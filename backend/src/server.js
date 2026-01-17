require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8000; // This picks up 8000 from your .env
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});