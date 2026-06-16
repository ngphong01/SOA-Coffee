const { query, queryOne } = require('../../../../shared/database/mysql');
const ApiResponse = require('../../../../shared/utils/response');

// Simple in-memory fallback since settings table may not exist
let cachedSettings = {
  general: {
    shop_name: 'Quán Cà Phê',
    address: '123 Đường Cà Phê, Quận 1, TP.HCM',
    phone: '0901234567',
    email: 'contact@coffeeshop.vn',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    open_time: '07:00',
    close_time: '22:00',
    tax_rate: '10',
  },
  roles: {
    super_admin: {
      products: ['read', 'write', 'delete'],
      categories: ['read', 'write', 'delete'],
      inventory: ['read', 'write', 'delete'],
      orders: ['read', 'write', 'delete'],
      payments: ['read', 'write', 'delete'],
      customers: ['read', 'write', 'delete'],
      employees: ['read', 'write', 'delete'],
      analytics: ['read', 'write', 'delete'],
      settings: ['read', 'write', 'delete'],
    },
    admin: {
      products: ['read', 'write', 'delete'],
      categories: ['read', 'write', 'delete'],
      inventory: ['read', 'write', 'delete'],
      orders: ['read', 'write', 'delete'],
      payments: ['read', 'write', 'delete'],
      customers: ['read', 'write', 'delete'],
      employees: ['read', 'write', 'delete'],
      analytics: ['read', 'write', 'delete'],
      settings: ['read', 'write', 'delete'],
    },
    manager: {
      products: ['read', 'write'],
      categories: ['read', 'write'],
      inventory: ['read', 'write'],
      orders: ['read', 'write', 'delete'],
      payments: ['read', 'write'],
      customers: ['read', 'write'],
      employees: ['read'],
      analytics: ['read'],
      settings: ['read'],
    },
    cashier: {
      products: ['read'],
      categories: ['read'],
      inventory: ['read'],
      orders: ['read', 'write'],
      payments: ['read', 'write'],
      customers: ['read', 'write'],
    },
    barista: {
      products: ['read'],
      orders: ['read'],
    },
    viewer: {
      products: ['read'],
      categories: ['read'],
      inventory: ['read'],
      orders: ['read'],
      payments: ['read'],
      customers: ['read'],
      employees: ['read'],
      analytics: ['read'],
      settings: ['read'],
    },
  },
};

exports.getGeneral = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM settings WHERE `key` LIKE "general.%"');
    if (rows.length > 0) {
      const general = {};
      rows.forEach((r) => { general[r.key.replace('general.', '')] = r.value; });
      return ApiResponse.success(res, general);
    }
    return ApiResponse.success(res, cachedSettings.general);
  } catch {
    return ApiResponse.success(res, cachedSettings.general);
  }
};

exports.updateGeneral = async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [`general.${key}`, String(value), String(value)]
      );
    }
    cachedSettings.general = { ...cachedSettings.general, ...req.body };
    return ApiResponse.success(res, cachedSettings.general, 'Settings updated');
  } catch {
    cachedSettings.general = { ...cachedSettings.general, ...req.body };
    return ApiResponse.success(res, cachedSettings.general, 'Settings saved (cache)');
  }
};

exports.getRoles = async (req, res) => {
  return ApiResponse.success(res, cachedSettings.roles);
};

exports.updateRoles = async (req, res) => {
  cachedSettings.roles = { ...cachedSettings.roles, ...req.body };
  return ApiResponse.success(res, cachedSettings.roles, 'Roles updated');
};

exports.getUsers = async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, full_name, phone, role_id, is_active, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    const mapped = users.map((u) => ({
      ...u,
      role: { 1: 'super_admin', 2: 'admin', 3: 'manager', 4: 'cashier', 5: 'barista', 6: 'viewer' }[u.role_id] || 'unknown',
    }));
    return ApiResponse.success(res, mapped);
  } catch {
    return ApiResponse.success(res, []);
  }
};
