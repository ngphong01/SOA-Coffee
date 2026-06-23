require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection, query, queryOne } = require('../../../shared/database/mysql');
const { createRedisClient } = require('../../../shared/redis/client');
const { subscribe } = require('../../../shared/rabbitmq/client');
const EVENTS = require('../../../shared/rabbitmq/events');
const createLogger = require('../../../shared/utils/logger');
const { bootstrapService } = require('../../../shared/utils/bootstrap');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');
const uploadRoutes = require('./routes/upload.routes');
const employeeRoutes = require('./routes/employee.routes');

const logger = createLogger('User-Service');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', uploadRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message });
});

// Auto-create employee record when a new user registers
const setupEventHandlers = async () => {
  await subscribe('user-service.employee', [EVENTS.USER_REGISTERED], async (event) => {
    try {
      const { userId, email } = JSON.parse(event.content.toString());
      logger.info(`Creating employee for user ${userId} (${email})`);

      // Get user info from auth_db to determine role
      const user = await queryOne(
        'SELECT id, full_name, role_id FROM auth_db.users WHERE id = ?',
        [userId]
      );
      if (!user) return;

      // Only create employee for staff roles (not customers)
      const roleNames = { 1: 'Super Admin', 2: 'Admin', 3: 'Manager', 4: 'Cashier', 5: 'Barista' };
      const position = roleNames[user.role_id] || 'Staff';
      const dept = user.role_id <= 2 ? 'Quản lý' : 'Vận hành';
      const code = `EMP${String(userId).padStart(3, '0')}`;

      await query(
        `INSERT IGNORE INTO employees (user_id, employee_code, position, department, hire_date, status)
         VALUES (?, ?, ?, ?, CURDATE(), 'active')`,
        [userId, code, position, dept]
      );
      logger.info(`Employee ${code} created for user ${userId}`);
    } catch (err) {
      logger.error('Failed to create employee:', err.message || err.code || String(err));
    }
  });
};

bootstrapService({
  serviceName: 'user-service',
  port: PORT,
  app,
  onReady: async () => {
    try {
      createPool();
      await testConnection();
      await createRedisClient();
      await setupEventHandlers();
    } catch (error) {
      logger.error('Failed to start User Service:', error);
      process.exit(1);
    }
  }
});
