const express = require('express');
const { database } = require('./firebase');
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

function toSession(account) {
  return {
    name: account.name,
    email: account.email,
    role: String(account.role || 'User').toLowerCase()
  };
}

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

    response.json(toSession(account));
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
      return response.json(toSession(account));
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
      createdAt: new Date().toISOString()
    };
    await database().ref(`users/${id}`).set(newAccount);
    database().ref('activities').push({
      message: `New customer ${name} registered via Google`,
      icon: 'fa-user-plus',
      createdAt: new Date().toISOString()
    }).catch(() => {});

    response.json(toSession(newAccount));
  } catch (error) { next(error); }
});

module.exports = router;
