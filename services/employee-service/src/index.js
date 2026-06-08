require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createPool, testConnection } = require('../../../shared/database/mysql');
const createLogger = require('../../../shared/utils/logger');
const employeeRoutes = require('./routes/employee.routes');

const logger = createLogger('Employee-Service');
const app = express();
const PORT = process.env.PORT || 3008;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({
  status: 'healthy',
  service: 'employee-service',
  timestamp: new Date().toISOString(),
}));

app.use('/api/employees', employeeRoutes);

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message });
});

const startServer = async () => {
  try {
    createPool();
    await testConnection();
    app.listen(PORT, () => logger.info(`Employee Service running on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start Employee Service:', error);
    process.exit(1);
  }
};

startServer();
