require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ, subscribe } = require('../../../shared/rabbitmq/client');
const EVENTS = require('../../../shared/rabbitmq/events');
const createLogger = require('../../../shared/utils/logger');
const { bootstrapService } = require('../../../shared/utils/bootstrap');
const orderRoutes = require('./routes/order.routes');
const voucherRoutes = require('./routes/voucher.routes');

const logger = createLogger('Order-Service');
const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/vouchers', voucherRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

const startSubscriptions = async () => {
  // Tự động cập nhật trạng thái order khi payment hoàn thành
    await subscribe('order.payment.queue', [EVENTS.PAYMENT_COMPLETED], async (event) => {
      const { orderId } = event;
      const { query } = require('../../../shared/database/mysql');
      await query(
        'UPDATE orders SET status = ? WHERE id = ? AND status IN (?, ?)',
        ['completed', orderId, 'pending', 'processing']
      );
      logger.info(`Order #${orderId} auto-completed via payment event`);
    });
};

bootstrapService({
  serviceName: 'order-service',
  port: PORT,
  app,
  onReady: async () => {
    try {
      createPool();
      await testConnection();
      await createRedisClient();
      await connectRabbitMQ();
      await startSubscriptions();
    } catch (error) {
      logger.error('Failed to start Order Service:', error);
      process.exit(1);
    }
  }
});
