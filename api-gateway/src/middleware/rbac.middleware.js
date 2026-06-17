/**
 * RBAC Middleware — Role-Based Access Control
 * 
 * Role mapping (match init.sql):
 *   1 = super_admin (toàn quyền)
 *   2 = admin       (quản trị)
 *   3 = manager     (quản lý cửa hàng)
 *   4 = cashier     (thu ngân)
 *   5 = barista     (pha chế)
 *   6 = viewer      (chỉ xem)
 */

const ROLE_HIERARCHY = {
  super_admin: 1,
  admin: 2,
  manager: 3,
  cashier: 4,
  barista: 5,
  viewer: 6,
};

// Returns a middleware that restricts access to the given roles (by name or id)
const requireRole = (...allowed) => {
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
};

// Role-based route restrictions for proxy paths.
// Only methods listed are restricted; unlisted methods are allowed for all.
// Use '*' as method to restrict ALL methods.
const ROLE_RULES = [
  // ── Products ──
  { path: '/api/v1/products', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3] },
  { path: '/api/products', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3] },
  // ── Categories ──
  { path: '/api/v1/categories', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3] },
  { path: '/api/categories', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3] },
  // ── Inventory ──
  { path: '/api/v1/inventory', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3] },
  { path: '/api/inventory', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3] },
  // ── Orders: cashier+ can create, manager+ can update/delete ──
  { path: '/api/v1/orders', methods: ['POST'], roles: [1, 2, 3, 4] },
  { path: '/api/v1/orders', methods: ['PUT', 'DELETE'], roles: [1, 2, 3] },
  { path: '/api/orders', methods: ['POST'], roles: [1, 2, 3, 4] },
  { path: '/api/orders', methods: ['PUT', 'DELETE'], roles: [1, 2, 3] },
  // ── Payments ──
  { path: '/api/v1/payments', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3, 4] },
  { path: '/api/payments', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3, 4] },
  // ── Customers ──
  { path: '/api/v1/users', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3, 4] },
  { path: '/api/users', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2, 3, 4] },
  // ── Employees: super_admin & admin only ──
  { path: '/api/v1/employees', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2] },
  { path: '/api/employees', methods: ['POST', 'PUT', 'DELETE'], roles: [1, 2] },
  // ── Settings ──
  { path: '/api/v1/settings', methods: '*', roles: [1, 2] },
  { path: '/api/v1/settings', methods: ['GET'], roles: [1, 2, 3] },
  { path: '/api/settings', methods: '*', roles: [1, 2] },
  { path: '/api/settings', methods: ['GET'], roles: [1, 2, 3] },
  // ── Analytics ──
  { path: '/api/v1/analytics', methods: '*', roles: [1, 2, 3] },
  { path: '/api/analytics', methods: '*', roles: [1, 2, 3] },
  // ── Users management ──
  { path: '/api/v1/users', methods: ['GET'], roles: [1, 2] },
  { path: '/api/users', methods: ['GET'], roles: [1, 2] },
];

const applyRbac = (app) => {
  app.use((req, res, next) => {
    // Only check /api routes with an authenticated user
    if (!req.path.startsWith('/api') || !req.user) {
      return next();
    }

    const method = req.method;
    const path = req.path;

    // Find matching rules
    for (const rule of ROLE_RULES) {
      if (!path.startsWith(rule.path)) continue;

      const methodsMatch =
        rule.methods === '*' || rule.methods.includes(method);
      if (!methodsMatch) continue;

      const userRoleId = req.user.role_id;
      if (!rule.roles.includes(userRoleId)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: role ${userRoleId} cannot ${method} ${rule.path}`,
        });
      }
      // Found a matching restriction and user passed — stop checking
      break;
    }

    next();
  });
};

module.exports = { requireRole, applyRbac, ROLE_HIERARCHY };
