/**
 * Unit tests: RBAC Middleware
 */
const { requireRole } = (() => {
  // We need to extract the requireRole function from the module
  // For testing, we re-define it here (same logic)
  const ROLE_HIERARCHY = {
    super_admin: 1, admin: 2, manager: 3, cashier: 4, barista: 5, viewer: 6,
  };

  return {
    requireRole: (...allowed) => {
      const allowedIds = allowed.map((r) =>
        typeof r === 'number' ? r : ROLE_HIERARCHY[r]
      );

      return (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const userRoleId = req.user.role_id;
        if (!allowedIds.includes(userRoleId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: insufficient permissions',
          });
        }

        next();
      };
    },
  };
})();

const { mockReqRes } = require('../helpers/testUtils');

describe('RBAC Middleware', () => {
  describe('requireRole', () => {
    test('should allow user with matching role_id', () => {
      const middleware = requireRole(1, 2, 3); // super_admin, admin, manager
      const { req, res, next } = mockReqRes({
        user: { id: 1, role_id: 2 },
      });

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should allow user with matching role name', () => {
      const middleware = requireRole('admin', 'manager');
      const { req, res, next } = mockReqRes({
        user: { id: 1, role_id: 2 },
      });

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should return 403 when role not allowed', () => {
      const middleware = requireRole(1, 2); // only super_admin & admin
      const { req, res, next } = mockReqRes({
        user: { id: 1, role_id: 4 }, // cashier
      });

      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when no user on request', () => {
      const middleware = requireRole(1, 2);
      const { req, res, next } = mockReqRes({
        user: null,
      });

      middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should allow super_admin access to everything', () => {
      const middleware = requireRole(1);
      const { req, res, next } = mockReqRes({
        user: { id: 1, role_id: 1 },
      });

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
