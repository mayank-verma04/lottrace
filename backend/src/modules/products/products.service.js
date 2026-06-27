const db = require('../../db/knex');
const { v4: uuid } = require('uuid');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');

/**
 * Create a new product.
 * @param {Object} data - Validated product data (camelCase)
 * @param {string} organizationId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const createProduct = async (data, organizationId, userId) => {
  const [product] = await db('products')
    .insert({
      id: uuid(),
      organization_id: organizationId,
      name: data.name,
      sku: data.sku || null,
      gtin: data.gtin || null,
      category: data.category || null,
      is_ftl: data.isFtl || false,
      default_uom: data.defaultUom || 'kg',
      custom_kde_schema: JSON.stringify(data.customKdeSchema || []),
      created_by: userId,
    })
    .returning('*');

  return product;
};

/**
 * List products with pagination and filters.
 * @param {Object} params
 * @param {string} organizationId
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const listProducts = async (params, organizationId) => {
  const { page, limit, category, isFtl, isActive, search, sort, order } = params;

  const sortColumnMap = {
    name: 'name',
    createdAt: 'created_at',
    category: 'category',
    sku: 'sku',
  };

  let query = db('products')
    .where({ organization_id: organizationId })
    .select('*')
    .orderBy(sortColumnMap[sort] || 'created_at', order || 'desc');

  if (category) {
    query = query.where({ category });
  }
  if (isFtl !== undefined) {
    query = query.where({ is_ftl: isFtl === 'true' });
  }
  if (isActive !== undefined) {
    query = query.where({ is_active: isActive === 'true' });
  } else {
    query = query.where({ is_active: true });
  }
  if (search) {
    query = query.where(function () {
      this.whereILike('name', `%${search}%`)
        .orWhereILike('sku', `%${search}%`)
        .orWhereILike('gtin', `%${search}%`);
    });
  }

  return paginate(query, { page, limit });
};

/**
 * Get a single product by ID.
 * @param {string} productId
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const getProduct = async (productId, organizationId) => {
  const product = await db('products')
    .where({ id: productId, organization_id: organizationId })
    .first();

  if (!product) {
    throw new AppError('Product not found', 'NOT_FOUND', 404);
  }

  return product;
};

/**
 * Update a product.
 * @param {string} productId
 * @param {Object} data
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const updateProduct = async (productId, data, organizationId) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.gtin !== undefined) updateData.gtin = data.gtin;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.isFtl !== undefined) updateData.is_ftl = data.isFtl;
  if (data.defaultUom !== undefined) updateData.default_uom = data.defaultUom;
  if (data.customKdeSchema !== undefined) updateData.custom_kde_schema = JSON.stringify(data.customKdeSchema);

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields to update', 'VALIDATION_ERROR', 422);
  }

  updateData.updated_at = db.fn.now();

  const [updated] = await db('products')
    .where({ id: productId, organization_id: organizationId })
    .update(updateData)
    .returning('*');

  if (!updated) {
    throw new AppError('Product not found', 'NOT_FOUND', 404);
  }

  return updated;
};

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
};
