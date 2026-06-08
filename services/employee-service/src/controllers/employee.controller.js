const { query, queryOne } = require('../../../../shared/database/mysql');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('Employee-Controller');

const generateEmployeeCode = async () => {
  const count = await queryOne('SELECT COUNT(*) AS total FROM employees');
  return `EMP-${String(count.total + 1).padStart(4, '0')}`;
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, department } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE e.status != "terminated"';
    const params = [];

    if (search) {
      where += ' AND (u.full_name LIKE ? OR e.employee_code LIKE ? OR e.position LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { where += ' AND e.status = ?'; params.push(status); }
    if (department) { where += ' AND e.department = ?'; params.push(department); }

    const [employees, countResult] = await Promise.all([
      query(
        `SELECT e.*, u.full_name, u.email, u.phone, u.avatar_url,
                r.name AS role, r.display_name AS role_display
         FROM employees e
         JOIN users u ON e.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         ${where}
         ORDER BY u.full_name ASC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM employees e JOIN users u ON e.user_id = u.id ${where}`,
        params
      ),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, employees, pagination);
  } catch (error) {
    logger.error('Get employees error:', error);
    throw error;
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await queryOne(
      `SELECT e.*, u.full_name, u.email, u.phone, u.avatar_url, u.is_active,
              r.name AS role, r.display_name AS role_display
       FROM employees e
       JOIN users u ON e.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       WHERE e.id = ? OR e.uuid = ? OR e.employee_code = ?`,
      [id, id, id]
    );

    if (!employee) return ApiResponse.notFound(res, 'Employee not found');

    const stats = await queryOne(
      `SELECT COUNT(*) AS total_orders_handled,
              SUM(o.total_amount) AS total_sales_generated
       FROM orders o WHERE o.cashier_id = ? AND o.status = 'completed'`,
      [employee.user_id]
    );

    return ApiResponse.success(res, { ...employee, stats });
  } catch (error) {
    logger.error('Get employee error:', error);
    throw error;
  }
};

exports.create = async (req, res) => {
  try {
    const {
      user_id, position, department, hire_date, salary,
      salary_type = 'monthly', bank_account, bank_name,
      emergency_contact_name, emergency_contact_phone,
      national_id, address, notes,
    } = req.body;

    const user = await queryOne('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) return ApiResponse.notFound(res, 'User not found');

    const existing = await queryOne('SELECT id FROM employees WHERE user_id = ?', [user_id]);
    if (existing) return ApiResponse.conflict(res, 'Employee record already exists for this user');

    const employeeCode = await generateEmployeeCode();

    const result = await query(
      `INSERT INTO employees
        (user_id, employee_code, position, department, hire_date, salary, salary_type,
         bank_account, bank_name, emergency_contact_name, emergency_contact_phone,
         national_id, address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, employeeCode, position, department || null, hire_date,
        salary || null, salary_type, bank_account || null, bank_name || null,
        emergency_contact_name || null, emergency_contact_phone || null,
        national_id || null, address || null, notes || null,
      ]
    );

    const employee = await queryOne(
      'SELECT e.*, u.full_name, u.email FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?',
      [result.insertId]
    );

    return ApiResponse.created(res, employee, 'Employee created successfully');
  } catch (error) {
    logger.error('Create employee error:', error);
    throw error;
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await queryOne('SELECT id, user_id FROM employees WHERE id = ?', [id]);
    if (!employee) return ApiResponse.notFound(res, 'Employee not found');

    const {
      position, department, salary, salary_type, bank_account,
      bank_name, emergency_contact_name, emergency_contact_phone,
      national_id, address, notes, status, end_date,
      full_name, email, phone, role, avatar_url,
    } = req.body;

    await query(
      `UPDATE employees SET
        position = COALESCE(?, position),
        department = COALESCE(?, department),
        salary = COALESCE(?, salary),
        salary_type = COALESCE(?, salary_type),
        bank_account = COALESCE(?, bank_account),
        bank_name = COALESCE(?, bank_name),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        national_id = COALESCE(?, national_id),
        address = COALESCE(?, address),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status),
        end_date = COALESCE(?, end_date),
        updated_at = NOW()
       WHERE id = ?`,
      [position, department, salary, salary_type, bank_account, bank_name,
        emergency_contact_name, emergency_contact_phone, national_id, address,
        notes, status, end_date || null, id]
    );

    // Update user fields if provided
    const userUpdateFields = [];
    const userUpdateParams = [];
    if (full_name !== undefined) { userUpdateFields.push('full_name = ?'); userUpdateParams.push(full_name); }
    if (email !== undefined) { userUpdateFields.push('email = ?'); userUpdateParams.push(email); }
    if (phone !== undefined) { userUpdateFields.push('phone = ?'); userUpdateParams.push(phone); }
    if (avatar_url !== undefined) { userUpdateFields.push('avatar_url = ?'); userUpdateParams.push(avatar_url); }
    if (role !== undefined) {
      const roleRow = await queryOne('SELECT id FROM roles WHERE name = ?', [role]);
      if (roleRow) { userUpdateFields.push('role_id = ?'); userUpdateParams.push(roleRow.id); }
    }
    if (userUpdateFields.length > 0) {
      userUpdateParams.push(employee.user_id);
      await query(`UPDATE users SET ${userUpdateFields.join(', ')}, updated_at = NOW() WHERE id = ?`, userUpdateParams);
    }

    const updated = await queryOne(
      `SELECT e.*, u.full_name, u.email, u.phone, u.avatar_url,
              r.name AS role, r.display_name AS role_display
       FROM employees e JOIN users u ON e.user_id = u.id
       JOIN roles r ON u.role_id = r.id WHERE e.id = ?`,
      [id]
    );
    return ApiResponse.success(res, updated, 'Employee updated successfully');
  } catch (error) {
    logger.error('Update employee error:', error);
    throw error;
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await queryOne('SELECT * FROM employees WHERE id = ?', [id]);
    if (!employee) return ApiResponse.notFound(res, 'Không tìm thấy nhân viên');

    await query(
      'UPDATE employees SET status = "terminated", end_date = CURDATE(), updated_at = NOW() WHERE id = ?',
      [id]
    );

    return ApiResponse.success(res, null, 'Đã xóa nhân viên');
  } catch (error) {
    logger.error('Delete employee error:', error);
    throw error;
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await queryOne(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'on_leave' THEN 1 ELSE 0 END) AS on_leave,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive
       FROM employees`
    );
    return ApiResponse.success(res, stats);
  } catch (error) {
    logger.error('Get employee stats error:', error);
    throw error;
  }
};
