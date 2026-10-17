const express = require('express');
const crypto = require('node:crypto');
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

function recordAt(path) {
  return database().ref(path).get().then(snapshot => snapshot.exists() ? snapshot.val() : null);
}

function automationBaseUrl(request) {
  const configured = process.env.PUBLIC_BASE_URL || process.env.PUBLIC_HOST;
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/$/, '');
  const protocol = request.get('x-forwarded-proto') || request.protocol;
  return `${protocol}://${request.get('host')}`;
}

function paymentIsTrusted(record) {
  if (!record || ['cancelled', 'canceled', 'refunded', 'failed', 'unpaid'].includes(String(record.status || '').toLowerCase())) return false;
  return String(record.paymentStatus || '').toLowerCase() === 'paid';
}

function safePhone(record) {
  return String(record?.whatsappPhone || record?.phone || record?.userPhone || '').replace(/[^0-9+]/g, '');
}

function cartKey(value) {
  return crypto.createHash('sha256').update(String(value || '').trim().toLowerCase()).digest('hex').slice(0, 40);
}

function notificationPreference(record) {
  const preferences = record?.notificationPreferences || {};
  return {
    whatsapp: preferences.whatsapp === true || record?.whatsappOptIn === true,
    email: preferences.email !== false && Boolean(record?.userEmail || record?.email)
  };
}

async function claimRun(workflow, key, details = {}) {
  const path = `automationRuns/${workflow}/${key}`;
  const runRef = database().ref(path);
  const snapshot = await runRef.get();
  if (snapshot.exists()) return { claimed: false, ...snapshot.val() };
  const value = { status: 'claimed', claimedAt: new Date().toISOString(), ...details };
  await runRef.set(value);
  return { claimed: true, ...value };
}

async function finishRun(workflow, key, status, details = {}) {
  await database().ref(`automationRuns/${workflow}/${key}`).update({ status, finishedAt: new Date().toISOString(), ...details });
}

function orderIdFrom(request) {
  return String(request.params.orderId || request.body?.orderId || request.body?.receiptId || '').trim();
}

function orderValidation(order, orderId) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const total = Number(order?.total);
  const valid = Boolean(orderId && order && items.length && Number.isFinite(total) && total >= 0 && paymentIsTrusted(order));
  return {
    valid,
    orderId,
    paymentVerified: paymentIsTrusted(order),
    customer: { name: order?.user || order?.customerName || '', email: order?.userEmail || order?.email || '', phone: safePhone(order) },
    items,
    total,
    reason: valid ? null : 'Order must exist, contain items, have a non-negative total, and have trusted paid status.'
  };
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

// n8n receives this event from the backend after an order/receipt is created.
// The event is intentionally small; n8n must fetch trusted state before acting.
router.post('/webhooks/order', requireAutomationToken, async (request, response) => {
  const orderId = orderIdFrom(request);
  if (!orderId) return response.status(400).json({ error: 'orderId is required.' });
  response.status(202).json({ accepted: true, orderId, receivedAt: new Date().toISOString() });
});

router.get('/orders/:orderId', requireAutomationToken, async (request, response, next) => {
  try {
    const orderId = orderIdFrom(request);
    const order = await recordAt(`receipts/${orderId}`) || await recordAt(`orders/${orderId}`);
    if (!order) return response.status(404).json({ error: 'Order not found.', orderId });
    response.json({ ...orderValidation(order, orderId), order: { id: orderId, ...order } });
  } catch (error) { next(error); }
});

router.post('/orders/:orderId/process', requireAutomationToken, async (request, response, next) => {
  const orderId = orderIdFrom(request);
  try {
    const order = await recordAt(`receipts/${orderId}`) || await recordAt(`orders/${orderId}`);
    if (!order) return response.status(404).json({ error: 'Order not found.', orderId });
    const validation = orderValidation(order, orderId);
    if (!validation.valid) return response.status(422).json(validation);

    const claim = await claimRun('orderProcessing', orderId, { paymentVerified: true });
    if (!claim.claimed) return response.json({ ok: true, duplicate: true, orderId, status: claim.status });

    const receiptUrl = `${automationBaseUrl(request)}/api/store/receipt/${encodeURIComponent(orderId)}`;
    const preferences = notificationPreference(order);
    await database().ref(`automationState/orders/${orderId}`).update({
      status: 'processed', processedAt: new Date().toISOString(), paymentVerified: true, receiptUrl
    });
    await finishRun('orderProcessing', orderId, 'completed', { receiptUrl });
    response.json({
      ok: true,
      duplicate: false,
      orderId,
      receiptUrl,
      admin: { event: 'order.completed', orderId, total: validation.total },
      notifications: {
        whatsapp: preferences.whatsapp && Boolean(validation.customer.phone),
        email: preferences.email,
        customer: validation.customer
      }
    });
  } catch (error) {
    if (orderId) await finishRun('orderProcessing', orderId, 'failed', { error: error.message }).catch(() => {});
    next(error);
  }
});

