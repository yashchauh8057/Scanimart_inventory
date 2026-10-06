const express = require('express');
const { database } = require('./firebase');

const router = express.Router();
const TIME_ZONE = process.env.AUTOMATION_TIME_ZONE || 'Asia/Kolkata';

function todayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function recordsAt(path) {
  return database().ref(path).get().then(snapshot => Object.entries(snapshot.val() || {}).map(([id, item]) => ({ id, ...item })));
}

function isSameDay(value, day) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && todayKey(date) === day;
}

function requireAutomationToken(request, response, next) {
  const configured = process.env.AUTOMATION_TOKEN;
  if (!configured) return response.status(503).json({ error: 'AUTOMATION_TOKEN is not configured.' });
  if (request.get('x-automation-token') !== configured) return response.status(401).json({ error: 'Invalid automation token.' });
  next();
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable notifications.');

  const result = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
  const data = await result.json().catch(() => ({}));
  if (!result.ok || !data.ok) throw new Error(data.description || `Telegram request failed (${result.status}).`);
}

async function alreadyRan(name, key) {
  return (await database().ref(`automationRuns/${name}/${key}`).get()).exists();
}

async function markRan(name, key) {
  await database().ref(`automationRuns/${name}/${key}`).set({ completedAt: new Date().toISOString() });
}

router.get('/status', requireAutomationToken, async (_, response, next) => {
  try {
    response.json({ ok: true, timeZone: TIME_ZONE, telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) });
  } catch (error) { next(error); }
});

router.post('/low-stock', requireAutomationToken, async (_, response, next) => {
  try {
    const products = await recordsAt('products');
    const lowStock = products.filter(product => {
      const stock = Number(product.stock);
      const reorderLevel = Number(product.reorderLevel ?? product.reorder ?? 0);
      return Number.isFinite(stock) && stock <= reorderLevel;
    });
    if (!lowStock.length) return response.json({ ok: true, sent: false, count: 0, message: 'No low-stock products.' });

    const lines = lowStock.slice(0, 50).map(product => `• ${product.name || product.sku || product.id}: ${Number(product.stock) || 0} left (reorder at ${Number(product.reorderLevel ?? product.reorder ?? 0)})`);
    await sendTelegram(`⚠️ Scanimart low-stock alert\n\n${lines.join('\n')}${lowStock.length > 50 ? `\n…and ${lowStock.length - 50} more` : ''}`);
    response.json({ ok: true, sent: true, count: lowStock.length });
  } catch (error) { next(error); }
});

router.post('/daily-report', requireAutomationToken, async (_, response, next) => {
  try {
    const day = todayKey();
    if (await alreadyRan('dailyReport', day)) return response.json({ ok: true, sent: false, skipped: true, day });

    const [receipts, sales] = await Promise.all([recordsAt('receipts'), recordsAt('sales')]);
    const todayReceipts = receipts.filter(item => isSameDay(item.createdAt, day));
    const todaySales = sales.filter(item => isSameDay(item.createdAt, day));
    const paid = todayReceipts.filter(item => item.paymentStatus === 'paid');
    const revenue = paid.reduce((sum, item) => sum + (Number(item.total) || 0), 0) + todaySales.reduce((sum, item) => sum + (Number(item.total) || Number(item.amount) || 0), 0);
    await sendTelegram(`📊 Scanimart daily report (${day})\n\nReceipts: ${todayReceipts.length}\nPaid receipts: ${paid.length}\nSales records: ${todaySales.length}\nRevenue: ₹${revenue.toFixed(2)}`);
    await markRan('dailyReport', day);
    response.json({ ok: true, sent: true, day, receipts: todayReceipts.length, revenue });
  } catch (error) { next(error); }
});

module.exports = router;
