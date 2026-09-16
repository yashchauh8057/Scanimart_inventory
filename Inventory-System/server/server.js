require('dotenv').config();
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { database } = require('./firebase');
const { dashboardFromData } = require('./dashboard-service');
const apiRouter = require('./api');
const storeRouter = require('./store');
const authRouter = require('./auth');
const chatRouter = require('./chat');

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';
const publicHost = process.env.PUBLIC_HOST || (host === '0.0.0.0' ? 'localhost' : host);
const httpsPort = Number(process.env.HTTPS_PORT) || 3443;
const db = database();

app.use(cors());
app.use(express.json());
app.use((request, response, next) => {
  if (request.path === '/serviceAccountKey.json' || request.path === '/.env' || request.path.startsWith('/server/') || request.path.startsWith('/cert/')) {
    return response.sendStatus(404);
  }
  next();
});
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (_, response) => response.redirect('/frontend/index.html'));

app.use('/api/store', storeRouter);
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api', apiRouter);
app.get('/api/health', (_, response) => response.json({ ok: true }));
app.get('/api/dashboard', async (_, response, next) => {
  try { response.json(dashboardFromData((await db.ref().get()).val() || {})); }
  catch (error) { next(error); }
});

app.get('/api/dashboard/stream', (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const sendDashboard = snapshot => response.write(`data: ${JSON.stringify(dashboardFromData(snapshot.val() || {}))}\n\n`);
  const root = db.ref();
  root.on('value', sendDashboard, error => response.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`));
  request.on('close', () => root.off('value', sendDashboard));
});

app.use((error, _, response, __) => {
  console.error(error);
  response.status(500).json({ error: 'Unable to load dashboard data.', detail: error.message });
});

if (require.main === module) {
  app.listen(port, host, () => console.log(`Scanimart server: http://${publicHost}:${port}`));

  const sslKeyPath = path.resolve(process.cwd(), process.env.SSL_KEY_PATH || './cert/server-key.pem');
  const sslCertPath = path.resolve(process.cwd(), process.env.SSL_CERT_PATH || './cert/server-cert.pem');
  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    https.createServer({ key: fs.readFileSync(sslKeyPath), cert: fs.readFileSync(sslCertPath) }, app)
      .listen(httpsPort, host, () => console.log(`Scanimart server: https://${publicHost}:${httpsPort}`));
  }
}

module.exports = app;
