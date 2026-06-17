/**
 * Shared Service Bootstrap — chuẩn hóa việc khởi tạo mọi microservice.
 * Thêm: metrics, tracing, service discovery registration.
 */
const { metricsMiddleware, metricsRoute } = require('../middleware/metrics');
const { initTracing } = require('./tracing');
const serviceDiscovery = require('./serviceDiscovery');
const createLogger = require('./logger');

/**
 * Bootstraps an Express app with standard microservice features.
 *
 * @param {object} options
 * @param {string} options.serviceName - Tên service (key trong SERVICES map)
 * @param {number} options.port - Port service lắng nghe
 * @param {object} options.app - Express app instance
 * @param {Function} options.onReady - Callback khi service sẵn sàng
 */
const bootstrapService = async ({ serviceName, port, app, onReady }) => {
  const logger = createLogger(serviceName);

  // Prometheus metrics
  app.use(metricsMiddleware(serviceName));
  app.get('/metrics', metricsRoute);

  // OpenTelemetry tracing
  try {
    initTracing(serviceName);
    logger.info('OpenTelemetry tracing initialized');
  } catch (err) {
    logger.warn('OpenTelemetry tracing not available:', err.message);
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: serviceName,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Start server
  app.listen(port, () => {
    logger.info(`${serviceName} running on port ${port}`);
  });

  // Register with Consul (non-blocking)
  serviceDiscovery.register(serviceName, port).catch(() => {});

  if (onReady) await onReady();
};

module.exports = { bootstrapService };
