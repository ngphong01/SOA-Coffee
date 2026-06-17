const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../../../shared/database/mysql');
const { Cache } = require('../../../../shared/redis/client');
const { publish } = require('../../../../shared/rabbitmq/client');
const EVENTS = require('../../../../shared/rabbitmq/events');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('Auth-Controller');

const signAccessToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role_id: user.role_id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
);

const signRefreshToken = (user, tokenId) => jwt.sign(
  { id: user.id, tokenId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
);

const storeRefreshToken = async (userId, tokenId, refreshToken) => {
  const ttl = 7 * 24 * 60 * 60;
  await Cache.set(`refresh:${userId}:${tokenId}`, refreshToken, ttl);
};

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const tokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, tokenId);
  await storeRefreshToken(user.id, tokenId, refreshToken);
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  const existing = await queryOne('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
  if (existing) return ApiResponse.conflict(res, 'Email already registered');

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const password_hash = await bcrypt.hash(password, rounds);
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, phone, role_id, is_verified)
     VALUES (?, ?, ?, ?, 4, 0)`,
    [full_name, email, password_hash, phone || null]
  );

  const user = await queryOne(
    'SELECT id, uuid, full_name, email, phone, avatar_url, role_id, is_active FROM users WHERE id = ?',
    [result.insertId]
  );

  await publish(EVENTS.USER_REGISTERED, { userId: user.id, email: user.email });
  const tokens = await issueTokens(user);

  return ApiResponse.created(res, { user, tokens }, 'Registration successful');
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await queryOne(
    `SELECT id, uuid, full_name, email, phone, avatar_url, password_hash, role_id, is_active, is_verified
     FROM users WHERE email = ? AND deleted_at IS NULL`,
    [email]
  );

  if (!user || !user.is_active) {
    return ApiResponse.unauthorized(res, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return ApiResponse.unauthorized(res, 'Invalid credentials');

  await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  delete user.password_hash;

  const tokens = await issueTokens(user);
  return ApiResponse.success(res, { user, tokens }, 'Login successful');
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return ApiResponse.badRequest(res, 'Refresh token required');

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const stored = await Cache.get(`refresh:${payload.id}:${payload.tokenId}`);
    if (!stored || stored !== refreshToken) {
      return ApiResponse.unauthorized(res, 'Invalid refresh token');
    }

    const user = await queryOne(
      'SELECT id, uuid, full_name, email, phone, avatar_url, role_id, is_active FROM users WHERE id = ? AND deleted_at IS NULL',
      [payload.id]
    );
    if (!user || !user.is_active) {
      return ApiResponse.unauthorized(res, 'User not found');
    }

    await Cache.del(`refresh:${payload.id}:${payload.tokenId}`);
    const tokens = await issueTokens(user);
    return ApiResponse.success(res, { tokens }, 'Token refreshed');
  } catch (err) {
    logger.warn('Refresh token error:', err.message);
    return ApiResponse.unauthorized(res, 'Invalid refresh token');
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await queryOne('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
  if (!user) {
    return ApiResponse.success(res, null, 'If the email exists, a reset link has been sent');
  }
  logger.info(`Password reset requested for ${email}`);
  return ApiResponse.success(res, null, 'If the email exists, a reset link has been sent');
};

exports.seedAdmin = async () => {
  const email = 'admin@coffeeshop.com';
  const password = 'Admin@123456';
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  const password_hash = await bcrypt.hash(password, rounds);
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    await query(
      'UPDATE users SET password_hash = ?, role_id = 1, is_verified = 1, is_active = 1 WHERE email = ?',
      [password_hash, email]
    );
    logger.info('Admin user password synced');
  } else {
    await query(
      `INSERT INTO users (full_name, email, password_hash, role_id, is_verified, is_active)
       VALUES ('System Admin', ?, ?, 1, 1, 1)`,
      [email, password_hash]
    );
    logger.info('Admin user seeded');
  }
};
