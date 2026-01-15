module.exports = (attempt) => {
  if (process.env.WEBHOOK_RETRY_INTERVALS_TEST === "true") {
    return [0, 5, 10, 15, 20][attempt - 1] * 1000;
  }

  return [0, 60, 300, 1800, 7200][attempt - 1] * 1000;
};
