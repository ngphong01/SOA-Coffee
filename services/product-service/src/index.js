require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const createLogger = require('../../../shared/utils/logger');
const { bootstrapService } = require('../../../shared/utils/bootstrap');
const productRoutes = require('./routes/product.routes');

const logger = createLogger('Product-Service');
const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

bootstrapService({
  serviceName: 'product-service',
  port: PORT,
  app,
  onReady: async () => {
    try {
      createPool();
      await testConnection();
      await createRedisClient();
    } catch (error) {
      logger.error('Failed to start Product Service:', error);
      process.exit(1);
    }
  }
});
