require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const createLogger = require('../../../shared/utils/logger');
const categoryRoutes = require('./routes/category.routes');

const logger = createLogger('Category-Service');
const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'category-service',
  timestamp: new Date().toISOString(),
}));

app.use('/api/categories', categoryRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message });
});

const startServer = async () => {
  try {
    createPool();
    await testConnection();
    await createRedisClient();
    app.listen(PORT, () => logger.info(`Category Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Category Service:', error);
    process.exit(1);
  }
};

startServer();
