const { query, queryOne } = require('../../../../shared/database/mysql');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('User-Controller');

exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', segment, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE c.is_active = 1 AND c.deleted_at IS NULL';
    const params = [];

    if (search) {
      where += ' AND (c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (segment) { where += ' AND c.segment = ?'; params.push(segment); }

    const allowedSorts = ['full_name', 'total_spent', 'total_orders', 'created_at', 'loyalty_points'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';

    const [customers, countResult] = await Promise.all([
      query(
        `SELECT id, uuid, full_name, email, phone, date_of_birth, gender,
                loyalty_points, total_spent, total_orders, segment, is_active, created_at
         FROM customers c ${where}
         ORDER BY c.${sortField} ${order === 'ASC' ? 'ASC' : 'DESC'}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM customers c ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, customers, pagination);
  } catch (error) {
    logger.error('Get customers error:', error);
    throw error;
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await queryOne(
      'SELECT * FROM customers WHERE (id = ? OR uuid = ?) AND deleted_at IS NULL',
      [id, id]
    );

    if (!customer) return ApiResponse.notFound(res, 'Customer not found');

    const orders = await query(
      `SELECT o.order_number, o.status, o.total_amount, o.created_at,
              COUNT(oi.id) AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [customer.id]
    );

    return ApiResponse.success(res, { ...customer, recent_orders: orders });
  } catch (error) {
    logger.error('Get customer error:', error);
    throw error;
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { full_name, email, phone, date_of_birth, gender, address, notes } = req.body;

    if (email) {
      const exists = await queryOne('SELECT id FROM customers WHERE email = ?', [email]);
      if (exists) return ApiResponse.conflict(res, 'Email already registered');
    }
    if (phone) {
      const exists = await queryOne('SELECT id FROM customers WHERE phone = ?', [phone]);
      if (exists) return ApiResponse.conflict(res, 'Phone already registered');
    }

    const result = await query(
      `INSERT INTO customers (full_name, email, phone, date_of_birth, gender, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email || null, phone || null, date_of_birth || null,
        gender || null, address || null, notes || null]
    );

    const customer = await queryOne('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    return ApiResponse.created(res, customer, 'Customer created successfully');
  } catch (error) {
    logger.error('Create customer error:', error);
    throw error;
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, date_of_birth, gender, address, notes, is_active } = req.body;

    const customer = await queryOne('SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!customer) return ApiResponse.notFound(res, 'Customer not found');

    await query(
      `UPDATE customers SET
        full_name = COALESCE(?, full_name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender),
        address = COALESCE(?, address),
        notes = COALESCE(?, notes),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [full_name, email, phone, date_of_birth, gender, address, notes, is_active, id]
    );

    const updated = await queryOne('SELECT * FROM customers WHERE id = ?', [id]);
    return ApiResponse.success(res, updated, 'Customer updated successfully');
  } catch (error) {
    logger.error('Update customer error:', error);
    throw error;
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE customers SET deleted_at = NOW() WHERE id = ?', [id]);
    return ApiResponse.success(res, null, 'Customer deleted');
  } catch (error) {
    logger.error('Delete customer error:', error);
    throw error;
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role_id, is_active } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE u.deleted_at IS NULL';
    const params = [];

    if (search) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role_id) { where += ' AND u.role_id = ?'; params.push(role_id); }
    if (is_active !== undefined) { where += ' AND u.is_active = ?'; params.push(is_active); }

    const [users, countResult] = await Promise.all([
      query(
        `SELECT u.id, u.uuid, u.full_name, u.email, u.phone, u.avatar_url,
                u.is_active, u.is_verified, u.last_login_at, u.created_at,
                r.name AS role, r.display_name AS role_display
         FROM users u
         JOIN roles r ON u.role_id = r.id
         ${where}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM users u ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, users, pagination);
  } catch (error) {
    logger.error('Get users error:', error);
    throw error;
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return ApiResponse.unauthorized(res, 'User not authenticated');

    const { full_name, phone, avatar_url } = req.body;
    const updates = [];
    const params = [];

    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url); }

    if (updates.length === 0) return ApiResponse.badRequest(res, 'No fields to update');

    updates.push('updated_at = NOW()');
    params.push(userId);

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updated = await queryOne(
      'SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, r.name AS role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [userId]
    );

    return ApiResponse.success(res, updated, 'Profile updated');
  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await queryOne('SELECT id, is_active FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!user) return ApiResponse.notFound(res, 'User not found');

    const newStatus = !user.is_active;
    await query('UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);
    return ApiResponse.success(res, { is_active: newStatus }, `User ${newStatus ? 'activated' : 'deactivated'}`);
  } catch (error) {
    logger.error('Toggle user status error:', error);
    throw error;
  }
};
