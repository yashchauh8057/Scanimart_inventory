// Simple load test: QR-scan-like product lookup and cached API reads.
// Usage: npm run loadtest [baseUrl] [durationSeconds] [connections]
const autocannon = require('autocannon');

const baseUrl = process.argv[2] || 'http://127.0.0.1:3000';
const duration = Number(process.argv[3]) || 20;
const connections = Number(process.argv[4]) || 100;

async function run(path) {
  const instance = autocannon({ url: `${baseUrl}${path}`, connections, duration });
  autocannon.track(instance, { renderProgressBar: true });
  return instance;
}

(async () => {
  console.log(`Testing ${baseUrl} with ${connections} connections for ${duration}s`);
  await run('/api/products?limit=50');
  await run('/api/products/by-sku/PRD1001');
  await run('/api/health');
  console.log('Load test completed.');
})().catch(err => { console.error(err); process.exit(1); });
