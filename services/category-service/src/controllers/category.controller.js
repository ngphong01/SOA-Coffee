const { query, queryOne, transaction } = require('../../../../shared/database/mysql');
const { Cache } = require('../../../../shared/redis/client');
const ApiResponse = require('../../../../shared/utils/response');
const createLogger = require('../../../../shared/utils/logger');

const logger = createLogger('Category-Controller');
const CACHE_TTL = 600; // 10 minutes

const generateSlug = (name) =>
  name.toLowerCase()
    .replace(/[àáảãạăắặẳẵặâấầẩẫậ]/g, 'a')
    .replace(/[èéẻẽẹêếềểễệ]/g, 'e')
    .replace(/[ìíỉĩị]/g, 'i')
    .replace(/[òóỏõọôốồổỗộơớờởỡợ]/g, 'o')
    .replace(/[ùúủũụưứừửữự]/g, 'u')
    .replace(/[đ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() + '-' + Date.now();

exports.getAll = async (req, res) => {
  try {
    const { include_count = false, parent_only = false } = req.query;
    const cacheKey = Cache.generateKey('categories', JSON.stringify(req.query));
    const cached = await Cache.get(cacheKey);
    if (cached) return ApiResponse.success(res, cached);

    let sql = `
      SELECT c.*,
             p.name AS parent_name,
             ${include_count ? '(SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id AND pr.deleted_at IS NULL) AS product_count,' : ''}
             (SELECT COUNT(*) FROM categories sc WHERE sc.parent_id = c.id) AS subcategory_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.is_active = 1
    `;

    if (parent_only === 'true') sql += ' AND c.parent_id IS NULL';
    sql += ' ORDER BY c.sort_order ASC, c.name ASC';

    const categories = await query(sql);

    // Build tree structure
    const categoryMap = {};
    const roots = [];

    for (const cat of categories) {
      cat.children = [];
      categoryMap[cat.id] = cat;
    }

    for (const cat of categories) {
      if (cat.parent_id && categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(cat);
      } else {
        roots.push(cat);
      }
    }

    await Cache.set(cacheKey, roots, CACHE_TTL);
    return ApiResponse.success(res, roots);
  } catch (error) {
    logger.error('Get categories error:', error);
    throw error;
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await queryOne(
      `SELECT c.*, p.name AS parent_name,
              (SELECT COUNT(*) FROM products pr WHERE pr.category_id = c.id AND pr.deleted_at IS NULL) AS product_count
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.id = ? OR c.slug = ?`,
      [id, id]
    );

    if (!category) return ApiResponse.notFound(res, 'Category not found');
    return ApiResponse.success(res, category);
  } catch (error) {
    logger.error('Get category error:', error);
    throw error;
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, parent_id, color, image_url, sort_order = 0 } = req.body;
    const slug = generateSlug(name);

    const exists = await queryOne('SELECT id FROM categories WHERE name = ?', [name]);
    if (exists) return ApiResponse.conflict(res, 'Category name already exists');

    const result = await query(
      `INSERT INTO categories (name, slug, description, parent_id, color, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description || null, parent_id || null, color || null, image_url || null, sort_order]
    );

    await Cache.delPattern('categories:*');
    const category = await queryOne('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return ApiResponse.created(res, category, 'Category created successfully');
  } catch (error) {
    logger.error('Create category error:', error);
    throw error;
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, color, image_url, sort_order, is_active } = req.body;

    const existing = await queryOne('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) return ApiResponse.notFound(res, 'Category not found');

    await query(
      `UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        parent_id = ?,
        color = COALESCE(?, color),
        image_url = COALESCE(?, image_url),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [name, description, parent_id !== undefined ? parent_id : existing.parent_id,
       color, image_url, sort_order, is_active, id]
    );

    await Cache.delPattern('categories:*');
    const updated = await queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    return ApiResponse.success(res, updated, 'Category updated successfully');
  } catch (error) {
    logger.error('Update category error:', error);
    throw error;
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const productCount = await queryOne(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ? AND deleted_at IS NULL',
      [id]
    );
    if (productCount.count > 0) {
      return ApiResponse.badRequest(res, `Cannot delete: ${productCount.count} products exist in this category`);
    }

    await query('DELETE FROM categories WHERE id = ?', [id]);
    await Cache.delPattern('categories:*');
    return ApiResponse.success(res, null, 'Category deleted successfully');
  } catch (error) {
    logger.error('Delete category error:', error);
    throw error;
  }
};

exports.reorder = async (req, res) => {
  try {
    const { items } = req.body; // [{id, sort_order}]
    for (const item of items) {
      await query('UPDATE categories SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
    await Cache.delPattern('categories:*');
    return ApiResponse.success(res, null, 'Categories reordered');
  } catch (error) {
    logger.error('Reorder categories error:', error);
    throw error;
  }
};