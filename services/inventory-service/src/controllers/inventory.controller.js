const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { Cache } = require('../../../../shared/redis/client');
const { publish } = require('../../../../shared/rabbitmq/client');
const EVENTS = require('../../../../shared/rabbitmq/events');
const ApiResponse = require('../../../../shared/utils/response');
const AuditLog = require('../../../../shared/utils/auditLog');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('Inventory-Controller');

exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, search = '',
      status, category_id, sort = 'p.name', order = 'ASC',
    } = req.query;

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
    if (status === 'low_stock') {
      where += ' AND i.quantity_available <= i.min_stock_level AND i.quantity_available > 0';
    } else if (status === 'out_of_stock') {
      where += ' AND i.quantity_available <= 0';
    } else if (status === 'in_stock') {
      where += ' AND i.quantity_available > i.min_stock_level';
    }

    const allowedSorts = ['p.name', 'i.quantity_available', 'i.quantity_in_stock', 'p.sku'];
    const sortField = allowedSorts.includes(sort) ? sort : 'p.name';

    const [items, countResult] = await Promise.all([
      query(
        `SELECT
          p.id, p.uuid, p.name, p.sku, p.thumbnail_url, p.unit, p.price,
          c.name AS category_name,
          i.id AS inventory_id,
          i.quantity_in_stock,
          i.quantity_reserved,
          i.quantity_available,
          i.min_stock_level,
          i.max_stock_level,
          i.reorder_point,
          i.last_restock_at,
          CASE
            WHEN i.quantity_available <= 0 THEN 'out_of_stock'
            WHEN i.quantity_available <= i.min_stock_level THEN 'low_stock'
            ELSE 'in_stock'
          END AS stock_status
         FROM inventory i
         JOIN product_db.products p ON p.id = i.product_id
         LEFT JOIN category_db.categories c ON p.category_id = c.id
         ${where}
         ORDER BY ${sortField} ${order === 'DESC' ? 'DESC' : 'ASC'}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(
        `SELECT COUNT(*) AS total
         FROM inventory i
         JOIN product_db.products p ON p.id = i.product_id
         ${where}`,
        params
      ),
    ]);

    const total = countResult[0].total;
    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, items, pagination);
  } catch (error) {
    logger.error('Get inventory error:', error);
    throw error;
  }
};

exports.getOne = async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await queryOne(
      `SELECT
        p.id, p.uuid, p.name, p.sku, p.barcode, p.thumbnail_url, p.unit, p.price, p.cost_price,
        c.name AS category_name,
        i.id AS inventory_id,
        i.quantity_in_stock,
        i.quantity_reserved,
        i.quantity_available,
        i.min_stock_level,
        i.max_stock_level,
        i.reorder_point,
        i.location,
        i.last_restock_at,
        i.updated_at AS inventory_updated_at
       FROM inventory i
       JOIN product_db.products p ON p.id = i.product_id
       LEFT JOIN category_db.categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [productId]
    );

    if (!item) return ApiResponse.notFound(res, 'Inventory item not found');

    const transactions = await query(
      `SELECT it.*, u.full_name AS created_by_name
       FROM inventory_transactions it
       JOIN auth_db.users u ON it.user_id = u.id
       WHERE it.product_id = ?
       ORDER BY it.created_at DESC
       LIMIT 20`,
      [productId]
    );

    return ApiResponse.success(res, { ...item, transactions });
  } catch (error) {
    logger.error('Get inventory detail error:', error);
    throw error;
  }
};

