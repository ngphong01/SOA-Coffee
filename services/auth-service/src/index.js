require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ } = require('../../../shared/rabbitmq/client');
const createLogger = require('../../../shared/utils/logger');
const { bootstrapService } = require('../../../shared/utils/bootstrap');
const authRoutes = require('./routes/auth.routes');
const authController = require('./controllers/auth.controller');

const logger = createLogger('Auth-Service');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

bootstrapService({
  serviceName: 'auth-service',
  port: PORT,
  app,
  onReady: async () => {
    try {
      createPool();
      await testConnection();
      await createRedisClient();
      await connectRabbitMQ();
      await authController.seedAdmin();
    } catch (error) {
      logger.error('Failed to start Auth Service:', error);
      process.exit(1);
    }
  }
});
