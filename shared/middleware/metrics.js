/**
 * Prometheus Metrics Middleware
 * Exposes /metrics endpoint with request counts, durations, and error rates.
 */
const client = require('prom-client');

// Create a Registry
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'coffee_' });

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'coffee_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDurationMs = new client.Histogram({
  name: 'coffee_http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  registers: [register],
});

// HTTP error rate
const httpErrorsTotal = new client.Counter({
  name: 'coffee_http_errors_total',
  help: 'Total number of HTTP errors (5xx)',
  labelNames: ['method', 'route', 'service'],
  registers: [register],
});

// Circuit breaker state gauge
const circuitBreakerState = new client.Gauge({
  name: 'coffee_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
  labelNames: ['service', 'target'],
  registers: [register],
});

/**
 * Express middleware: records HTTP metrics
 */
const metricsMiddleware = (serviceName) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const route = req.route?.path || req.path || 'unknown';
      const labels = {
        method: req.method,
        route,
        status_code: res.statusCode,
        service: serviceName,
      };

      httpRequestsTotal.inc(labels);
      httpRequestDurationMs.observe(labels, duration);

      if (res.statusCode >= 500) {
        httpErrorsTotal.inc({ method: req.method, route, service: serviceName });
      }
    });

    next();
  };
};

/**
 * Express route: expose /metrics for Prometheus scraping
 */
const metricsRoute = async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
};

module.exports = {
  metricsMiddleware,
  metricsRoute,
  register,
  circuitBreakerState,
};
