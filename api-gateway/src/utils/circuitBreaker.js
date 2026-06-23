/**
 * Circuit Breaker — ngăn cascade failure khi backend service chết
 * Đơn giản, không dependency ngoài.
 */

const createLogger = require('../../../shared/utils/logger');
const logger = createLogger('CircuitBreaker');

const STATE = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half_open' };

class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
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
        logger.info(`Circuit breaker [${this.serviceName}] → HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker is OPEN — service [${this.serviceName}] unavailable`);
      }
    }

    // CLOSED state: decay failureCount nếu đã qua resetTimeout không có lỗi
    if (this.state === STATE.CLOSED && this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeout) {
      this.failureCount = 0;
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
        logger.info(`Circuit breaker [${this.serviceName}] → CLOSED`);
      }
    }
    // CLOSED state: không reset failureCount trên mỗi success,
    // chỉ reset sau resetTimeout không có lỗi (xử lý trong call())
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = STATE.OPEN;
      logger.warn(`Circuit breaker [${this.serviceName}] → OPEN`);
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
    breakers[serviceName] = new CircuitBreaker(serviceName, options);
  }
  return breakers[serviceName];
};

module.exports = { CircuitBreaker, getBreaker };
