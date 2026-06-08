require('dotenv').config();
const express = require('express');
const { createPool, testConnection, query } = require('../../../shared/database/mysql');
const { connect: connectRabbitMQ, subscribe } = require('../../../shared/rabbitmq/client');
const createLogger = require('../../../shared/utils/logger');

const logger = createLogger('Logging-Service');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'logging-service',
  timestamp: new Date().toISOString(),
}));

app.get('/api/logs/audit', async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action, module, date_from, date_to } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE 1=1';
    const params = [];

    if (user_id) { where += ' AND al.user_id = ?'; params.push(user_id); }
    if (action) { where += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (module) { where += ' AND al.module = ?'; params.push(module); }
    if (date_from) { where += ' AND DATE(al.created_at) >= ?'; params.push(date_from); }
    if (date_to) { where += ' AND DATE(al.created_at) <= ?'; params.push(date_to); }

    const [logs, count] = await Promise.all([
      query(
        `SELECT al.*, u.full_name AS user_name, u.email AS user_email
         FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
         ${where} ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM audit_logs al ${where}`, params),
    ]);

    res.json({
      success: true,
      data: logs,
      meta: {
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: count[0].total,
          totalPages: Math.ceil(count[0].total / parseInt(limit, 10)),
        },
      },
    });
  } catch (err) {
    logger.error('Audit logs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const writeAuditLog = async (data) => {
  try {
    await query(
      `INSERT INTO audit_logs
        (user_id, action, module, entity_type, entity_id, old_values, new_values, ip_address, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId || null,
        data.action,
        data.module,
        data.entityType || null,
        data.entityId || null,
        data.oldValues ? JSON.stringify(data.oldValues) : null,
        data.newValues ? JSON.stringify(data.newValues) : null,
        data.ipAddress || null,
        data.userAgent || null,
        data.status || 'success',
      ]
    );
  } catch (err) {
    logger.error('Write audit log error:', err);
  }
};

const startService = async () => {
  try {
    createPool();
    await testConnection();
    await connectRabbitMQ();

    await subscribe('logging.audit.queue', ['#'], async (event, routingKey) => {
      await writeAuditLog({
        action: routingKey,
        module: routingKey.split('.')[0],
        newValues: event,
        userId: event.userId || event.cashierId || null,
        entityType: routingKey.split('.')[0],
        entityId: String(event.orderId || event.productId || event.userId || ''),
      });
    });

    const PORT = process.env.PORT || 3013;
    app.listen(PORT, () => logger.info(`Logging Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Logging Service:', error);
    process.exit(1);
  }
};

startService();
