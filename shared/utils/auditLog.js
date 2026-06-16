/**
 * Audit Log Utility
 * Ghi lại mọi hành động quan trọng vào bảng audit_logs
 */
const { query } = require('../database/mysql');
const createLogger = require('./logger');

const logger = createLogger('AuditLog');

const AuditLog = {
  /**
   * Ghi một audit log entry
   * @param {Object} params
   * @param {number|null} params.userId - ID của user thực hiện hành động
   * @param {string} params.action - Tên hành động (vd: CREATE_PRODUCT, UPDATE_ORDER)
   * @param {string} params.module - Module liên quan (vd: product, order, inventory)
   * @param {string} [params.entityType] - Loại entity
   * @param {string|number} [params.entityId] - ID của entity
   * @param {Object} [params.oldValues] - Giá trị cũ (trước khi thay đổi)
   * @param {Object} [params.newValues] - Giá trị mới (sau khi thay đổi)
   * @param {string} [params.ipAddress] - Địa chỉ IP
   * @param {string} [params.userAgent] - User agent
   * @param {string} [params.status] - 'success' | 'failure'
   */
  log: async ({
    userId = null,
    action,
    module,
    entityType = null,
    entityId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
    status = 'success',
  }) => {
    try {
      await query(
        `INSERT INTO audit_logs
          (user_id, action, module, entity_type, entity_id,
           old_values, new_values, ip_address, user_agent, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          action,
          module,
          entityType,
          entityId ? String(entityId) : null,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress,
          userAgent,
          status,
        ]
      );
    } catch (error) {
      // Audit log failure should never break the main flow
      logger.error('Failed to write audit log:', error.message);
    }
  },

  /**
   * Lấy IP và User-Agent từ request
   */
  extractRequestInfo: (req) => ({
    ipAddress: req.headers['x-forwarded-for'] || req.ip || null,
    userAgent: req.headers['user-agent'] || null,
  }),
};

module.exports = AuditLog;
