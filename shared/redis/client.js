const { createClient } = require('redis');
const createLogger = require('../utils/logger');

const logger = createLogger('Redis');

let client = null;

const createRedisClient = async () => {
  client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    password: process.env.REDIS_PASSWORD,
  });

  client.on('error', (err) => logger.error('Redis Client Error:', err));
  await client.connect();
  return client;
};

const getClient = () => {
  if (!client) throw new Error('Redis client not initialized');
  return client;
};

const Cache = {
  async get(key) {
    try {
      const data = await getClient().get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache GET error:', error);
      return null;
    }
  },
  async set(key, value, ttlSeconds = 300) {
    try {
      await getClient().setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache SET error:', error);
      return false;
    }
  },
  async del(key) {
    try {
      await getClient().del(key);
      return true;
    } catch (error) {
      logger.error('Cache DEL error:', error);
      return false;
    }
  },
  async delPattern(pattern) {
    try {
      const keys = await getClient().keys(pattern);
      if (keys.length > 0) await getClient().del(keys);
      return true;
    } catch (error) {
      logger.error('Cache DEL pattern error:', error);
      return false;
    }
  },
  async exists(key) {
    return await getClient().exists(key);
  },
  async increment(key, amount = 1) {
    return await getClient().incrBy(key, amount);
  },
  async expire(key, seconds) {
    return await getClient().expire(key, seconds);
  },
  generateKey: (...parts) => parts.join(':'),
};

module.exports = { createRedisClient, getClient, Cache };
