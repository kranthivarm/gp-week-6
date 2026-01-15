require("dotenv").config();
const app = require("./app");

app.listen(8000, () => {
  console.log("API running on port 8000");
});
