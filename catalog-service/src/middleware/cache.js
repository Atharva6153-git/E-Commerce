const redis = require('../config/redis');

const DEFAULT_TTL = 300;

function buildKey(prefix, req) {
  const id = req.params?.id || '';
  const qs = Object.entries(req.query || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(':');
  return id ? `${prefix}:${id}` : qs ? `${prefix}:all:${qs}` : `${prefix}:all`;
}

function cacheAside(prefix, ttl = DEFAULT_TTL) {
  return async (req, res, next) => {
    const key = buildKey(prefix, req);
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Redis GET error, falling through to DB:', err.message);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(key, ttl, JSON.stringify(body)).catch((err) =>
          console.error('Redis SET error:', err.message)
        );
      }
      return originalJson(body);
    };

    next();
  };
}

async function invalidateKeys(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Redis invalidation error:', err.message);
  }
}

module.exports = { cacheAside, invalidateKeys, buildKey };
