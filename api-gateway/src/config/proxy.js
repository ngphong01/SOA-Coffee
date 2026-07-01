const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyOptions = {
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Rewrite /api/v1/* → /api/* cho service backend (chưa upgrade lên v1)
    if (req.path.startsWith('/api/v1/')) {
      proxyReq.path = req.path.replace('/api/v1/', '/api/');
    }
    if (req.user) {
      proxyReq.setHeader('X-User-Id', String(req.user.id));
      proxyReq.setHeader('X-User-Role', String(req.user.role_id));
    }
    if (req.correlationId) {
      proxyReq.setHeader('X-Correlation-Id', req.correlationId);
    }
    if (req.body && Object.keys(req.body).length && !req._bodyForwarded) {
      req._bodyForwarded = true;
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json; charset=utf-8');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData, 'utf8'));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    res.status(503).json({ success: false, message: 'Service unavailable', detail: err.message });
  },
};

const routes = [
  { path: '/api/v1/auth', target: process.env.AUTH_SERVICE_URL },
  { path: '/api/v1/users', target: process.env.USER_SERVICE_URL },
  { path: '/api/v1/settings', target: process.env.USER_SERVICE_URL },
  { path: '/api/v1/upload', target: process.env.USER_SERVICE_URL },
  { path: '/api/v1/uploads', target: process.env.USER_SERVICE_URL },
  { path: '/api/v1/products', target: process.env.PRODUCT_SERVICE_URL },
  { path: '/api/v1/categories', target: process.env.CATEGORY_SERVICE_URL },
  { path: '/api/v1/inventory', target: process.env.INVENTORY_SERVICE_URL },
  { path: '/api/v1/orders', target: process.env.ORDER_SERVICE_URL },
  { path: '/api/v1/vouchers', target: process.env.ORDER_SERVICE_URL },
  { path: '/api/v1/payments', target: process.env.PAYMENT_SERVICE_URL },
  { path: '/api/v1/employees', target: process.env.USER_SERVICE_URL },
  { path: '/api/v1/analytics', target: process.env.ANALYTICS_SERVICE_URL },
  // Backward compatibility: redirect /api/* → /api/v1/*
  { path: '/api/auth', target: process.env.AUTH_SERVICE_URL },
  { path: '/api/users', target: process.env.USER_SERVICE_URL },
  { path: '/api/settings', target: process.env.USER_SERVICE_URL },
  { path: '/api/upload', target: process.env.USER_SERVICE_URL },
  { path: '/api/uploads', target: process.env.USER_SERVICE_URL },
  { path: '/api/products', target: process.env.PRODUCT_SERVICE_URL },
  { path: '/api/categories', target: process.env.CATEGORY_SERVICE_URL },
  { path: '/api/inventory', target: process.env.INVENTORY_SERVICE_URL },
  { path: '/api/orders', target: process.env.ORDER_SERVICE_URL },
  { path: '/api/vouchers', target: process.env.ORDER_SERVICE_URL },
  { path: '/api/payments', target: process.env.PAYMENT_SERVICE_URL },
  { path: '/api/employees', target: process.env.USER_SERVICE_URL },
  { path: '/api/analytics', target: process.env.ANALYTICS_SERVICE_URL },
  // Static uploads served by product-service
  { path: '/uploads/products', target: process.env.PRODUCT_SERVICE_URL },
];

const registerProxies = (app) => {
  routes.forEach(({ path, target }) => {
    if (!target) return;
    app.use(path, createProxyMiddleware({ ...proxyOptions, target }));
  });
};

module.exports = { registerProxies };
