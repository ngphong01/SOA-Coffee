require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { connect: connectRabbitMQ, subscribe } = require('../../../shared/rabbitmq/client');
const EVENTS = require('../../../shared/rabbitmq/events');
const createLogger = require('../../../shared/utils/logger');
const inventoryRoutes = require('./routes/inventory.routes');

const logger = createLogger('Inventory-Service');
const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'inventory-service',
  timestamp: new Date().toISOString(),
}));

app.use('/api/inventory', inventoryRoutes);

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
           SET quantity_in_stock = quantity_in_stock - ?,
               quantity_reserved = quantity_reserved + ?
           WHERE product_id = ? AND quantity_available >= ?`,
          [item.quantity, item.quantity, item.product_id, item.quantity]
        );
      }
      logger.info(`Inventory adjusted for order #${orderId} (${items.length} items)`);
    });

    app.listen(PORT, () => logger.info(`Inventory Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Inventory Service:', error);
    process.exit(1);
  }
};

startServer();
