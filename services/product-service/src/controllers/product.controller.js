const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { Cache } = require('../../../../shared/redis/client');
const ApiResponse = require('../../../../shared/utils/response');
const AuditLog = require('../../../../shared/utils/auditLog');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('Product-Controller');

exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, search = '', category_id, status } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  let where = 'WHERE p.deleted_at IS NULL';
  const params = [];

  if (search) {
    where += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    where += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (status === 'active') where += ' AND p.is_active = 1';
  if (status === 'inactive') where += ' AND p.is_active = 0';

  const [items, countResult] = await Promise.all([
    query(
      `SELECT p.*, c.name AS category_name,
              i.quantity_in_stock, i.quantity_available
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    ),
    query(`SELECT COUNT(*) AS total FROM products p ${where}`, params),
  ]);

  const total = countResult[0].total;
  return ApiResponse.paginated(res, items, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
};

exports.getOne = async (req, res) => {
  const product = await queryOne(
    `SELECT p.*, c.name AS category_name,
            i.quantity_in_stock, i.quantity_reserved, i.quantity_available
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN inventory i ON p.id = i.product_id
     WHERE p.id = ? AND p.deleted_at IS NULL`,
    [req.params.id]
  );
  if (!product) return ApiResponse.notFound(res, 'Product not found');
  return ApiResponse.success(res, product);
};

exports.create = async (req, res) => {
  const {
    name, sku, category_id, price, cost_price = 0,
    description, barcode, unit = 'pcs', is_active = true, initial_stock = 0,
    image_url, thumbnail_url,
  } = req.body;

  const existing = await queryOne('SELECT id FROM products WHERE sku = ? AND deleted_at IS NULL', [sku]);
  if (existing) return ApiResponse.conflict(res, 'SKU already exists');

  const product = await transaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO products (name, sku, barcode, description, category_id, price, cost_price, unit, is_active, thumbnail_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, barcode || null, description || null, category_id, price, cost_price, unit, is_active ? 1 : 0, image_url || thumbnail_url || null]
    );
    const productId = result.insertId;
    await conn.execute(
      `INSERT INTO inventory (product_id, quantity_in_stock, min_stock_level)
       VALUES (?, ?, 10)`,
      [productId, initial_stock]
    );
    const [rows] = await conn.execute('SELECT * FROM products WHERE id = ?', [productId]);
    return rows[0];
  });

  await Cache.delPattern('products:*');
  await AuditLog.log({
    userId: req.headers['x-user-id'] || null,
    action: 'CREATE_PRODUCT',
    module: 'product',
    entityType: 'product',
    entityId: product.id,
    newValues: { name, sku, price, category_id },
    ...AuditLog.extractRequestInfo(req),
  });
  return ApiResponse.created(res, product, 'Product created');
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!existing) return ApiResponse.notFound(res, 'Product not found');

  const fields = ['name', 'sku', 'barcode', 'description', 'category_id', 'price', 'cost_price', 'unit', 'is_active', 'thumbnail_url'];
  const fieldMap = { image_url: 'thumbnail_url' };
  const updates = [];
  const params = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(f === 'is_active' ? (req.body[f] ? 1 : 0) : req.body[f]);
    }
  });
  // Also support image_url as alias for thumbnail_url
  if (req.body.image_url !== undefined && !fields.some((f) => req.body[f] !== undefined && f === 'thumbnail_url')) {
    updates.push('thumbnail_url = ?');
    params.push(req.body.image_url);
  }
  if (!updates.length) return ApiResponse.badRequest(res, 'No fields to update');

  params.push(id);
  await query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
  const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
  await Cache.delPattern('products:*');
  await AuditLog.log({
    userId: req.headers['x-user-id'] || null,
    action: 'UPDATE_PRODUCT',
    module: 'product',
    entityType: 'product',
    entityId: id,
    oldValues: existing,
    newValues: product,
    ...AuditLog.extractRequestInfo(req),
  });
  return ApiResponse.success(res, product, 'Product updated');
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!existing) return ApiResponse.notFound(res, 'Product not found');
  await query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [id]);
  await Cache.delPattern('products:*');
  await AuditLog.log({
    userId: req.headers['x-user-id'] || null,
    action: 'DELETE_PRODUCT',
    module: 'product',
    entityType: 'product',
    entityId: id,
    ...AuditLog.extractRequestInfo(req),
  });
  return ApiResponse.success(res, null, 'Product deleted');
};
