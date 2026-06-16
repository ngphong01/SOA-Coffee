require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createRedisClient } = require('../../shared/redis/client');
const createLogger = require('../../shared/utils/logger');
const requestLogger = require('./middleware/logger.middleware');
const rateLimit = require('./middleware/rateLimit.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const { applyRbac } = require('./middleware/rbac.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const setupSwagger = require('./config/swagger');
const { registerProxies } = require('./config/proxy');

const logger = createLogger('API-Gateway');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Chỉ parse JSON cho các route KHÔNG phải proxy.
// Các route /api/... sẽ được proxy chuyển tiếp nguyên vẹn body sang microservice.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use(requestLogger);

// Rate limiting: 200 req/phút cho /api
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 200 }));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

setupSwagger(app);

// Auth + RBAC cho tất cả /api routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return authMiddleware(req, res, next);
  }
  next();
});

// RBAC enforcement (chạy sau auth)
applyRbac(app);

registerProxies(app);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    if (process.env.REDIS_HOST) {
      await createRedisClient();
    }
    app.listen(PORT, () => logger.info(`API Gateway running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
};

startServer();
