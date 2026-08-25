require('dotenv').config();
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const { database } = require('./firebase');
const { dashboardFromData } = require('./dashboard-service');
const apiRouter = require('./api');
const storeRouter = require('./store');
const authRouter = require('./auth');

const app = express();
const port = Number(process.env.PORT) || 3000;
const db = database();

app.use(cors());
app.use(express.json());
app.use((request, response, next) => {
  if (request.path === '/serviceAccountKey.json' || request.path === '/.env' || request.path.startsWith('/server/')) {
    return response.sendStatus(404);
  }
  next();
});
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (_, response) => response.redirect('/frontend/index.html'));

app.use('/api/store', storeRouter);
app.use('/api/auth', authRouter);
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

app.listen(port, () => console.log(`Scanimart server: http://127.0.0.1:${port}`));
