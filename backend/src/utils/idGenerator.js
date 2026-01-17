// function randomId(prefix) {
//   return (
//     prefix +
//     Math.random().toString(36).substring(2, 18)
//   );
// }

function randomId(prefix) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix + id;
}

module.exports = { randomId };
