const { query, queryOne } = require('../../../../shared/database/mysql');
const ApiResponse = require('../../../../shared/utils/response');
const AuditLog = require('../../../../shared/utils/auditLog');

exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  let where = 'WHERE 1=1';
  const params = [];

  if (search) {
    where += ' AND (code LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [vouchers, countResult] = await Promise.all([
    query(
      `SELECT * FROM vouchers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    ),
    query(`SELECT COUNT(*) AS total FROM vouchers ${where}`, params),
  ]);

  const total = countResult[0].total;
  return ApiResponse.paginated(res, vouchers, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
};

exports.getOne = async (req, res) => {
  const voucher = await queryOne('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
  if (!voucher) return ApiResponse.notFound(res, 'Voucher not found');
  return ApiResponse.success(res, voucher);
};

exports.create = async (req, res) => {
  const { code, type = 'percentage', value, min_order_value = 0, max_usage = 100, expires_at, is_active = true, description = '' } = req.body;

  const existing = await queryOne('SELECT id FROM vouchers WHERE code = ?', [code]);
  if (existing) return ApiResponse.error(res, 'Mã voucher đã tồn tại', 409);

  const result = await query(
    `INSERT INTO vouchers (code, type, value, min_order_value, max_usage, expires_at, is_active, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code.trim().toUpperCase(), type, value, min_order_value, max_usage, expires_at || null, is_active ? 1 : 0, description]
  );

  const voucher = await queryOne('SELECT * FROM vouchers WHERE id = ?', [result.insertId]);

  await AuditLog.log(req, 'vouchers', result.insertId, 'CREATE', null, voucher);
  return ApiResponse.created(res, voucher, 'Tạo voucher thành công');
};

exports.update = async (req, res) => {
  const { code, type, value, min_order_value, max_usage, expires_at, is_active, description } = req.body;

  const voucher = await queryOne('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
  if (!voucher) return ApiResponse.notFound(res, 'Voucher not found');

  const oldData = { ...voucher };

  if (code && code !== voucher.code) {
    const dup = await queryOne('SELECT id FROM vouchers WHERE code = ? AND id != ?', [code, req.params.id]);
    if (dup) return ApiResponse.error(res, 'Mã voucher đã tồn tại', 409);
  }

  await query(
    `UPDATE vouchers SET
      code = ?, type = ?, value = ?, min_order_value = ?,
      max_usage = ?, expires_at = ?, is_active = ?, description = ?
     WHERE id = ?`,
    [
      code ? code.trim().toUpperCase() : voucher.code,
      type || voucher.type,
      value ?? voucher.value,
      min_order_value ?? voucher.min_order_value,
      max_usage ?? voucher.max_usage,
      expires_at !== undefined ? (expires_at || null) : voucher.expires_at,
      is_active !== undefined ? (is_active ? 1 : 0) : voucher.is_active,
      description !== undefined ? description : voucher.description,
      req.params.id,
    ]
  );

  const updated = await queryOne('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
  await AuditLog.log(req, 'vouchers', req.params.id, 'UPDATE', oldData, updated);
  return ApiResponse.success(res, updated, 'Cập nhật voucher thành công');
};

exports.remove = async (req, res) => {
  const voucher = await queryOne('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
  if (!voucher) return ApiResponse.notFound(res, 'Voucher not found');

  await query('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
  await AuditLog.log(req, 'vouchers', req.params.id, 'DELETE', voucher, null);
  return ApiResponse.success(res, null, 'Đã xóa voucher');
};

exports.validate = async (req, res) => {
  const { code, order_total = 0 } = req.body;
  if (!code) return ApiResponse.error(res, 'Thiếu mã voucher', 400);

  const voucher = await queryOne(
    `SELECT * FROM vouchers WHERE code = ? AND is_active = 1
     AND (expires_at IS NULL OR expires_at >= CURDATE())
     AND used_count < max_usage`,
    [code.trim().toUpperCase()]
  );

  if (!voucher) return ApiResponse.error(res, 'Voucher không hợp lệ hoặc đã hết hạn', 404);

  if (order_total < voucher.min_order_value) {
    return ApiResponse.error(
      res,
      `Đơn tối thiểu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(voucher.min_order_value)} để áp dụng voucher này`,
      400
    );
  }

  const discount = voucher.type === 'percentage'
    ? Math.round((order_total * voucher.value) / 100)
    : Math.min(voucher.value, order_total);

  return ApiResponse.success(res, {
    voucher,
    discount,
    type: voucher.type,
    code: voucher.code,
    value: voucher.value,
  });
};
