const { RateLimiterRedis } = require('rate-limiter-flexible');
const redis = require('./config/redis');

// Per-IP limiter for public/unauthenticated routes (e.g. /api/auth, /api/catalog).
// 60 requests per minute per IP.
const publicLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:public',
  points: 60,
  duration: 60,
});

// Per-user limiter for authenticated routes (cart, orders, notifications, etc.).
// Keyed by user id after JWT verification. 30 requests per minute per user.
const userLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:user',
  points: 30,
  duration: 60,
});

// Stricter per-user limiter for the payment routes (sensitive).
// 5 requests per minute per user.
const paymentLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:payment',
  points: 5,
  duration: 60,
});

// Builds an express middleware that enforces a given limiter for a key.
// `keyResolver(req)` returns the unique limiter key (IP or user id).
function rateLimitMiddleware(limiter, keyResolver) {
  return async (req, res, next) => {
    try {
      await limiter.consume(keyResolver(req));
      next();
    } catch (rejRes) {
      const secs = Math.ceil((rejRes.msBeforeNext || 60000) / 1000);
      res.set('Retry-After', String(secs));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
  };
}

const ipKey = (req) => req.ip || req.connection.remoteAddress || 'unknown';
const userKey = (req) => (req.user && req.user.id) || ipKey(req);

module.exports = {
  publicLimiter,
  userLimiter,
  paymentLimiter,
  rateLimitMiddleware,
  ipKey,
  userKey,
};
