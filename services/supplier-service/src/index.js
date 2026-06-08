require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { connect: connectRabbitMQ } = require('../../../shared/rabbitmq/client');
const createLogger = require('../../../shared/utils/logger');
const supplierRoutes = require('./routes/supplier.routes');

const logger = createLogger('Supplier-Service');
const app = express();
const PORT = process.env.PORT || 3009;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'supplier-service',
  timestamp: new Date().toISOString(),
}));

app.use('/api/suppliers', supplierRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message });
});

const startServer = async () => {
  try {
    createPool();
    await testConnection();
    if (process.env.RABBITMQ_URL) {
      await connectRabbitMQ();
    }
    app.listen(PORT, () => logger.info(`Supplier Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Supplier Service:', error);
    process.exit(1);
  }
};

startServer();
