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

const isPublic = (path) => {
  if (path.startsWith('/api/docs')) return true;
  if (path.startsWith('/api/uploads')) return true;
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
};

module.exports = (req, res, next) => {
  if (req.method === 'OPTIONS' || isPublic(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
