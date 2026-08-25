const express = require('express');
const { database } = require('./firebase');

const router = express.Router();

router.post('/login', async (request, response, next) => {
  try {
    const email = String(request.body.email || '').trim().toLowerCase();
    const password = String(request.body.password || '');
    if (!email || !password) return response.status(400).json({ error: 'Email and password are required.' });

    const snapshot = await database().ref('users').get();
    const users = snapshot.val() || {};

    const account = Object.values(users).find(
      user => String(user.email || '').toLowerCase() === email && String(user.password || '') === password
    );
    if (!account) return response.status(401).json({ error: 'Invalid email or password.' });
    if (String(account.status || 'Active').toLowerCase() === 'inactive') {
      return response.status(403).json({ error: 'This account is inactive. Contact the administrator.' });
    }

    response.json({
      name: account.name,
      email: account.email,
      role: String(account.role || 'User').toLowerCase()
    });
  } catch (error) { next(error); }
});

module.exports = router;
