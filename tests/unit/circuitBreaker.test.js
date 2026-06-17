/**
 * Unit tests: Circuit Breaker
 */
const CircuitBreaker = require('../../api-gateway/src/utils/circuitBreaker');

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 1000, halfOpenMax: 1 });
  });

  test('should call function successfully when closed', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await breaker.call(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(breaker.state).toBe('closed');
  });

  test('should open circuit after threshold failures', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.call(fn)).rejects.toThrow('fail');
    }

    expect(breaker.state).toBe('open');

    // Next call should reject immediately with circuit breaker error
    await expect(breaker.call(fn)).rejects.toThrow('Circuit breaker is OPEN');
    expect(fn).toHaveBeenCalledTimes(3); // not called again
  });

  test('should transition to half-open after timeout', async () => {
    // Force open
    breaker.state = 'open';
    breaker.failureCount = 3;
    breaker.lastFailureTime = Date.now() - 2000; // 2s ago, timeout is 1s

    const fn = jest.fn().mockResolvedValue('recovered');
    const result = await breaker.call(fn);

    expect(result).toBe('recovered');
    expect(breaker.state).toBe('closed');
  });

  test('should close circuit after successful half-open', async () => {
    breaker.state = 'half_open';
    breaker.failureCount = 3;

    const fn = jest.fn().mockResolvedValue('success');
    await breaker.call(fn);

    expect(breaker.state).toBe('closed');
  });

  test('should reopen circuit if half-open call fails', async () => {
    breaker.state = 'half_open';
    breaker.failureCount = 3;

    const fn = jest.fn().mockRejectedValue(new Error('still failing'));
    await expect(breaker.call(fn)).rejects.toThrow('still failing');

    expect(breaker.state).toBe('open');
  });
});
