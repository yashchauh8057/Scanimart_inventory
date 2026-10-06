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
const automationRouter = require('./automation');
const { rateLimit } = require('./rate-limit');


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


app.use('/api/store', rateLimit('store'), storeRouter);
app.use('/api/auth', authRouter);
app.use('/api/chat', rateLimit('chat'), chatRouter);
app.use('/api/automation', automationRouter);
app.use('/api', rateLimit('general'), apiRouter);
