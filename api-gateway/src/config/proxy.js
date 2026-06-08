const { createProxyMiddleware } = require('http-proxy-middleware');

const proxyOptions = {
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', String(req.user.id));
      proxyReq.setHeader('X-User-Role', String(req.user.role_id));
    }
    // Forward body if already parsed by express.json() or raw
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
  { path: '/api/auth', target: process.env.AUTH_SERVICE_URL },
  { path: '/api/users', target: process.env.USER_SERVICE_URL },
  { path: '/api/settings', target: process.env.USER_SERVICE_URL },
  { path: '/api/upload', target: process.env.USER_SERVICE_URL },
  { path: '/api/uploads', target: process.env.USER_SERVICE_URL },
  { path: '/api/products', target: process.env.PRODUCT_SERVICE_URL },
  { path: '/api/categories', target: process.env.CATEGORY_SERVICE_URL },
  { path: '/api/inventory', target: process.env.INVENTORY_SERVICE_URL },
  { path: '/api/orders', target: process.env.ORDER_SERVICE_URL },
  { path: '/api/payments', target: process.env.PAYMENT_SERVICE_URL },
  { path: '/api/employees', target: process.env.EMPLOYEE_SERVICE_URL },
  { path: '/api/suppliers', target: process.env.SUPPLIER_SERVICE_URL },
  { path: '/api/promotions', target: process.env.PROMOTION_SERVICE_URL },
  { path: '/api/notifications', target: process.env.NOTIFICATION_SERVICE_URL },
  { path: '/api/analytics', target: process.env.ANALYTICS_SERVICE_URL },
  { path: '/api/logs', target: process.env.LOGGING_SERVICE_URL },
];

const registerProxies = (app) => {
  routes.forEach(({ path, target }) => {
    if (!target) return;
    app.use(path, createProxyMiddleware({ ...proxyOptions, target }));
  });
};

module.exports = { registerProxies };
