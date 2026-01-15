const { Queue } = require("bullmq");
const redis = require("../redis");

module.exports = new Queue("webhooks", { connection: redis });
