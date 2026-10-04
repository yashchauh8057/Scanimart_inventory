const Redis = require('ioredis');

const MEMORY = new Map();
let redis = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (redis) return redis;
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
      enableReadyCheck: false,
      enableOfflineQueue: false
    });
    redis.on('error', () => { /* fallback to memory for this instance */ });
    redis.connect().catch(() => {});
  } catch {
    redis = null;
  }
  return redis;
}

async function get(key) {
  const client = getRedis();
  if (client) {
    try {
      const raw = await client.get(key);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  const item = MEMORY.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) { MEMORY.delete(key); return null; }
  return item.value;
}

async function set(key, value, ttlSeconds = 60) {
  const client = getRedis();
  if (client) {
    try { await client.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch {}
  }
  MEMORY.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
}

async function delByPrefix(prefix) {
  const client = getRedis();
  if (client) {
    try {
      const stream = client.scanStream({ match: `${prefix}*`, count: 100 });
      for await (const keys of stream) {
        if (keys.length) await client.del(keys);
      }
    } catch {}
  }
  for (const key of [...MEMORY.keys()]) {
    if (key.startsWith(prefix)) MEMORY.delete(key);
  }
}

async function cached(key, ttlSeconds, producer) {
  const hit = await get(key);
  if (hit != null) return hit;
  const value = await producer();
  await set(key, value, ttlSeconds);
  return value;
}

function closeRedis() {
  if (redis) { try { redis.disconnect(); } catch {} redis = null; }
}

module.exports = { get, set, delByPrefix, cached, closeRedis };
