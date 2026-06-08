const createLogger = require('../../../shared/utils/logger');

const logger = createLogger('Error-Handler');

module.exports = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: err.errors });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ success: false, message: 'Service unavailable' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