exports.importStock = async (req, res) => {
  try {
    const { items, reference_no = null, notes = null } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    if (!items || items.length === 0) {
      return ApiResponse.badRequest(res, 'At least one item required');
    }

    const results = await transaction(async (conn) => {
      const importResults = [];

      for (const item of items) {
        const { product_id, quantity, unit_cost = 0 } = item;

        const current = await queryOne(
          'SELECT quantity_in_stock FROM inventory WHERE product_id = ?',
          [product_id]
        );

        if (!current) throw new Error(`Inventory not found for product ${product_id}`);

        const quantityBefore = parseFloat(current.quantity_in_stock);
        const quantityAfter = quantityBefore + parseFloat(quantity);

        await conn.execute(
          `UPDATE inventory SET
            quantity_in_stock = quantity_in_stock + ?,
            last_restock_at = NOW(),
            updated_at = NOW()
           WHERE product_id = ?`,
          [quantity, product_id]
        );

        await conn.execute(
          `INSERT INTO inventory_transactions
            (product_id, user_id, type, quantity, quantity_before,
             quantity_after, unit_cost, total_cost, reference_no, notes)
           VALUES (?, ?, ?, 'import', ?, ?, ?, ?, ?, ?, ?)`,
          [
            product_id, userId, quantity,
            quantityBefore, quantityAfter,
            unit_cost, unit_cost * quantity,
            reference_no, notes,
          ]
        );

        importResults.push({ product_id, quantity, quantityBefore, quantityAfter });
      }

      return importResults;
    });

    await publish(EVENTS.STOCK_IMPORTED, {
      items: results,
      userId,
      referenceNo: reference_no,
    });

    await checkAndPublishLowStockAlerts(items.map((i) => i.product_id));

    await AuditLog.log({
      userId,
      action: 'IMPORT_STOCK',
      module: 'inventory',
      entityType: 'inventory_transaction',
      newValues: { itemCount: results.length, referenceNo: reference_no },
      ...AuditLog.extractRequestInfo(req),
    });

    return ApiResponse.success(res, results, `Successfully imported ${items.length} items`);
  } catch (error) {
    logger.error('Import stock error:', error);
    throw error;
  }
};

