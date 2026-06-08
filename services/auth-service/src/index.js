require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ } = require('../../../shared/rabbitmq/client');
const createLogger = require('../../../shared/utils/logger');
const authRoutes = require('./routes/auth.routes');
const authController = require('./controllers/auth.controller');

const logger = createLogger('Auth-Service');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'auth-service',
  timestamp: new Date().toISOString(),
}));

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

const startServer = async () => {
  try {
    createPool();
    await testConnection();
    await createRedisClient();
    await connectRabbitMQ();
    await authController.seedAdmin();
    app.listen(PORT, () => logger.info(`Auth Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Auth Service:', error);
    process.exit(1);
  }
};

startServer();