router.get('/inventory/low-stock', requireAutomationToken, async (_, response, next) => {
  try {
    const products = await recordsAt('products');
    const items = products.filter(product => {
      const stock = Number(product.stock);
      const minimum = Number(product.reorderLevel ?? product.reorder ?? 0);
      return Number.isFinite(stock) && Number.isFinite(minimum) && stock <= minimum;
    }).map(product => {
      const stock = Number(product.stock) || 0;
      const minimum = Number(product.reorderLevel ?? product.reorder ?? 0);
      return {
        id: product.id,
        sku: product.sku || product.id,
        name: product.name || product.sku || product.id,
        stock,
        minimum,
        suggestedReorderQuantity: Math.max(minimum * 2 - stock, 1),
        alertKey: `${product.id}:${stock <= 0 ? 'out' : 'low'}`
      };
    });
    response.json({ ok: true, count: items.length, items });
  } catch (error) { next(error); }
});

router.get('/analytics/daily', requireAutomationToken, async (request, response, next) => {
  try {
    const requestedDay = String(request.query.date || todayKey());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDay)) return response.status(400).json({ error: 'date must be YYYY-MM-DD.' });
    const [receipts, sales] = await Promise.all([recordsAt('receipts'), recordsAt('sales')]);
    const completed = [...receipts.filter(item => isSameDay(item.createdAt, requestedDay) && paymentIsTrusted(item)), ...sales.filter(item => isSameDay(item.createdAt, requestedDay) && !['cancelled', 'failed', 'unpaid'].includes(String(item.status || '').toLowerCase()))];
    const revenue = completed.reduce((sum, item) => sum + (Number(item.total) || Number(item.amount) || 0), 0);
    const productCounts = {};
    completed.flatMap(item => Array.isArray(item.items) ? item.items : []).forEach(item => { productCounts[item.sku || item.name || 'unknown'] = (productCounts[item.sku || item.name || 'unknown'] || 0) + (Number(item.qty) || 1); });
    response.json({ ok: true, date: requestedDay, completedOrders: completed.length, revenue, averageOrderValue: completed.length ? revenue / completed.length : 0, topProducts: Object.entries(productCounts).map(([product, quantity]) => ({ product, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10) });
  } catch (error) { next(error); }
});

// The customer app stores only the current cart locally; this endpoint keeps a
// minimal server-side copy so n8n can send a delayed reminder without storing
// payment credentials or authentication data.
router.post('/carts', async (request, response, next) => {
  try {
    const { customerId, email, name, phone, whatsappOptIn, items } = request.body || {};
    const identity = String(customerId || email || '').trim();
    const safeItems = Array.isArray(items) ? items.map(item => ({ sku: String(item.sku || ''), name: String(item.name || ''), qty: Number(item.qty) || 0 })).filter(item => item.sku && item.qty > 0) : [];
    if (!identity || !safeItems.length) return response.status(400).json({ error: 'customer identity and cart items are required.' });
    const key = cartKey(identity);
    const now = new Date().toISOString();
    const existing = await recordAt(`abandonedCarts/${key}`);
    await database().ref(`abandonedCarts/${key}`).set({
      customerId: customerId || null, email: email || null, name: name || '',
      phone: safePhone({ phone }), whatsappOptIn: whatsappOptIn === true,
      items: safeItems, status: 'active', createdAt: existing?.createdAt || now, lastUpdatedAt: now
    });
    response.json({ ok: true, cartKey: key });
  } catch (error) { next(error); }
});

router.post('/carts/complete', async (request, response, next) => {
  try {
    const identity = String(request.body?.customerId || request.body?.email || '').trim();
    if (!identity) return response.status(400).json({ error: 'customer identity is required.' });
    await database().ref(`abandonedCarts/${cartKey(identity)}`).update({ status: 'converted', convertedAt: new Date().toISOString() });
    response.json({ ok: true });
  } catch (error) { next(error); }
});

router.get('/carts/abandoned', requireAutomationToken, async (request, response, next) => {
  try {
    const days = Math.min(Math.max(Number(request.query.days) || 3, 3), 4);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const [carts, customers] = await Promise.all([recordsAt('abandonedCarts'), recordsAt('customers')]);
    const customerById = new Map(customers.map(customer => [String(customer.id), customer]));
    const customerByEmail = new Map(customers.map(customer => [String(customer.email || '').trim().toLowerCase(), customer]));
    const items = carts.filter(cart => cart.status === 'active' && new Date(cart.lastUpdatedAt || cart.createdAt).getTime() <= cutoff).map(cart => {
      const customer = customerById.get(String(cart.customerId || '')) || customerByEmail.get(String(cart.email || '').trim().toLowerCase()) || {};
      const phone = safePhone(cart) || safePhone(customer);
      const whatsappOptIn = cart.whatsappOptIn === true || customer.whatsappOptIn === true;
      return { ...cart, customerId: cart.customerId || customer.id || null, name: cart.name || customer.name || '', phone, whatsappOptIn, reminderKey: `${cart.id}:${cart.lastUpdatedAt || cart.createdAt}`, days };
    }).filter(cart => cart.phone && cart.whatsappOptIn);
    response.json({ ok: true, days, count: items.length, items });
  } catch (error) { next(error); }
});

router.post('/notifications/claim', requireAutomationToken, async (request, response, next) => {
  try {
    const { channel, recipient, template, dedupeKey } = request.body || {};
    if (!channel || !recipient || !template || !dedupeKey) return response.status(400).json({ error: 'channel, recipient, template, and dedupeKey are required.' });
    const result = await claimRun('notifications', crypto.createHash('sha256').update(`${channel}:${recipient}:${template}:${dedupeKey}`).digest('hex'), { channel, recipient, template });
    response.json({ ok: true, ...result });
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
