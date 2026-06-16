/**
 * Circuit Breaker — ngăn cascade failure khi backend service chết
 * Đơn giản, không dependency ngoài.
 */

const createLogger = require('../../../shared/utils/logger');
const logger = createLogger('CircuitBreaker');

const STATE = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half_open' };

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30s
    this.halfOpenMax = options.halfOpenMax || 1;

    this.state = STATE.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async call(fn) {
    if (this.state === STATE.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = STATE.HALF_OPEN;
        this.successCount = 0;
        logger.info('Circuit breaker → HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN — service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    if (this.state === STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenMax) {
        this.state = STATE.CLOSED;
        this.failureCount = 0;
        logger.info('Circuit breaker → CLOSED');
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = STATE.OPEN;
      logger.warn('Circuit breaker → OPEN');
    }
  }

  getState() {
    return this.state;
  }
}

// Pre-configured breakers per service
const breakers = {};

const getBreaker = (serviceName, options) => {
  if (!breakers[serviceName]) {
    breakers[serviceName] = new CircuitBreaker(options);
  }
  return breakers[serviceName];
};

module.exports = { CircuitBreaker, getBreaker };
