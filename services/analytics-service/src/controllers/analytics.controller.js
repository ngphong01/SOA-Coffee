const { query } = require('../../../../shared/database/mysql');
const { Cache } = require('../../../../shared/redis/client');
const ApiResponse = require('../../../../shared/utils/response');

const periodToDays = {
  today: 0,
  '7days': 7,
  '30days': 30,
  '90days': 90,
  '1year': 365,
};

const getDateFilter = (period, dateFrom, dateTo) => {
  if (dateFrom && dateTo) {
    return { sql: 'DATE(created_at) BETWEEN ? AND ?', params: [dateFrom, dateTo] };
  }
  const days = periodToDays[period] ?? 7;
  if (period === 'today') {
    return { sql: 'DATE(created_at) = CURDATE()', params: [] };
  }
  return { sql: 'created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)', params: [days] };
};

exports.dashboard = async (req, res) => {
  const cacheKey = Cache.generateKey('analytics', 'dashboard');
  const cached = await Cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached, 'Dashboard summary (cached)');

  const [
    ordersToday,
    revenueToday,
    totalProducts,
    lowStock,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    query(`SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = CURDATE()`),
    query(`SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders
           WHERE DATE(created_at) = CURDATE() AND status = 'completed'`),
    query(`SELECT COUNT(*) AS count FROM products WHERE deleted_at IS NULL AND is_active = 1`),
    query(`SELECT COUNT(*) AS count FROM inventory i
           JOIN products p ON i.product_id = p.id
           WHERE i.quantity_available <= i.min_stock_level AND p.deleted_at IS NULL`),
    query(
      `SELECT id, order_number, status, total_amount, created_at
       FROM orders ORDER BY created_at DESC LIMIT 5`
    ),
    query(
      `SELECT p.id, p.name, p.total_sold, p.price
       FROM products p WHERE p.deleted_at IS NULL
       ORDER BY p.total_sold DESC LIMIT 5`
    ),
  ]);

  const data = {
    ordersToday: ordersToday[0].count,
    revenueToday: parseFloat(revenueToday[0].total),
    activeProducts: totalProducts[0].count,
    lowStockCount: lowStock[0].count,
    recentOrders,
    topProducts,
  };

  await Cache.set(cacheKey, data, 120);
  return ApiResponse.success(res, data, 'Dashboard summary');
};

exports.revenue = async (req, res) => {
  const { period = '7days', date_from, date_to } = req.query;
  const cacheKey = Cache.generateKey('analytics', 'revenue', period, date_from || '', date_to || '');
  const cached = await Cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached, 'Revenue analytics (cached)');

  const { sql, params } = getDateFilter(period, date_from, date_to);

  const [summary, byDay, byMethod] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS order_count,
         COALESCE(SUM(total_amount), 0) AS total_revenue,
         COALESCE(AVG(total_amount), 0) AS avg_order_value
       FROM orders
       WHERE status = 'completed' AND ${sql}`,
      params
    ),
    query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS orders,
              COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       WHERE status = 'completed' AND ${sql}
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      params
    ),
    query(
      `SELECT pay.method, COALESCE(SUM(pay.amount), 0) AS total
       FROM payments pay
       JOIN orders o ON pay.order_id = o.id
       WHERE pay.status = 'completed' AND ${sql.replace(/created_at/g, 'o.created_at')}
       GROUP BY pay.method`,
      params
    ),
  ]);

  const data = {
    period,
    summary: {
      orderCount: summary[0].order_count,
      totalRevenue: parseFloat(summary[0].total_revenue),
      avgOrderValue: parseFloat(summary[0].avg_order_value),
    },
    revenueByDay: byDay.map((r) => ({
      date: r.date,
      orders: r.orders,
      revenue: parseFloat(r.revenue),
    })),
    revenueByPaymentMethod: byMethod.map((r) => ({
      method: r.method,
      total: parseFloat(r.total),
    })),
  };

  await Cache.set(cacheKey, data, 300);
  return ApiResponse.success(res, data, 'Revenue analytics');
};

exports.topProducts = async (req, res) => {
  const { limit = 10, period = '30days' } = req.query;
  const cacheKey = Cache.generateKey('analytics', 'topProducts', String(limit), period);
  const cached = await Cache.get(cacheKey);
  if (cached) return ApiResponse.success(res, cached, 'Top products (cached)');

  const { sql, params } = getDateFilter(period, req.query.date_from, req.query.date_to);

  const rows = await query(
    `SELECT p.id, p.name, p.sku,
            COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
            COALESCE(SUM(oi.total_price), 0) AS total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     WHERE o.status = 'completed' AND ${sql.replace(/created_at/g, 'o.created_at')}
     GROUP BY p.id, p.name, p.sku
     ORDER BY total_quantity_sold DESC
     LIMIT ?`,
    [...params, parseInt(limit, 10)]
  );

  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    total_quantity_sold: Number(r.total_quantity_sold),
    total_revenue: parseFloat(r.total_revenue),
  }));

  await Cache.set(cacheKey, data, 300);
  return ApiResponse.success(res, data, 'Top products analytics');
};
