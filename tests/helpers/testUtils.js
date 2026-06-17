/**
 * Test Helpers — utilities cho unit & integration tests
 */
const express = require('express');

/**
 * Create a minimal Express app for testing middleware/route handlers
 */
const createTestApp = (options = {}) => {
  const app = express();

  if (!options.skipJson) {
    app.use(express.json());
  }

  if (options.correlationId !== false) {
    app.use((req, res, next) => {
      req.correlationId = 'test-correlation-id';
      next();
    });
  }

  return app;
};

/**
 * Mock Express req/res/next for unit testing middleware
 */
const mockReqRes = (overrides = {}) => {
  const req = {
    method: 'GET',
    path: '/api/v1/test',
    headers: {},
    body: {},
    query: {},
    params: {},
    user: null,
    correlationId: 'test-correlation-id',
    ...overrides,
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    getHeader(name) {
      return this.headers[name];
    },
    send(data) {
      this.body = data;
      return this;
    },
  };

  const next = jest.fn();

  return { req, res, next };
};

/**
 * Mock database connection pool
 */
const mockDbPool = () => {
  return {
    query: jest.fn().mockResolvedValue([[]]),
    execute: jest.fn().mockResolvedValue([[]]),
    getConnection: jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValue([[]]),
    }),
  };
};

module.exports = { createTestApp, mockReqRes, mockDbPool };
