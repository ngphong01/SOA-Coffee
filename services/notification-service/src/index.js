require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { connect: connectRabbitMQ, subscribe } = require('../../../shared/rabbitmq/client');
const EVENTS = require('../../../shared/rabbitmq/events');
const createLogger = require('../../../shared/utils/logger');

const logger = createLogger('Notification-Service');
const app = express();
const PORT = process.env.PORT || 3011;

const notifications = [];

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'notification-service',
  timestamp: new Date().toISOString(),
}));

app.get('/api/notifications', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  res.json({
    success: true,
    data: notifications.slice(-limit).reverse(),
    total: notifications.length,
  });
});

const handleEvent = (event, routingKey) => {
  const entry = {
    id: notifications.length + 1,
    routingKey,
    event,
    receivedAt: new Date().toISOString(),
  };
  notifications.push(entry);
  if (notifications.length > 500) notifications.shift();
  logger.info(`Notification [${routingKey}]:`, JSON.stringify(event));
};

const startServer = async () => {
  try {
    await connectRabbitMQ();
    await subscribe('notification.events.queue', Object.values(EVENTS), handleEvent);

    app.listen(PORT, () => logger.info(`Notification Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Notification Service:', error);
    process.exit(1);
  }
};

startServer();
