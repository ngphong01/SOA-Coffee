require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient, Cache } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ, subscribe } = require('../../../shared/rabbitmq/client');
const EVENTS = require('../../../shared/rabbitmq/events');
const createLogger = require('../../../shared/utils/logger');
const { bootstrapService } = require('../../../shared/utils/bootstrap');
const analyticsRoutes = require('./routes/analytics.routes');

const logger = createLogger('Analytics-Service');
const app = express();
const PORT = process.env.PORT || 3012;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message });
});

const startSubscriptions = async () => {
  // ── Subscribe ORDER_CREATED: cập nhật real-time order count ──
    await subscribe('analytics.order.queue', [EVENTS.ORDER_CREATED], async (event) => {
      logger.info(`Analytics: order created #${event.orderId}`);
      const today = new Date().toISOString().slice(0, 10);
      await Cache.incr(`analytics:orders:${today}`);
      // Invalidate dashboard cache
      await Cache.del('analytics:dashboard');
    });

    // ── Subscribe ORDER_COMPLETED: cập nhật real-time revenue ──
    await subscribe('analytics.revenue.queue', [EVENTS.ORDER_COMPLETED], async (event) => {
      logger.info(`Analytics: order completed #${event.orderId}`);
      const { query } = require('../../../shared/database/mysql');
      try {
        const [order] = await query('SELECT total_amount FROM orders WHERE id = ?', [event.orderId]);
        if (order) {
          const today = new Date().toISOString().slice(0, 10);
          await Cache.incrBy(`analytics:revenue:${today}`, Math.round(parseFloat(order.total_amount)));
        }
      } catch (e) {
        logger.warn('Analytics revenue query failed:', e.message);
      }
      // Invalidate dashboard cache
      await Cache.del('analytics:dashboard');
    });

    // ── Subscribe PAYMENT_COMPLETED: cập nhật payment stats ──
    await subscribe('analytics.payment.queue', [EVENTS.PAYMENT_COMPLETED], async (event) => {
      logger.info(`Analytics: payment completed for order #${event.orderId}, amount=${event.amount}`);
      const today = new Date().toISOString().slice(0, 10);
      await Cache.incrBy(`analytics:revenue:${today}`, Math.round(parseFloat(event.amount || 0)));
      // Invalidate caches
      await Cache.del('analytics:dashboard');
      await Cache.delPattern('analytics:revenue:*');
    });

};

bootstrapService({
  serviceName: 'analytics-service',
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
      logger.error('Failed to start Analytics Service:', error);
      process.exit(1);
    }
  }
});
