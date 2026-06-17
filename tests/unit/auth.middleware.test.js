/**
 * Unit tests: Auth Middleware
 */
const authMiddleware = require('../../api-gateway/src/middleware/auth.middleware');
const jwt = require('jsonwebtoken');
const { mockReqRes } = require('../helpers/testUtils');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Public paths', () => {
    test.each([
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/health',
      '/api/docs/swagger.json',
    ])('should allow %s without auth', (path) => {
      const { req, res, next } = mockReqRes({ path });
      authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should allow OPTIONS requests', () => {
      const { req, res, next } = mockReqRes({
        method: 'OPTIONS',
        path: '/api/v1/orders',
      });
      authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Protected paths', () => {
    test('should return 401 when no auth header', () => {
      const { req, res, next } = mockReqRes({ path: '/api/v1/products' });
      authMiddleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid token format', () => {
      const { req, res, next } = mockReqRes({
        path: '/api/v1/products',
        headers: { authorization: 'InvalidFormat token123' },
      });
      authMiddleware(req, res, next);

      expect(res.statusCode).toBe(401);
    });

    test('should accept valid Bearer token', () => {
      const mockUser = { id: 1, role_id: 3, email: 'test@test.com' };
      jwt.verify.mockReturnValue(mockUser);

      const { req, res, next } = mockReqRes({
        path: '/api/v1/products',
        headers: { authorization: 'Bearer valid-token-here' },
      });
      authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token-here', 'test-secret');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    test('should return 401 for expired token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const { req, res, next } = mockReqRes({
        path: '/api/v1/products',
        headers: { authorization: 'Bearer expired-token' },
      });
      authMiddleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid or expired');
    });
  });
});
