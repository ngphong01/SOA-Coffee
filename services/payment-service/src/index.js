require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ } = require('../../../shared/rabbitmq/client');
const createLogger = require('../../../shared/utils/logger');
const paymentRoutes = require('./routes/payment.routes');

const logger = createLogger('Payment-Service');
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'payment-service' }));
app.use('/api/payments', paymentRoutes);
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

const startServer = async () => {
  createPool(); await testConnection();
  await createRedisClient(); await connectRabbitMQ();
  app.listen(process.env.PORT || 3007, () => logger.info(`🚀 Payment Service on port ${process.env.PORT || 3007}`));
};
startServer();