const express = require('express');
const { database } = require('./firebase');
const cache = require('./cache');
const { rateLimit } = require('./rate-limit');

const router = express.Router();

async function findAccountByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  const snapshot = await database().ref('users').get();
  const users = snapshot.val() || {};
  return Object.values(users).find(
    user => String(user.email || '').toLowerCase() === normalized
  ) || null;
}

async function findUserKeyByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  const snapshot = await database().ref('users').get();
  const users = snapshot.val() || {};
  return Object.keys(users).find(key => String(users[key]?.email || '').trim().toLowerCase() === normalized) || null;
}

async function recordCustomerAction({ email, name, action, provider, receiptId } = {}) {
  const key = await findUserKeyByEmail(email);
  if (!key) return;

  const now = new Date().toISOString();
  const update = {
    email: String(email).trim().toLowerCase(),
    ...(name ? { name } : {}),
    ...(provider ? { provider } : {}),
    lastSeenAt: now,
    lastAction: action,
    lastActionAt: now,
    ...(action === 'signed in' ? { lastLogin: now } : {}),
    ...(receiptId ? { lastReceiptId: receiptId } : {})
  };
  const actionRecord = { action, createdAt: now, ...(receiptId ? { receiptId } : {}) };

  await Promise.all([
    database().ref(`users/${key}`).update(update),
    database().ref(`users/${key}/actions`).push(actionRecord),
    database().ref('activities').push({
      type: 'customer-action',
      userId: key,
      name: name || '',
      email: String(email).trim().toLowerCase(),
      message: `${name || email} ${action}`,
      icon: 'fa-user-clock',
      createdAt: now,
      ...(receiptId ? { receiptId } : {})
    })
  ]);
  await cache.delByPrefix('collection:users');
}

function toSession(account) {
  return {
    name: account.name,
    email: account.email,
    phone: account.phone || account.whatsappPhone || '',
    whatsappOptIn: account.whatsappOptIn === true,
    role: String(account.role || 'User').toLowerCase()
  };
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// Public signup used by the marketing site. Accounts are created as customer
// users; an administrator can promote them later from the dashboard.
router.post('/register', rateLimit('auth'), async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const phone = String(request.body.phone || '').trim();
    const password = String(request.body.password || '');
    const plan = String(request.body.plan || 'starter').trim().toLowerCase();
    if (name.length < 2 || !validateEmail(email) || password.length < 8) {
      return response.status(400).json({ error: 'Enter a valid name, email and password of at least 8 characters.' });
    }
    if (await findAccountByEmail(email)) return response.status(409).json({ error: 'An account with this email already exists. Please sign in.' });

    const usersSnapshot = await database().ref('users').get();
    const users = usersSnapshot.val() || {};
    let max = 0;
    Object.keys(users).forEach(id => {
      const value = Number(String(id).replace(/^U/i, ''));
      if (Number.isInteger(value) && value > max) max = value;
    });
    const id = `U${String(max + 1).padStart(3, '0')}`;
    const account = {
      id, name, email, phone, password, role: 'User', status: 'Active',
      plan: ['starter', 'professional', 'enterprise'].includes(plan) ? plan : 'starter',
      provider: 'local', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
    };
    await database().ref(`users/${id}`).set(account);
    return response.status(201).json(toSession(account));
  } catch (error) { next(error); }
});

// Contact requests are persisted even when SMTP is not configured, so no
// enquiry disappears in local development or on a server without mail creds.
router.post('/contact', rateLimit('contact'), async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim();
    const email = String(request.body.email || '').trim().toLowerCase();
    const phone = String(request.body.phone || '').trim();
    const message = String(request.body.message || '').trim();
    if (name.length < 2 || !validateEmail(email) || message.length < 10) {
      return response.status(400).json({ error: 'Please provide your name, a valid email and a message of at least 10 characters.' });
    }
    const lead = { name, email, phone, message, createdAt: new Date().toISOString(), status: 'new' };
    const saved = await database().ref('contactMessages').push(lead);
    return response.status(201).json({ ok: true, id: saved.key, message: 'Thanks — your message has been received.' });
  } catch (error) { next(error); }
});

// Public client ID for Google Identity Services (safe to expose).
router.get('/google-config', (_, response) => {
  response.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});

router.post('/login', rateLimit('auth'), async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    if (!email || !password) return response.status(400).json({ error: 'Email and password are required.' });

    const account = await findAccountByEmail(email);
    if (!account || String(account.password || '') !== password) {
      return response.status(401).json({ error: 'Invalid email or password.' });
    }
    if (String(account.status || 'Active').toLowerCase() === 'inactive') {
      return response.status(403).json({ error: 'This account is inactive. Contact the administrator.' });
    }

    const session = toSession(account);
    if (session.role === 'user') {
      await recordCustomerAction({ email: session.email, name: session.name, action: 'signed in', provider: account.provider || 'local' });
    }
    response.json(session);
  } catch (error) { next(error); }
});

// Verify a Google ID token (from Google Identity Services). Any verified
// Google email is allowed: existing `users` keep their role, new emails are
// auto-registered as `User` so the frontend redirects them to the user panel.
router.post('/google', rateLimit('auth'), async (request, response, next) => {
  try {
    const idToken = String(request.body.idToken || '').trim();
    if (!idToken) return response.status(400).json({ error: 'Google ID token is required.' });
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    if (!clientId) return response.status(501).json({ error: 'Google sign-in is not configured on the server.' });

    const verify = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const payload = await verify.json().catch(() => ({}));
    if (!verify.ok) return response.status(401).json({ error: payload.error_description || 'Invalid Google token.' });
    if (payload.aud !== clientId) return response.status(401).json({ error: 'Google token was issued for a different app.' });
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      return response.status(401).json({ error: 'Google email is not verified.' });
    }

    const account = await findAccountByEmail(payload.email);
    if (account) {
      if (String(account.status || 'Active').toLowerCase() === 'inactive') {
        return response.status(403).json({ error: 'This account is inactive. Contact the administrator.' });
      }
      // Record the live sign-in email + provider for admin customer views.
      try {
        await recordCustomerAction({ email: account.email, name: account.name || payload.name, action: 'signed in', provider: account.provider || 'google' });
        await database().ref(`users/${await findUserKeyByEmail(account.email)}`).update({ lastLogin: new Date().toISOString() });
      } catch {}
      return response.json({ ...toSession(account), provider: account.provider || 'google' });
    }

    // New Google user -> auto-register as User (customer panel).
    const email = String(payload.email || '').trim();
    const name = String(payload.name || payload.given_name || email.split('@')[0] || 'Google User').trim();
    const usersSnapshot = await database().ref('users').get();
    const existingIds = Object.keys(usersSnapshot.val() || {});
    let max = 0;
    existingIds.forEach(id => {
      const value = Number(String(id).replace(/^U/i, ''));
      if (Number.isInteger(value) && value > max) max = value;
    });
    const id = `U${String(max + 1).padStart(3, '0')}`;
    const newAccount = {
      id,
      name,
      email,
      role: 'User',
      status: 'Active',
      provider: 'google',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    await database().ref(`users/${id}`).set(newAccount);
    await recordCustomerAction({ email, name, action: 'registered and signed in', provider: 'google' });

    response.json(toSession(newAccount));
  } catch (error) { next(error); }
});

router.recordCustomerAction = recordCustomerAction;
module.exports = router;
