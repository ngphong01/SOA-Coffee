const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { publish } = require('../../../../shared/rabbitmq/client');
const EVENTS = require('../../../../shared/rabbitmq/events');
const ApiResponse = require('../../../../shared/utils/response');
const AuditLog = require('../../../../shared/utils/auditLog');

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, status, search = '' } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  let where = 'WHERE 1=1';
  const params = [];

  if (status) {
    where += ' AND o.status = ?';
    params.push(status);
  }
  if (search) {
    where += ' AND (o.order_number LIKE ? OR c.full_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const [orders, countResult] = await Promise.all([
    query(
      `SELECT o.*, c.full_name AS customer_name, u.full_name AS cashier_name
       FROM orders o
       LEFT JOIN user_db.customers c ON o.customer_id = c.id
       JOIN auth_db.users u ON o.cashier_id = u.id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    ),
    query(
      `SELECT COUNT(*) AS total FROM orders o
       LEFT JOIN user_db.customers c ON o.customer_id = c.id
       ${where}`,
      params
    ),
  ]);

  const total = countResult[0].total;
  return ApiResponse.paginated(res, orders, {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages: Math.ceil(total / parseInt(limit, 10)),
  });
};

exports.getOne = async (req, res) => {
  const order = await queryOne(
    `SELECT o.*, c.full_name AS customer_name, u.full_name AS cashier_name
     FROM orders o
     LEFT JOIN user_db.customers c ON o.customer_id = c.id
     JOIN auth_db.users u ON o.cashier_id = u.id
     WHERE o.id = ?`,
    [req.params.id]
  );
  if (!order) return ApiResponse.notFound(res, 'Order not found');

  const items = await query(
    `SELECT oi.*, p.name AS current_product_name
     FROM order_items oi
     LEFT JOIN product_db.products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [order.id]
  );
  return ApiResponse.success(res, { ...order, items });
};

exports.create = async (req, res) => {
  const {
    items,
    customer_id = null,
    cashier_id = 1,
    type = 'dine_in',
    table_number,
    notes,
    coupon_code,
  } = req.body;

  if (!items?.length) return ApiResponse.badRequest(res, 'Order items required');

  try {
    const order = await transaction(async (conn) => {
      let subtotal = 0;
      const lineItems = [];

      for (const item of items) {
        const [productRows] = await conn.execute(
          'SELECT id, name, sku, price FROM product_db.products WHERE id = ? AND deleted_at IS NULL AND is_active = 1',
          [item.product_id]
        );
        const product = productRows[0];
        if (!product) throw Object.assign(new Error(`Product ${item.product_id} not found`), { statusCode: 400 });

        const qty = parseFloat(item.quantity) || 1;
        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * qty;
        subtotal += totalPrice;
        lineItems.push({ product, qty, unitPrice, totalPrice, notes: item.notes });
      }

      const orderNumber = generateOrderNumber();
      const [orderResult] = await conn.execute(
        `INSERT INTO orders
          (order_number, customer_id, cashier_id, type, status, table_number, subtotal, total_amount, coupon_code, notes)
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
        [orderNumber, customer_id, cashier_id, type, table_number || null, subtotal, subtotal, coupon_code || null, notes || null]
      );
      const orderId = orderResult.insertId;

      for (const line of lineItems) {
        await conn.execute(
          `INSERT INTO order_items
            (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, line.product.id, line.product.name, line.product.sku, line.qty, line.unitPrice, line.totalPrice, line.notes || null]
        );
      }

      const [rows] = await conn.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
      return rows[0];
    });

    await publish(EVENTS.ORDER_CREATED, { orderId: order.id, orderNumber: order.order_number, cashierId: cashier_id });
    await AuditLog.log({
      userId: cashier_id || req.headers['x-user-id'] || null,
      action: 'CREATE_ORDER',
      module: 'order',
      entityType: 'order',
      entityId: order.id,
      newValues: { orderNumber: order.order_number, totalAmount: order.total_amount, itemCount: items.length },
    ...AuditLog.extractRequestInfo(req),
  });
  const full = await exports.getOneData(order.id);
  return ApiResponse.created(res, full, 'Order created');
  } catch (err) {
    if (err.statusCode) return ApiResponse.badRequest(res, err.message);
    throw err;
  }
};

exports.getOneData = async (id) => {
  const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  const items = await query('SELECT * FROM order_items WHERE order_id = ?', [id]);
  return { ...order, items };
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const existing = await queryOne('SELECT id FROM orders WHERE id = ?', [id]);
  if (!existing) return ApiResponse.notFound(res, 'Order not found');

  const fields = ['customer_id', 'type', 'table_number', 'notes', 'coupon_code'];
  const updates = [];
  const params = [];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });
  if (!updates.length) return ApiResponse.badRequest(res, 'No fields to update');

  params.push(id);
  await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
  const order = await exports.getOneData(id);
  return ApiResponse.success(res, order, 'Order updated');
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, cancel_reason } = req.body;
  const allowed = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
  if (!allowed.includes(status)) return ApiResponse.badRequest(res, 'Invalid status');

  const order = await queryOne('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return ApiResponse.notFound(res, 'Order not found');

  let extra = '';
  const params = [status];
  if (status === 'completed') extra = ', completed_at = NOW()';
  if (status === 'cancelled') {
    extra = ', cancelled_at = NOW(), cancel_reason = ?';
    params.push(cancel_reason || null);
  }
  params.push(id);

  await query(`UPDATE orders SET status = ?${extra} WHERE id = ?`, params);
  const updated = await exports.getOneData(id);

  if (status === 'completed') {
    await publish(EVENTS.ORDER_COMPLETED, { orderId: id, orderNumber: order.order_number });
  }

  await AuditLog.log({
    userId: req.headers['x-user-id'] || null,
    action: `UPDATE_ORDER_STATUS`,
    module: 'order',
    entityType: 'order',
    entityId: id,
    oldValues: { status: order.status },
    newValues: { status },
    ...AuditLog.extractRequestInfo(req),
  });

  return ApiResponse.success(res, updated, `Order ${status}`);
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const order = await queryOne('SELECT id, status FROM orders WHERE id = ?', [id]);
  if (!order) return ApiResponse.notFound(res, 'Order not found');
  if (order.status === 'completed') {
    return ApiResponse.badRequest(res, 'Cannot delete completed order');
  }
  await query('DELETE FROM order_items WHERE order_id = ?', [id]);
  await query('DELETE FROM orders WHERE id = ?', [id]);
  return ApiResponse.success(res, null, 'Order deleted');
};
