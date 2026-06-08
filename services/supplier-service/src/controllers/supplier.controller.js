const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('Supplier-Controller');

const generatePONumber = () =>
  `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;

exports.getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', is_active } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (s.company_name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (is_active !== undefined) { where += ' AND s.is_active = ?'; params.push(is_active); }

    const [suppliers, countResult] = await Promise.all([
      query(
        `SELECT s.*,
                COUNT(po.id) AS total_pos,
                SUM(CASE WHEN po.status = 'received' THEN po.total_amount ELSE 0 END) AS total_purchased
         FROM suppliers s
         LEFT JOIN purchase_orders po ON s.id = po.supplier_id
         ${where}
         GROUP BY s.id
         ORDER BY s.company_name ASC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM suppliers s ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, suppliers, pagination);
  } catch (error) {
    logger.error('Get suppliers error:', error);
    throw error;
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await queryOne(
      'SELECT * FROM suppliers WHERE id = ? OR uuid = ?',
      [id, id]
    );

    if (!supplier) return ApiResponse.notFound(res, 'Supplier not found');

    const recentPOs = await query(
      `SELECT po.*, u.full_name AS created_by_name
       FROM purchase_orders po JOIN users u ON po.created_by = u.id
       WHERE po.supplier_id = ?
       ORDER BY po.created_at DESC LIMIT 10`,
      [supplier.id]
    );

    return ApiResponse.success(res, { ...supplier, recent_purchase_orders: recentPOs });
  } catch (error) {
    logger.error('Get supplier error:', error);
    throw error;
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { company_name, contact_person, email, phone, address, tax_code, payment_terms, notes } = req.body;

    const result = await query(
      `INSERT INTO suppliers (company_name, contact_person, email, phone, address, tax_code, payment_terms, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name, contact_person || null, email || null, phone || null,
        address || null, tax_code || null, payment_terms || 30, notes || null]
    );

    const supplier = await queryOne('SELECT * FROM suppliers WHERE id = ?', [result.insertId]);
    return ApiResponse.created(res, supplier, 'Supplier created successfully');
  } catch (error) {
    logger.error('Create supplier error:', error);
    throw error;
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await queryOne('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (!supplier) return ApiResponse.notFound(res, 'Supplier not found');

    const { company_name, contact_person, email, phone, address, tax_code, payment_terms, notes, is_active } = req.body;

    await query(
      `UPDATE suppliers SET
        company_name = COALESCE(?, company_name),
        contact_person = COALESCE(?, contact_person),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        tax_code = COALESCE(?, tax_code),
        payment_terms = COALESCE(?, payment_terms),
        notes = COALESCE(?, notes),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [company_name, contact_person, email, phone, address, tax_code, payment_terms, notes, is_active, id]
    );

    const updated = await queryOne('SELECT * FROM suppliers WHERE id = ?', [id]);
    return ApiResponse.success(res, updated, 'Supplier updated');
  } catch (error) {
    logger.error('Update supplier error:', error);
    throw error;
  }
};

exports.removeSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await queryOne('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (!supplier) return ApiResponse.notFound(res, 'Không tìm thấy nhà cung cấp');

    await query('UPDATE suppliers SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);

    return ApiResponse.success(res, null, 'Đã xóa nhà cung cấp');
  } catch (error) {
    logger.error('Delete supplier error:', error);
    throw error;
  }
};

exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, supplier_id, date_from, date_to } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND po.status = ?'; params.push(status); }
    if (supplier_id) { where += ' AND po.supplier_id = ?'; params.push(supplier_id); }
    if (date_from) { where += ' AND DATE(po.created_at) >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND DATE(po.created_at) <= ?'; params.push(date_to); }

    const [pos, countResult] = await Promise.all([
      query(
        `SELECT po.*, s.company_name AS supplier_name,
                u.full_name AS created_by_name,
                COUNT(poi.id) AS item_count
         FROM purchase_orders po
         JOIN suppliers s ON po.supplier_id = s.id
         JOIN users u ON po.created_by = u.id
         LEFT JOIN purchase_order_items poi ON po.id = poi.po_id
         ${where}
         GROUP BY po.id
         ORDER BY po.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM purchase_orders po ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, pos, pagination);
  } catch (error) {
    logger.error('Get purchase orders error:', error);
    throw error;
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { supplier_id, items, notes, expected_date } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    const supplier = await queryOne('SELECT id FROM suppliers WHERE id = ? AND is_active = 1', [supplier_id]);
    if (!supplier) return ApiResponse.notFound(res, 'Supplier not found');

    const poId = await transaction(async (conn) => {
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity_ordered * item.unit_cost;
      }
      const taxAmount = subtotal * 0.1;
      const totalAmount = subtotal + taxAmount;
      const poNumber = generatePONumber();

      const [poResult] = await conn.execute(
        `INSERT INTO purchase_orders
          (po_number, supplier_id, created_by, status, subtotal, tax_amount, total_amount, notes, expected_date)
         VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
        [poNumber, supplier_id, userId, subtotal, taxAmount, totalAmount, notes || null, expected_date || null]
      );

      for (const item of items) {
        await conn.execute(
          `INSERT INTO purchase_order_items (po_id, product_id, quantity_ordered, unit_cost, total_cost)
           VALUES (?, ?, ?, ?, ?)`,
          [poResult.insertId, item.product_id, item.quantity_ordered,
            item.unit_cost, item.quantity_ordered * item.unit_cost]
        );
      }

      return poResult.insertId;
    });

    const po = await queryOne('SELECT * FROM purchase_orders WHERE id = ?', [poId]);
    return ApiResponse.created(res, po, 'Purchase order created successfully');
  } catch (error) {
    logger.error('Create PO error:', error);
    throw error;
  }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, received_items } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    const po = await queryOne('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    if (!po) return ApiResponse.notFound(res, 'Purchase order not found');

    await query(
      `UPDATE purchase_orders SET
        status = ?,
        approved_by = CASE WHEN ? = 'confirmed' THEN ? ELSE approved_by END,
        received_at = CASE WHEN ? = 'received' THEN NOW() ELSE received_at END,
        paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END,
        updated_at = NOW()
       WHERE id = ?`,
      [status, status, userId, status, status, id]
    );

    if (status === 'received' && received_items && received_items.length > 0) {
      for (const item of received_items) {
        await query(
          'UPDATE purchase_order_items SET quantity_received = ? WHERE po_id = ? AND product_id = ?',
          [item.quantity_received, id, item.product_id]
        );

        await query(
          `UPDATE inventory SET
            quantity_in_stock = quantity_in_stock + ?,
            last_restock_at = NOW()
           WHERE product_id = ?`,
          [item.quantity_received, item.product_id]
        );

        await query(
          `INSERT INTO inventory_transactions
            (product_id, user_id, supplier_id, type, quantity, quantity_before, quantity_after, reference_no, notes)
           SELECT ?, ?, ?, 'import', ?, quantity_in_stock - ?, quantity_in_stock, ?, ?
           FROM inventory WHERE product_id = ?`,
          [item.product_id, userId, po.supplier_id, item.quantity_received,
            item.quantity_received, po.po_number, `Received from PO: ${po.po_number}`, item.product_id]
        );
      }
    }

    const updated = await queryOne('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    return ApiResponse.success(res, updated, `Purchase order ${status}`);
  } catch (error) {
    logger.error('Update PO status error:', error);
    throw error;
  }
};
