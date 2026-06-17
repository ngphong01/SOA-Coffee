const { v4: uuidv4 } = require('uuid');

/**
 * Correlation ID middleware — gán unique ID cho mỗi request,
 * giúp trace request xuyên suốt các service.
 */
module.exports = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
};
