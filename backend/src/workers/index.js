// workers/index.js
require('./payment.worker');
require('./webhook.worker');
require('./refund.worker');

console.log('All workers started');


//Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down workers...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down workers...');
  process.exit(0);
});