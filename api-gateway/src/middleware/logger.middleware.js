const morgan = require('morgan');
const createLogger = require('../../../shared/utils/logger');

const logger = createLogger('HTTP');

const stream = {
  write: (message) => logger.info(message.trim()),
};

const format = process.env.NODE_ENV === 'production'
  ? ':remote-addr :method :url :status :res[content-length] - :response-time ms'
  : ':method :url :status :response-time ms - :res[content-length]';

module.exports = morgan(format, { stream });
