function randomId(prefix) {
  return (
    prefix +
    Math.random().toString(36).substring(2, 18)
  );
}

module.exports = { randomId };
