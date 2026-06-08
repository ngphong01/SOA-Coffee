module.exports = {
  database: require('./database/mysql'),
  redis: require('./redis/client'),
  rabbitmq: require('./rabbitmq/client'),
  logger: require('./utils/logger'),
  response: require('./utils/response'),
};
