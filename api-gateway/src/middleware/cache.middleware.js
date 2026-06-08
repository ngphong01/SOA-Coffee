const { Cache } = require('../../shared/redis/client');

/**
 * Cache middleware — caches GET responses in Redis for a configurable TTL.
 * Skips caching when Redis is unavailable.
 */
const cacheMiddleware = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    try {
      const key = `cache:${req.originalUrl}`;
      const cached = await Cache.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Monkey-patch res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          Cache.set(key, body, ttlSeconds).catch(() => {});
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch {
      // Redis not available — skip caching silently
      next();
    }
  };
};

module.exports = cacheMiddleware;