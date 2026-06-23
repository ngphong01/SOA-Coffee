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
const inventoryRoutes = require('./routes/inventory.routes');

const logger = createLogger('Inventory-Service');
const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/inventory', inventoryRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message });
});

const startSubscriptions = async () => {
  // Tự động trừ kho khi có order mới được tạo
    await subscribe('inventory.order.queue', [EVENTS.ORDER_CREATED], async (event) => {
      const { orderId } = event;
      const { query } = require('../../../shared/database/mysql');

      // Lấy danh sách sản phẩm trong order
      const items = await query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );

      for (const item of items) {
        await query(
          `UPDATE inventory
           SET quantity_in_stock = quantity_in_stock - ?
           WHERE product_id = ? AND quantity_available >= ?`,
          [item.quantity, item.product_id, item.quantity]
        );
      }
      logger.info(`Inventory adjusted for order #${orderId} (${items.length} items)`);
    });

  // Tự động hoàn lại kho khi order bị hủy
    await subscribe('inventory.cancel.queue', [EVENTS.ORDER_CANCELLED], async (event) => {
      const { orderId } = event;
      const { query } = require('../../../shared/database/mysql');

      const items = await query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );

      for (const item of items) {
        await query(
          `UPDATE inventory
           SET quantity_in_stock = quantity_in_stock + ?
           WHERE product_id = ?`,
          [item.quantity, item.product_id]
        );
      }
      logger.info(`Inventory restored for cancelled order #${orderId} (${items.length} items)`);
    });
};

bootstrapService({
  serviceName: 'inventory-service',
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
      logger.error('Failed to start Inventory Service:', error);
      process.exit(1);
    }
  }
});
