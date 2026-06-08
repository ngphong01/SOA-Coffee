const mysql = require('mysql2/promise');
const createLogger = require('../utils/logger');

const logger = createLogger('MySQL');

let pool = null;

const createPool = (config = {}) => {
  const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
    supportBigNumbers: true,
    bigNumberStrings: false,
    ...config,
  };

  pool = mysql.createPool(poolConfig);
  return pool;
};

const getPool = () => {
  if (!pool) throw new Error('Database pool not initialized. Call createPool() first.');
  return pool;
};

const query = async (sql, params = []) => {
  const [rows] = await getPool().query(sql, params);
  return rows;
};

const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const transaction = async (callback) => {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const testConnection = async () => {
  await getPool().execute('SELECT 1');
  logger.info('MySQL connection successful');
  return true;
};

module.exports = { createPool, getPool, query, queryOne, transaction, testConnection };
