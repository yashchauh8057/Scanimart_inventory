const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const nodemailer = require('nodemailer');

initializeApp({
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const database = getDatabase();

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function requireToken(request) {
  const configured = process.env.AUTOMATION_TOKEN;
  return Boolean(configured && request.get('x-automation-token') === configured);
}

function smtpTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) throw new Error('SMTP_USER and SMTP_PASSWORD are required.');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user, pass }
  });
}

async function claimEmail(receiptId) {
  const runRef = database.ref(`automationRuns/thankYouEmail/${receiptId}`);
  const result = await runRef.transaction(current => {
    if (current?.status === 'completed' || current?.status === 'sending') return;
    return { status: 'sending', claimedAt: new Date().toISOString() };
  });
  return { claimed: result.committed, runRef, value: result.snapshot.val() };
}

function buildEmail(receipt, receiptId) {
  const customerName = receipt.user || 'Valued Customer';
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(item.name || item.sku || 'Product')}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${escapeHtml(item.qty || item.quantity || 1)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${Number(item.price || 0).toFixed(2)}</td>
    </tr>`).join('');
  const publicBaseUrl = String(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const receiptUrl = publicBaseUrl ? `${publicBaseUrl}/api/store/receipt/${encodeURIComponent(receiptId)}` : '';

  return {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: receipt.userEmail,
    subject: `Thank You for Shopping With Us - ${receiptId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;color:#222">
      <h2 style="color:#2563eb">Thank You for Shopping With Us</h2>
      <p>Hello ${escapeHtml(customerName)},</p>
      <p>Thank you for visiting us. Your payment for order <strong>${escapeHtml(receiptId)}</strong> was completed successfully.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0">
        <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #2563eb">Product</th><th style="padding:8px;border-bottom:2px solid #2563eb">Qty</th><th style="text-align:right;padding:8px;border-bottom:2px solid #2563eb">Price</th></tr></thead>
        <tbody>${itemRows || '<tr><td colspan="3" style="padding:8px">Your recent purchase</td></tr>'}</tbody>
      </table>
      <p><strong>Total paid: ₹${Number(receipt.total || 0).toFixed(2)}</strong></p>
      ${receiptUrl ? `<p><a href="${escapeHtml(receiptUrl)}">View your receipt</a></p>` : ''}
      <p>Regards,<br><strong>ScaniMart Team</strong></p>
    </div>`
  };
}

exports.sendCustomerThankYouEmail = onRequest(
  { region: process.env.FUNCTION_REGION || 'asia-south1', cors: false },
  async (request, response) => {
    if (request.method !== 'POST') return response.status(405).json({ error: 'POST required.' });
    if (!requireToken(request)) return response.status(401).json({ error: 'Invalid automation token.' });

    const receiptId = String(request.body?.receiptId || '').trim();
    if (!receiptId) return response.status(400).json({ error: 'receiptId is required.' });

    try {
      const snapshot = await database.ref(`receipts/${receiptId}`).get();
      const receipt = snapshot.val();
      if (!receipt) return response.status(404).json({ error: 'Receipt not found.', receiptId });
      if (receipt.paymentStatus !== 'paid' || receipt.securityVerified !== true) {
        return response.status(422).json({ error: 'Receipt payment and exit verification are required.', receiptId });
      }
      if (!receipt.userEmail) return response.status(422).json({ error: 'Customer email is missing.', receiptId });

      const claim = await claimEmail(receiptId);
      if (!claim.claimed) return response.json({ ok: true, duplicate: true, receiptId });

      await smtpTransport().sendMail(buildEmail(receipt, receiptId));
      await claim.runRef.update({ status: 'completed', completedAt: new Date().toISOString() });
      return response.json({ ok: true, duplicate: false, receiptId });
    } catch (error) {
      await database.ref(`automationRuns/thankYouEmail/${receiptId}`).update({
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      }).catch(() => {});
      return response.status(500).json({ error: error.message });
    }
  }
);
