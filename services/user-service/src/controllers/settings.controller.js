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
  notifications: {
    low_stock: true,
    new_order: true,
    payment_failed: true,
    daily_report: false,
    weekly_report: true,
  },
  roles: {
    admin: {
      products: ['read', 'write', 'delete'],
      categories: ['read', 'write', 'delete'],
      inventory: ['read', 'write', 'delete'],
      orders: ['read', 'write', 'delete'],
      payments: ['read', 'write', 'delete'],
      customers: ['read', 'write', 'delete'],
      employees: ['read', 'write', 'delete'],
      suppliers: ['read', 'write', 'delete'],
      promotions: ['read', 'write', 'delete'],
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
      suppliers: ['read', 'write'],
      promotions: ['read', 'write'],
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
      promotions: ['read'],
    },
    barista: {
      products: ['read'],
      orders: ['read'],
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

exports.getNotifications = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM settings WHERE `key` LIKE "notif.%"');
    if (rows.length > 0) {
      const notif = {};
      rows.forEach((r) => { notif[r.key.replace('notif.', '')] = r.value === 'true' || r.value === '1'; });
      return ApiResponse.success(res, notif);
    }
    return ApiResponse.success(res, cachedSettings.notifications);
  } catch {
    return ApiResponse.success(res, cachedSettings.notifications);
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [`notif.${key}`, String(value), String(value)]
      );
    }
    cachedSettings.notifications = { ...cachedSettings.notifications, ...req.body };
    return ApiResponse.success(res, cachedSettings.notifications, 'Notifications updated');
  } catch {
    cachedSettings.notifications = { ...cachedSettings.notifications, ...req.body };
    return ApiResponse.success(res, cachedSettings.notifications, 'Notifications saved (cache)');
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
      role: { 1: 'admin', 2: 'manager', 3: 'cashier', 4: 'barista' }[u.role_id] || 'unknown',
    }));
    return ApiResponse.success(res, mapped);
  } catch {
    return ApiResponse.success(res, []);
  }
};
