const { get, set } = require('./cache');

const LIMITS = {
  general: { window: 60_000, max: 120 },
  auth: { window: 60_000, max: 15 },
  store: { window: 60_000, max: 60 },
  products: { window: 60_000, max: 180 },
  chat: { window: 60_000, max: 30 }
};

function key(bucket, req) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  return `ratelimit:${bucket}:${ip}`;
}

function rateLimit(bucket = 'general') {
  const { window, max } = LIMITS[bucket] || LIMITS.general;
  return async (req, res, next) => {
    try {
      const id = key(bucket, req);
      let result = await get(id);
      let count = 1;
      if (!result || Date.now() - result.start > window) {
        result = { start: Date.now(), count: 1 };
      } else {
        result = { ...result, count: result.count + 1 };
        count = result.count;
      }
      await set(id, result, Math.ceil(window / 1000));
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(Math.max(0, max - count)));
      if (count > max) {
        return res.status(429).json({ error: 'Too many requests. Please slow down.' });
      }
      next();
    } catch {
      next();
    }
  };
}

module.exports = { rateLimit };
