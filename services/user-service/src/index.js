require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ } = require('../../../shared/rabbitmq/client');
const createLogger = require('../../../shared/utils/logger');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');
const uploadRoutes = require('./routes/upload.routes');

const logger = createLogger('User-Service');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'user-service',
  timestamp: new Date().toISOString(),
}));

app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', uploadRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message });
});

const startServer = async () => {
  try {
    createPool();
    await testConnection();
    await createRedisClient();
    await connectRabbitMQ();
    app.listen(PORT, () => logger.info(`User Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start User Service:', error);
    process.exit(1);
  }
};

startServer();
