/**
 * Rate Limiter — bảo vệ API khỏi abuse
 * In-memory, per-IP, sliding window.
 */

const WINDOW_MS = 60 * 1000; // 1 phút
const MAX_REQUESTS = 100; // 100 req/phút mỗi IP
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Dọn dẹp mỗi 5 phút

const hits = {};

// Dọn dẹp entries cũ định kỳ
setInterval(() => {
  const now = Date.now();
  for (const ip of Object.keys(hits)) {
    hits[ip] = hits[ip].filter((t) => now - t < WINDOW_MS);
    if (hits[ip].length === 0) delete hits[ip];
  }
}, CLEANUP_INTERVAL);

const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || WINDOW_MS;
  const max = options.max || MAX_REQUESTS;

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.ip
      || req.socket?.remoteAddress
      || 'unknown';

    const now = Date.now();

    if (!hits[ip]) hits[ip] = [];
    hits[ip] = hits[ip].filter((t) => now - t < windowMs);

    if (hits[ip].length >= max) {
      const retryAfter = Math.ceil((hits[ip][0] + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        message: `Too many requests. Retry after ${retryAfter}s`,
      });
    }

    hits[ip].push(now);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(max - hits[ip].length));

    next();
  };
};

module.exports = rateLimit;
