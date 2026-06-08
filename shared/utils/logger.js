const winston = require('winston');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, service, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  return `${timestamp} [${service || 'APP'}] ${level}: ${message} ${metaStr}`;
});

const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
    transports: [
      new winston.transports.Console({
        format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
      }),
    ],
    exceptionHandlers: [new winston.transports.Console()],
    rejectionHandlers: [new winston.transports.Console()],
  });
};

module.exports = createLogger;