exports.exportStock = async (req, res) => {
  try {
    const { items, reference_no = null, notes = null } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    const results = await transaction(async (conn) => {
      const exportResults = [];

      for (const item of items) {
        const { product_id, quantity } = item;

        const current = await queryOne(
          'SELECT quantity_in_stock, quantity_available FROM inventory WHERE product_id = ?',
          [product_id]
        );

        if (!current) throw new Error(`Inventory not found for product ${product_id}`);
        if (current.quantity_available < quantity) {
          const product = await queryOne('SELECT name FROM products WHERE id = ?', [product_id]);
          throw new Error(`Insufficient stock for ${product?.name}. Available: ${current.quantity_available}`);
        }

        const quantityBefore = parseFloat(current.quantity_in_stock);
        const quantityAfter = quantityBefore - parseFloat(quantity);

        await conn.execute(
          `UPDATE inventory SET
            quantity_in_stock = quantity_in_stock - ?,
            updated_at = NOW()
           WHERE product_id = ?`,
          [quantity, product_id]
        );

        await conn.execute(
          `INSERT INTO inventory_transactions
            (product_id, user_id, type, quantity, quantity_before, quantity_after, reference_no, notes)
           VALUES (?, ?, 'export', ?, ?, ?, ?, ?)`,
          [product_id, userId, quantity, quantityBefore, quantityAfter, reference_no, notes]
        );

        exportResults.push({ product_id, quantity, quantityBefore, quantityAfter });
      }

      return exportResults;
    });

    await checkAndPublishLowStockAlerts(items.map((i) => i.product_id));

    await AuditLog.log({
      userId,
      action: 'EXPORT_STOCK',
      module: 'inventory',
      entityType: 'inventory_transaction',
      newValues: { itemCount: results.length, referenceNo: reference_no },
      ...AuditLog.extractRequestInfo(req),
    });

    return ApiResponse.success(res, results, `Successfully exported ${items.length} items`);
  } catch (error) {
    logger.error('Export stock error:', error);
    throw error;
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { product_id, new_quantity, reason, notes } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    const current = await queryOne(
      'SELECT quantity_in_stock FROM inventory WHERE product_id = ?',
      [product_id]
    );

    if (!current) return ApiResponse.notFound(res, 'Inventory item not found');

    const quantityBefore = parseFloat(current.quantity_in_stock);
    const diff = parseFloat(new_quantity) - quantityBefore;

    await transaction(async (conn) => {
      await conn.execute(
        'UPDATE inventory SET quantity_in_stock = ?, updated_at = NOW() WHERE product_id = ?',
        [new_quantity, product_id]
      );

      await conn.execute(
        `INSERT INTO inventory_transactions
          (product_id, user_id, type, quantity, quantity_before, quantity_after, notes)
         VALUES (?, ?, 'adjustment', ?, ?, ?, ?)`,
        [product_id, userId, Math.abs(diff), quantityBefore, new_quantity,
          `${reason || 'Stock adjustment'}. ${notes || ''}`]
      );
    });

    await checkAndPublishLowStockAlerts([product_id]);

    await AuditLog.log({
      userId,
      action: 'ADJUST_STOCK',
      module: 'inventory',
      entityType: 'inventory',
      entityId: product_id,
      oldValues: { quantity: quantityBefore },
      newValues: { quantity: new_quantity, diff, reason },
      ...AuditLog.extractRequestInfo(req),
    });

    return ApiResponse.success(res, { product_id, quantityBefore, new_quantity, diff }, 'Stock adjusted');
  } catch (error) {
    logger.error('Adjust stock error:', error);
    throw error;
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, product_id, type,
      date_from, date_to, user_id,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE 1=1';
    const params = [];

    if (product_id) { where += ' AND it.product_id = ?'; params.push(product_id); }
    if (type) { where += ' AND it.type = ?'; params.push(type); }
    if (date_from) { where += ' AND DATE(it.created_at) >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND DATE(it.created_at) <= ?'; params.push(date_to); }
    if (user_id) { where += ' AND it.user_id = ?'; params.push(user_id); }

    const [rows, countResult] = await Promise.all([
      query(
        `SELECT
          it.id, it.uuid, it.type, it.quantity, it.quantity_before, it.quantity_after,
          it.unit_cost, it.total_cost, it.reference_no, it.notes, it.created_at,
          p.name AS product_name, p.sku AS product_sku, p.thumbnail_url,
          u.full_name AS created_by_name
         FROM inventory_transactions it
         JOIN product_db.products p ON it.product_id = p.id
         JOIN auth_db.users u ON it.user_id = u.id
         ${where}
         ORDER BY it.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM inventory_transactions it ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, rows, pagination);
  } catch (error) {
    logger.error('Get transactions error:', error);
    throw error;
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const alerts = await query(
      `SELECT
        p.id, p.name, p.sku, p.thumbnail_url,
        c.name AS category_name,
        i.quantity_available, i.min_stock_level, i.reorder_point,
        CASE
          WHEN i.quantity_available <= 0 THEN 'critical'
          WHEN i.quantity_available <= (i.min_stock_level * 0.5) THEN 'high'
          ELSE 'medium'
        END AS severity
       FROM inventory i
       JOIN product_db.products p ON i.product_id = p.id
       LEFT JOIN category_db.categories c ON p.category_id = c.id
       WHERE i.quantity_available <= i.min_stock_level
         AND p.is_active = 1
         AND p.deleted_at IS NULL
       ORDER BY i.quantity_available ASC`
    );

    return ApiResponse.success(res, alerts);
  } catch (error) {
    logger.error('Get low stock alerts error:', error);
    throw error;
  }
};

exports.getStats = async (req, res) => {
  try {
    const cacheKey = 'inventory:stats';
    const cached = await Cache.get(cacheKey);
    if (cached) return ApiResponse.success(res, cached);

    const stats = await queryOne(
      `SELECT
        COUNT(*) AS total_skus,
        SUM(i.quantity_in_stock * p.cost_price) AS total_stock_value,
        SUM(CASE WHEN i.quantity_available <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        SUM(CASE WHEN i.quantity_available <= i.min_stock_level AND i.quantity_available > 0 THEN 1 ELSE 0 END) AS low_stock_count,
        SUM(CASE WHEN i.quantity_available > i.min_stock_level THEN 1 ELSE 0 END) AS in_stock_count
       FROM inventory i
       JOIN product_db.products p ON i.product_id = p.id
       WHERE p.deleted_at IS NULL AND p.is_active = 1`
    );

    await Cache.set(cacheKey, stats, 120);
    return ApiResponse.success(res, stats);
  } catch (error) {
    logger.error('Get inventory stats error:', error);
    throw error;
  }
};

async function checkAndPublishLowStockAlerts(productIds) {
  try {
    for (const productId of productIds) {
      const item = await queryOne(
        `SELECT p.name, p.sku, i.quantity_available, i.min_stock_level, i.reorder_point
         FROM inventory i JOIN product_db.products p ON i.product_id = p.id
         WHERE i.product_id = ?`,
        [productId]
      );

      if (!item) continue;

      if (item.quantity_available <= 0) {
        await publish(EVENTS.INVENTORY_OUT_OF_STOCK, {
          productId, productName: item.name, sku: item.sku,
          currentStock: item.quantity_available,
        });
      } else if (item.quantity_available <= item.min_stock_level) {
        await publish(EVENTS.INVENTORY_LOW_STOCK, {
          productId, productName: item.name, sku: item.sku,
          currentStock: item.quantity_available,
          minLevel: item.min_stock_level,
          reorderPoint: item.reorder_point,
        });
      }
    }
  } catch (error) {
    logger.error('Low stock alert check error:', error);
  }
}
