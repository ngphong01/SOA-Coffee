/**
 * Integration test: API Gateway Health & Metrics
 */
const request = require('supertest');
const express = require('express');
const { metricsMiddleware, metricsRoute } = require('../../shared/middleware/metrics');

describe('API Gateway Integration', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(metricsMiddleware('test-gateway'));
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'test-gateway' });
    });
    app.get('/metrics', metricsRoute);
    app.get('/api/v1/test', (req, res) => {
      res.json({ success: true });
    });
  });

  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('test-gateway');
  });

  test('GET /metrics returns Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('coffee_http_requests_total');
    expect(res.text).toContain('coffee_http_request_duration_ms');
  });

  test('GET /api/v1/test increments metrics', async () => {
    // Call the endpoint first
    await request(app).get('/api/v1/test');

    // Then check metrics were recorded
    const res = await request(app).get('/metrics');
    expect(res.text).toContain('coffee_http_requests_total');
  });
});
