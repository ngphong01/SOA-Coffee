const amqp = require('amqplib');
const createLogger = require('../utils/logger');

const logger = createLogger('RabbitMQ');
const EXCHANGE = 'coffee_events';

let connection = null;
let channel = null;

const connect = async () => {
  if (channel) return channel;

  const url = process.env.RABBITMQ_URL || 'amqp://localhost';
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  logger.info('RabbitMQ connected');
  return channel;
};

const publish = async (routingKey, message) => {
  const ch = await connect();
  const published = ch.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify({ ...message, publishedAt: new Date().toISOString() })),
    { persistent: true, contentType: 'application/json' }
  );
  if (!published) {
    logger.warn(`RabbitMQ publish blocked (backpressure) for ${routingKey}, waiting drain...`);
    await new Promise((resolve) => ch.once('drain', resolve));
  }
};

const subscribe = async (queueName, routingKeys, handler) => {
  const ch = await connect();
  await ch.assertQueue(queueName, { durable: true });

  const keys = Array.isArray(routingKeys) ? routingKeys : [routingKeys];
  for (const key of keys) {
    await ch.bindQueue(queueName, EXCHANGE, key);
  }

  ch.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      await handler(event, msg.fields.routingKey);
      ch.ack(msg);
    } catch (error) {
      logger.error('Message handler error:', error);
      ch.nack(msg, false, false);
    }
  });

  logger.info(`Subscribed to queue ${queueName}: ${keys.join(', ')}`);
};

module.exports = { connect, publish, subscribe };
