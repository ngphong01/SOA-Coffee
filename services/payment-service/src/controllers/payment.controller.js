const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { publish } = require('../../../../shared/rabbitmq/client');
const { Cache } = require('../../../../shared/redis/client');
const EVENTS = require('../../../../shared/rabbitmq/events');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');
const crypto = require('crypto');

const logger = createLogger('Payment-Controller');

const generateTransactionId = () =>
  `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// ─── GET ALL PAYMENTS ─────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, method,
      date_from, date_to, order_id
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (method) { where += ' AND p.method = ?'; params.push(method); }
    if (order_id) { where += ' AND p.order_id = ?'; params.push(order_id); }
    if (date_from) { where += ' AND DATE(p.created_at) >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND DATE(p.created_at) <= ?'; params.push(date_to); }

    const [payments, countResult] = await Promise.all([
      query(
        `SELECT
          p.id, p.uuid, p.transaction_id, p.method, p.status,
          p.amount, p.amount_tendered, p.change_amount,
          p.currency, p.refund_amount, p.refunded_at,
          p.processed_at, p.created_at,
          o.order_number, o.type AS order_type,
          c.full_name AS customer_name,
          u.full_name AS cashier_name
         FROM payments p
         JOIN orders o ON p.order_id = o.id
         LEFT JOIN customers c ON o.customer_id = c.id
         LEFT JOIN users u ON o.cashier_id = u.id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM payments p ${where}`, params),
    ]);

    const total = countResult[0].total;
    const pagination = {
      page: parseInt(page), limit: parseInt(limit), total,
      totalPages: Math.ceil(total / parseInt(limit)),
    };

    return ApiResponse.paginated(res, payments, pagination);
  } catch (error) {
    logger.error('Get payments error:', error);
    throw error;
  }
};

// ─── GET PAYMENT DETAIL ───────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await queryOne(
      `SELECT p.*, o.order_number, o.total_amount AS order_total,
              c.full_name AS customer_name,
              u.full_name AS cashier_name,
              rb.full_name AS refunded_by_name
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       LEFT JOIN users u ON o.cashier_id = u.id
       LEFT JOIN users rb ON p.refunded_by = rb.id
       WHERE p.id = ? OR p.uuid = ? OR p.transaction_id = ?`,
      [id, id, id]
    );

    if (!payment) return ApiResponse.notFound(res, 'Payment not found');
    return ApiResponse.success(res, payment);
  } catch (error) {
    logger.error('Get payment error:', error);
    throw error;
  }
};

// ─── PROCESS PAYMENT ──────────────────────────────────────
exports.processPayment = async (req, res) => {
  try {
    const { order_id, method, amount_tendered, notes } = req.body;
    const userId = req.headers['x-user-id'];

    // Get order
    const order = await queryOne(
      'SELECT * FROM orders WHERE id = ? AND status IN ("pending","processing")',
      [order_id]
    );

    if (!order) return ApiResponse.notFound(res, 'Order not found or not payable');

    // Check existing payment
    const existingPayment = await queryOne(
      'SELECT id FROM payments WHERE order_id = ? AND status = "completed"',
      [order_id]
    );
    if (existingPayment) return ApiResponse.conflict(res, 'Order already paid');

    const transactionId = generateTransactionId();
    const changeDue = method === 'cash'
      ? Math.max(0, parseFloat(amount_tendered || 0) - parseFloat(order.total_amount))
      : 0;

    // Validate cash payment
    if (method === 'cash' && parseFloat(amount_tendered || 0) < parseFloat(order.total_amount)) {
      return ApiResponse.badRequest(res, 'Amount tendered is less than total amount');
    }

    const result = await transaction(async (conn) => {
      // Create payment record
      const [paymentResult] = await conn.execute(
        `INSERT INTO payments
          (order_id, transaction_id, method, status, amount,
           amount_tendered, change_amount, notes, processed_at)
         VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, NOW())`,
        [
          order_id, transactionId, method,
          order.total_amount,
          amount_tendered || order.total_amount,
          changeDue, notes || null
        ]
      );

      // Update order status to completed
      await conn.execute(
        'UPDATE orders SET status = "completed", completed_at = NOW() WHERE id = ?',
        [order_id]
      );

      // Update customer stats if customer exists
      if (order.customer_id) {
        await conn.execute(
          `UPDATE customers SET
            total_spent = total_spent + ?,
            total_orders = total_orders + 1,
            loyalty_points = loyalty_points + ?,
            segment = CASE
              WHEN (total_spent + ?) >= 5000000 THEN 'vip'
              WHEN (total_spent + ?) >= 1000000 THEN 'regular'
              ELSE segment
            END
           WHERE id = ?`,
          [
            order.total_amount,
            Math.floor(parseFloat(order.total_amount) / 10000),
            order.total_amount, order.total_amount,
            order.customer_id
          ]
        );
      }

      return paymentResult.insertId;
    });

    const newPayment = await queryOne('SELECT * FROM payments WHERE id = ?', [result]);

    // Publish events
    await publish(EVENTS.PAYMENT_COMPLETED, {
      paymentId: result,
      orderId: order_id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      method,
      customerId: order.customer_id,
      transactionId,
    });

    await publish(EVENTS.ORDER_COMPLETED, {
      orderId: order_id,
      orderNumber: order.order_number,
      completedBy: userId,
    });

    // Deduct inventory
    const orderItems = await query('SELECT * FROM order_items WHERE order_id = ?', [order_id]);
    for (const item of orderItems) {
      await query(
        `UPDATE inventory SET
          quantity_in_stock = quantity_in_stock - ?,
          quantity_reserved = GREATEST(0, quantity_reserved - ?)
         WHERE product_id = ?`,
        [item.quantity, item.quantity, item.product_id]
      );
      await query(
        'UPDATE products SET total_sold = total_sold + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    return ApiResponse.created(res, {
      ...newPayment, changeDue,
    }, 'Payment processed successfully');
  } catch (error) {
    logger.error('Process payment error:', error);
    throw error;
  }
};

// ─── DELETE PAYMENT ──────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await queryOne(
      'SELECT * FROM payments WHERE id = ? AND status IN ("failed", "refunded")',
      [id]
    );

    if (!payment) return ApiResponse.notFound(res, 'Không tìm thấy thanh toán hoặc không thể xóa');

    await query('DELETE FROM payments WHERE id = ?', [id]);

    return ApiResponse.success(res, null, 'Đã xóa thanh toán');
  } catch (error) {
    logger.error('Delete payment error:', error);
    throw error;
  }
};

// ─── PROCESS REFUND ───────────────────────────────────────
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refund_amount, reason } = req.body;
    const userId = req.headers['x-user-id'];

    const payment = await queryOne(
      'SELECT * FROM payments WHERE id = ? AND status = "completed"',
      [id]
    );

    if (!payment) return ApiResponse.notFound(res, 'Payment not found or not refundable');

    const maxRefund = parseFloat(payment.amount) - parseFloat(payment.refund_amount || 0);
    const refundAmt = parseFloat(refund_amount);

    if (refundAmt > maxRefund) {
      return ApiResponse.badRequest(res, `Maximum refundable amount is ${maxRefund}`);
    }

    const isFullRefund = refundAmt >= maxRefund;
    const newStatus = isFullRefund ? 'refunded' : 'partial_refund';

    await query(
      `UPDATE payments SET
        status = ?,
        refund_amount = refund_amount + ?,
        refunded_at = NOW(),
        refunded_by = ?,
        refund_reason = ?
       WHERE id = ?`,
      [newStatus, refundAmt, userId, reason, id]
    );

    if (isFullRefund) {
      await query(
        'UPDATE orders SET status = "refunded" WHERE id = ?',
        [payment.order_id]
      );
    }

    await publish(EVENTS.PAYMENT_REFUNDED, {
      paymentId: id,
      orderId: payment.order_id,
      refundAmount: refundAmt,
      isFullRefund,
      reason,
      refundedBy: userId,
    });

    const updated = await queryOne('SELECT * FROM payments WHERE id = ?', [id]);
    return ApiResponse.success(res, updated, 'Refund processed successfully');
  } catch (error) {
    logger.error('Process refund error:', error);
    throw error;
  }
};

// ─── PAYMENT SUMMARY STATS ────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let where = "WHERE p.status = 'completed'";
    const params = [];

    if (date_from) { where += ' AND DATE(p.created_at) >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND DATE(p.created_at) <= ?'; params.push(date_to); }

    const [summary, byMethod, daily] = await Promise.all([
      queryOne(
        `SELECT
          COUNT(*) AS total_transactions,
          SUM(amount) AS total_revenue,
          AVG(amount) AS avg_transaction,
          SUM(refund_amount) AS total_refunds
         FROM payments p ${where}`,
        params
      ),
      query(
        `SELECT method, COUNT(*) AS count, SUM(amount) AS total
         FROM payments p ${where}
         GROUP BY method`,
        params
      ),
      query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
                COUNT(*) AS transactions, SUM(amount) AS revenue
         FROM payments p ${where}
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        params
      ),
    ]);

    return ApiResponse.success(res, { summary, byMethod, daily });
  } catch (error) {
    logger.error('Payment stats error:', error);
    throw error;
  }
};