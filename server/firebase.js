const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');

function serviceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env.');
  }

  const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase service account file was not found: ${resolvedPath}`);
  }
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function database() {
  if (!process.env.FIREBASE_DATABASE_URL) {
    throw new Error('Set FIREBASE_DATABASE_URL in .env.');
  }
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount()), databaseURL: process.env.FIREBASE_DATABASE_URL });
  }
  return admin.database();
}

module.exports = { database };
