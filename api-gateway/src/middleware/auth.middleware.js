const jwt = require('jsonwebtoken');

const PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/health',
];

// Public GET endpoints – không cần auth
const PUBLIC_GET_PREFIXES = [
  '/api/products',
  '/api/v1/products',
  '/api/categories',
  '/api/v1/categories',
  '/api/inventory',
  '/api/v1/inventory',
  '/api/reviews',
  '/api/v1/reviews',
];

// Public POST endpoints (upload, etc.)
const PUBLIC_POST_PREFIXES = [
  '/api/products',
  '/api/v1/products',
];

const isPublic = (path, method) => {
  if (path.startsWith('/api/docs')) return true;
  if (path.startsWith('/api/uploads')) return true;
  if (path.startsWith('/uploads')) return true;
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  if (method === 'GET' && PUBLIC_GET_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))) return true;
  if (method === 'POST' && PUBLIC_POST_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`))) return true;
  return false;
};

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS' || isPublic(req.path, req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
