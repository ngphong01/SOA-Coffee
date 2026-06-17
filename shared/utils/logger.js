const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, service, correlationId, ...meta }) => {
  const cid = correlationId ? ` [${correlationId}]` : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${service || 'APP'}]${cid} ${level}: ${message} ${metaStr}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
  }),
];

// Elasticsearch transport for centralized logging (when ES is available)
if (process.env.ELASTICSEARCH_URL) {
  transports.push(
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: {
        node: process.env.ELASTICSEARCH_URL,
        auth: process.env.ES_USERNAME
          ? { username: process.env.ES_USERNAME, password: process.env.ES_PASSWORD }
          : undefined,
      },
      indexPrefix: 'coffee-logs',
      indexSuffixPattern: 'YYYY.MM.DD',
      ensureMappingTemplate: true,
      mappingTemplate: {
        settings: { number_of_shards: 1, number_of_replicas: 0 },
        mappings: {
          properties: {
            '@timestamp': { type: 'date' },
            level: { type: 'keyword' },
            message: { type: 'text' },
            service: { type: 'keyword' },
            correlationId: { type: 'keyword' },
          },
        },
      },
    })
  );
}

const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      json()
    ),
    transports,
    exceptionHandlers: [new winston.transports.Console()],
    rejectionHandlers: [new winston.transports.Console()],
  });
};

/**
 * Helper: log with correlation ID extracted from request-like object
 */
const logWithContext = (logger, level, req, message, meta = {}) => {
  const correlationId = req?.correlationId || req?.headers?.['x-correlation-id'] || null;
  logger.log(level, message, { correlationId, ...meta });
};

module.exports = createLogger;
module.exports.logWithContext = logWithContext;
