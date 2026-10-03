const express = require('express');
const crypto = require('node:crypto');
const https = require('node:https');
const { database } = require('./firebase');

const router = express.Router();

const TAX_RATE = 0.05;

function ref(path) { return database().ref(path); }

async function snapshotList(path) {
  const snapshot = await ref(path).get();
  return Object.entries(snapshot.val() || {}).map(([id, item]) => ({ id, ...item }));
}

async function nextReceiptId() {
  const receipts = await snapshotList('receipts');
  let max = 0;
  receipts.forEach(({ id }) => {
    const value = Number(id.replace('RCPT', ''));
    if (Number.isInteger(value) && value > max) max = value;
  });
  return `RCPT${String(max + 1).padStart(4, '0')}`;
}

async function logActivity(message, icon = 'fa-receipt') {
  return ref('activities').push({ message, icon, createdAt: new Date().toISOString() }).catch(() => {});
}

async function getReceipt(id) {
  const snapshot = await ref(`receipts/${id}`).get();
  return snapshot.exists() ? snapshot.val() : null;
}

async function saveReceipt(id, receipt) {
  await ref(`receipts/${id}`).set(receipt);
}

function razorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return { keyId, keySecret, configured: Boolean(keyId && keySecret) };
}

function razorpayRequest(method, path, payload, keyId, keySecret) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : '';
    const request = https.request({
      hostname: 'api.razorpay.com',
      path,
      method,
      auth: `${keyId}:${keySecret}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, response => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
        if (response.statusCode >= 400) reject(new Error(parsed.error?.description || parsed.error?.reason || `Razorpay ${response.statusCode}`));
        else resolve(parsed);
      });
    });
    request.on('error', reject);
    if (payload) request.write(body);
    request.end();
  });
}

router.post('/checkout', async (request, response, next) => {
  try {
    const items = Array.isArray(request.body.items) ? request.body.items.filter(item => item && item.sku) : [];
    const paymentMethod = request.body.paymentMethod === 'razorpay' ? 'razorpay' : 'cash';
    if (!items.length) return response.status(400).json({ error: 'Cart is empty.' });

    const products = await snapshotList('products');
    const bySku = new Map(products.map(product => [product.sku, product]));

    const lines = [];
    const stockUpdates = {};
    items.forEach(({ sku, qty = 1 }) => {
      const product = bySku.get(sku);
      if (!product) return;
      const quantity = Math.max(1, Number(qty) || 1);
      lines.push({ sku, name: product.name, category: product.category || '', price: Number(product.price) || 0, qty: quantity });
      stockUpdates[product.id] = Math.max(0, (Number(product.stock) || 0) - quantity);
    });
    if (!lines.length) return response.status(404).json({ error: 'No matching products found.' });

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;
    const id = await nextReceiptId();
    const receipt = {
      id,
      user: request.body.user || 'Guest',
      userEmail: request.body.userEmail || '',
      items: lines,
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentStatus: 'pending',
      cashVerified: false,
      securityVerified: false,
      razorpayOrderId: null,
      createdAt: new Date().toISOString()
    };

    await Promise.all([
      saveReceipt(id, receipt),
      ...Object.entries(stockUpdates).map(([productId, stock]) => ref(`products/${productId}/stock`).set(stock))
    ]);
    await logActivity(`New receipt ${id} created (${paymentMethod}) for ${receipt.user}`, 'fa-receipt');
    response.status(201).json(receipt);
  } catch (error) { next(error); }
});

router.get('/receipt/:id', async (request, response, next) => {
  try {
    const receipt = await getReceipt(request.params.id);
    if (!receipt) return response.status(404).json({ error: 'Receipt not found.' });
    response.json(receipt);
  } catch (error) { next(error); }
});

router.post('/receipt/:id/collect-cash', async (request, response, next) => {
  try {
    const receipt = await getReceipt(request.params.id);
    if (!receipt) return response.status(404).json({ error: 'Receipt not found.' });
    if (receipt.paymentStatus === 'paid') return response.json(receipt);
    receipt.paymentStatus = 'paid';
    receipt.cashVerified = true;
    await saveReceipt(request.params.id, receipt);
    await logActivity(`Cash collected for receipt ${receipt.id}`, 'fa-money-bill');
    response.json(receipt);
  } catch (error) { next(error); }
});

router.post('/receipt/:id/verify-exit', async (request, response, next) => {
  try {
    const receipt = await getReceipt(request.params.id);
    if (!receipt) return response.status(404).json({ error: 'Receipt not found.' });
    const allowed = receipt.paymentStatus === 'paid';
    if (allowed && !receipt.securityVerified) {
      receipt.securityVerified = true;
      await saveReceipt(request.params.id, receipt);
      await logActivity(`Exit verified for receipt ${receipt.id}`, 'fa-shield-halved');
    }
    response.json({ allowed, receipt });
  } catch (error) { next(error); }
});

router.post('/razorpay/order', async (request, response, next) => {
  try {
    const { keyId, keySecret, configured } = razorpayConfig();
    if (!configured) return response.status(501).json({ error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env' });

    const receipt = await getReceipt(request.body.receiptId);
    if (!receipt) return response.status(404).json({ error: 'Receipt not found.' });

    const order = await razorpayRequest('POST', '/v1/orders', {
      amount: Math.round(receipt.total * 100),
      currency: 'INR',
      receipt: receipt.id,
      notes: { receiptId: receipt.id }
    }, keyId, keySecret);

    receipt.razorpayOrderId = order.id;
    await saveReceipt(receipt.id, receipt);
    response.json({ key: keyId, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) { next(error); }
});

router.post('/razorpay/verify', async (request, response, next) => {
  try {
    const { keySecret } = razorpayConfig();
    const { receiptId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.body;
    const receipt = await getReceipt(receiptId);
    if (!receipt) return response.status(404).json({ error: 'Receipt not found.' });

    if (keySecret) {
      const expected = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (expected !== razorpay_signature) return response.status(400).json({ error: 'Invalid payment signature.' });
    }

    receipt.paymentStatus = 'paid';
    receipt.paymentMethod = 'razorpay';
    receipt.razorpayPaymentId = razorpay_payment_id;
    await saveReceipt(receiptId, receipt);
    await logActivity(`Online payment received for receipt ${receipt.id}`, 'fa-credit-card');
    response.json(receipt);
  } catch (error) { next(error); }
});

module.exports = router;
