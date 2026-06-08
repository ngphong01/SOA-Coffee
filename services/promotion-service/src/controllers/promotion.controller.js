const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { Cache } = require('../../../../shared/redis/client');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');
const crypto = require('crypto');

const logger = createLogger('Promotion-Controller');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE 1=1';
    const params = [];

    if (type) { where += ' AND p.type = ?'; params.push(type); }
    if (status === 'active') {
      where += ' AND p.is_active = 1 AND p.starts_at <= NOW() AND (p.ends_at IS NULL OR p.ends_at > NOW())';
    } else if (status === 'upcoming') {
      where += ' AND p.is_active = 1 AND p.starts_at > NOW()';
    } else if (status === 'expired') {
      where += ' AND (p.is_active = 0 OR (p.ends_at IS NOT NULL AND p.ends_at <= NOW()))';
    }

    const [promotions, countResult] = await Promise.all([
      query(
        `SELECT p.*,
                u.full_name AS created_by_name,
                (SELECT COUNT(*) FROM coupons cp WHERE cp.promotion_id = p.id) AS coupon_count,
                CASE
                  WHEN p.is_active = 0 THEN 'inactive'
                  WHEN p.starts_at > NOW() THEN 'upcoming'
                  WHEN p.ends_at IS NOT NULL AND p.ends_at <= NOW() THEN 'expired'
                  ELSE 'active'
                END AS computed_status
         FROM promotions p
         LEFT JOIN users u ON p.created_by = u.id
         ${where}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM promotions p ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, promotions, pagination);
  } catch (error) {
    logger.error('Get promotions error:', error);
    throw error;
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await queryOne(
      `SELECT p.*, u.full_name AS created_by_name
       FROM promotions p LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ? OR p.uuid = ?`,
      [id, id]
    );

    if (!promotion) return ApiResponse.notFound(res, 'Promotion not found');

    const coupons = await query(
      'SELECT * FROM coupons WHERE promotion_id = ? ORDER BY created_at DESC LIMIT 50',
      [promotion.id]
    );

    return ApiResponse.success(res, { ...promotion, coupons });
  } catch (error) {
    logger.error('Get promotion error:', error);
    throw error;
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name, description, type, value, min_order_amount = 0,
      max_discount_amount, buy_quantity, get_quantity, applies_to = 'all',
      applicable_ids, usage_limit, usage_per_user = 1,
      starts_at, ends_at, is_active = 1,
      generate_coupons = false, coupon_count = 1, coupon_prefix = 'COFFEE',
    } = req.body;

    const userId = req.headers['x-user-id'] || 1;

    const result = await transaction(async (conn) => {
      const [promoResult] = await conn.execute(
        `INSERT INTO promotions
          (name, description, type, value, min_order_amount, max_discount_amount,
           buy_quantity, get_quantity, applies_to, applicable_ids,
           usage_limit, usage_per_user, starts_at, ends_at, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, description || null, type, value,
          min_order_amount, max_discount_amount || null,
          buy_quantity || null, get_quantity || null, applies_to,
          applicable_ids ? JSON.stringify(applicable_ids) : null,
          usage_limit || null, usage_per_user,
          starts_at, ends_at || null, is_active, userId,
        ]
      );

      const promoId = promoResult.insertId;
      const generatedCodes = [];

      if (generate_coupons && coupon_count > 0) {
        for (let i = 0; i < Math.min(coupon_count, 1000); i++) {
          const code = `${coupon_prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          await conn.execute(
            'INSERT INTO coupons (promotion_id, code, usage_limit, expires_at) VALUES (?, ?, ?, ?)',
            [promoId, code, usage_per_user, ends_at || null]
          );
          generatedCodes.push(code);
        }
      }

      return { promoId, generatedCodes };
    });

    await Cache.delPattern('promotions:*');
    const promotion = await queryOne('SELECT * FROM promotions WHERE id = ?', [result.promoId]);
    return ApiResponse.created(res, { ...promotion, generated_codes: result.generatedCodes });
  } catch (error) {
    logger.error('Create promotion error:', error);
    throw error;
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await queryOne('SELECT id FROM promotions WHERE id = ?', [id]);
    if (!promo) return ApiResponse.notFound(res, 'Promotion not found');

    const {
      name, description, value, min_order_amount, max_discount_amount,
      usage_limit, starts_at, ends_at, is_active,
    } = req.body;

    await query(
      `UPDATE promotions SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        value = COALESCE(?, value),
        min_order_amount = COALESCE(?, min_order_amount),
        max_discount_amount = COALESCE(?, max_discount_amount),
        usage_limit = COALESCE(?, usage_limit),
        starts_at = COALESCE(?, starts_at),
        ends_at = ?,
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [name, description, value, min_order_amount, max_discount_amount,
        usage_limit, starts_at, ends_at || null, is_active, id]
    );

    await Cache.delPattern('promotions:*');
    const updated = await queryOne('SELECT * FROM promotions WHERE id = ?', [id]);
    return ApiResponse.success(res, updated, 'Promotion updated');
  } catch (error) {
    logger.error('Update promotion error:', error);
    throw error;
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, promotion_id, is_active } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    let where = 'WHERE 1=1';
    const params = [];

    if (promotion_id) { where += ' AND cp.promotion_id = ?'; params.push(promotion_id); }
    if (is_active !== undefined) { where += ' AND cp.is_active = ?'; params.push(is_active); }

    const [coupons, countResult] = await Promise.all([
      query(
        `SELECT cp.*, p.name AS promotion_name, p.type AS promotion_type, p.value AS discount_value
         FROM coupons cp JOIN promotions p ON cp.promotion_id = p.id
         ${where}
         ORDER BY cp.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit, 10), offset]
      ),
      query(`SELECT COUNT(*) AS total FROM coupons cp ${where}`, params),
    ]);

    const pagination = {
      page: parseInt(page, 10), limit: parseInt(limit, 10),
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / parseInt(limit, 10)),
    };

    return ApiResponse.paginated(res, coupons, pagination);
  } catch (error) {
    logger.error('Get coupons error:', error);
    throw error;
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const promo = await queryOne('SELECT id FROM promotions WHERE id = ?', [id]);
    if (!promo) return ApiResponse.notFound(res, 'Không tìm thấy khuyến mãi');

    await query('UPDATE promotions SET is_active = 0, updated_at = NOW() WHERE id = ?', [id]);
    await Cache.delPattern('promotions:*');

    return ApiResponse.success(res, null, 'Đã xóa khuyến mãi');
  } catch (error) {
    logger.error('Delete promotion error:', error);
    throw error;
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, order_amount } = req.body;

    const coupon = await queryOne(
      `SELECT cp.*, p.type, p.value, p.min_order_amount, p.max_discount_amount,
              p.applies_to, p.applicable_ids, p.is_active AS promo_active,
              p.name AS promotion_name
       FROM coupons cp JOIN promotions p ON cp.promotion_id = p.id
       WHERE cp.code = ? AND cp.is_active = 1
         AND p.is_active = 1
         AND p.starts_at <= NOW()
         AND (p.ends_at IS NULL OR p.ends_at > NOW())
         AND (cp.usage_limit IS NULL OR cp.usage_count < cp.usage_limit)
         AND (cp.expires_at IS NULL OR cp.expires_at > NOW())`,
      [code]
    );

    if (!coupon) return ApiResponse.badRequest(res, 'Invalid or expired coupon');

    if (order_amount && parseFloat(order_amount) < parseFloat(coupon.min_order_amount)) {
      return ApiResponse.badRequest(res,
        `Minimum order amount is ${coupon.min_order_amount} for this coupon`);
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (parseFloat(order_amount || 0) * coupon.value) / 100;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, parseFloat(order_amount || 0));
    }

    return ApiResponse.success(res, {
      valid: true,
      coupon: { code: coupon.code, promotion_name: coupon.promotion_name, type: coupon.type, value: coupon.value },
      discount_amount: discountAmount,
    }, 'Coupon is valid');
  } catch (error) {
    logger.error('Validate coupon error:', error);
    throw error;
  }
};

exports.generateCoupons = async (req, res) => {
  try {
    const { promotion_id, count = 10, prefix = 'COFFEE', usage_limit = 1 } = req.body;

    const promo = await queryOne('SELECT id, ends_at FROM promotions WHERE id = ? AND is_active = 1', [promotion_id]);
    if (!promo) return ApiResponse.notFound(res, 'Promotion not found');

    const codes = [];
    for (let i = 0; i < Math.min(count, 500); i++) {
      const code = `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      await query(
        'INSERT INTO coupons (promotion_id, code, usage_limit, expires_at) VALUES (?, ?, ?, ?)',
        [promotion_id, code, usage_limit, promo.ends_at || null]
      );
      codes.push(code);
    }

    return ApiResponse.created(res, { generated: codes.length, codes }, 'Coupons generated');
  } catch (error) {
    logger.error('Generate coupons error:', error);
    throw error;
  }
};
