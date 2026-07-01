const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { publish } = require('../../../../shared/rabbitmq/client');
const EVENTS = require('../../../../shared/rabbitmq/events');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');
const crypto = require('crypto');

const logger = createLogger('Stripe-Controller');

const generateTransactionId = () =>
  `STR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// Mock Stripe Checkout Session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { order_id, amount, order_type } = req.body;
    const userId = req.headers['x-user-id'] || 1;

    if (!order_id || !amount) {
      return ApiResponse.error(res, 'Thiếu order_id hoặc amount', 400);
    }

    // Verify order exists
    const order = await queryOne(
      'SELECT id, order_number, status, total_amount FROM order_db.orders WHERE id = ?',
      [order_id]
    );
    if (!order) return ApiResponse.notFound(res, 'Order not found');

    // Create payment record with 'completed' status (mock auto-complete)
    const transactionId = generateTransactionId();
    const paymentResult = await query(
      `INSERT INTO payments (uuid, order_id, transaction_id, method, status, amount, currency, processed_at)
       VALUES (UUID(), ?, ?, 'card', 'completed', ?, 'VND', NOW())`,
      [order_id, transactionId, amount]
    );
    const paymentId = paymentResult.insertId;

    // Auto-complete the order
    await query(
      `UPDATE order_db.orders SET status = 'completed', completed_at = NOW()
       WHERE id = ? AND status IN ('pending', 'processing')`,
      [order_id]
    );

    // Publish payment completed event
    await publish(EVENTS.PAYMENT_COMPLETED, {
      paymentId,
      orderId: order_id,
      transactionId,
      amount,
      method: 'card',
    });

    // Build redirect URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:80';
    const redirectUrl = `${frontendUrl}/orders?payment=success&order_id=${order_id}`;

    logger.info(`Stripe payment completed: order #${order_id}, payment #${paymentId}`);

    return ApiResponse.success(res, {
      url: redirectUrl,
      transactionId,
      paymentId,
    }, 'Thanh toán thành công');
  } catch (error) {
    logger.error('Create Stripe session error:', error);
    throw error;
  }
};

// Mock Stripe Webhook / Confirm Payment
exports.confirmPayment = async (req, res) => {
  try {
    const { session_id, order_id } = req.body;

    if (!session_id || !order_id) {
      return ApiResponse.error(res, 'Thiếu session_id hoặc order_id', 400);
    }

    // Find payment by transaction_id (stored as session_id)
    const payment = await queryOne(
      `SELECT p.*, o.status AS order_status
       FROM payments p
       JOIN order_db.orders o ON p.order_id = o.id
       WHERE p.transaction_id = ? AND p.order_id = ?`,
      [session_id, order_id]
    );

    if (!payment) return ApiResponse.notFound(res, 'Payment session not found');

    if (payment.status === 'completed') {
      return ApiResponse.success(res, { status: 'completed' }, 'Payment already completed');
    }

    // Complete payment and order
    await transaction(async (conn) => {
      await conn.query(
        `UPDATE payments SET status = 'completed', processed_at = NOW() WHERE id = ?`,
        [payment.id]
      );

      await conn.query(
        `UPDATE order_db.orders SET status = 'completed', completed_at = NOW()
         WHERE id = ? AND status IN ('pending', 'processing')`,
        [order_id]
      );
    });

    // Publish payment completed event
    await publish(EVENTS.PAYMENT_COMPLETED, {
      paymentId: payment.id,
      orderId: order_id,
      transactionId: session_id,
      amount: payment.amount,
      method: 'card',
    });

    logger.info(`Payment confirmed: order #${order_id}, payment #${payment.id}`);

    return ApiResponse.success(res, { status: 'completed' }, 'Thanh toán thành công');
  } catch (error) {
    logger.error('Confirm payment error:', error);
    throw error;
  }
};
