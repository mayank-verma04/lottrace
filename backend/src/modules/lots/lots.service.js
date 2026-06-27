const db = require('../../db/knex');
const { v4: uuid } = require('uuid');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');

/**
 * Create a new lot.
 * @param {Object} data - Validated lot data
 * @param {string} organizationId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const createLot = async (data, organizationId, userId) => {
  const [lot] = await db('lots')
    .insert({
      id: uuid(),
      organization_id: organizationId,
      product_id: data.productId,
      traceability_lot_code: data.traceabilityLotCode,
      quantity: data.quantity,
      uom: data.uom,
      notes: data.notes || null,
      created_by: userId,
    })
    .returning('*');

  return lot;
};

/**
 * List lots with pagination and filters.
 * @param {Object} params
 * @param {string} organizationId
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const listLots = async (params, organizationId) => {
  const { page, limit, productId, status, search, sort, order } = params;

  const sortColumnMap = {
    traceabilityLotCode: 'lots.traceability_lot_code',
    createdAt: 'lots.created_at',
    quantity: 'lots.quantity',
    status: 'lots.status',
  };

  let query = db('lots')
    .join('products', 'lots.product_id', 'products.id')
    .where('lots.organization_id', organizationId)
    .select(
      'lots.*',
      'products.name as product_name',
      'products.sku as product_sku'
    )
    .orderBy(sortColumnMap[sort] || 'lots.created_at', order || 'desc');

  if (productId) {
    query = query.where('lots.product_id', productId);
  }
  if (status) {
    query = query.where('lots.status', status);
  }
  if (search) {
    query = query.where(function () {
      this.whereILike('lots.traceability_lot_code', `%${search}%`)
        .orWhereILike('products.name', `%${search}%`);
    });
  }

  return paginate(query, { page, limit });
};

/**
 * Get a single lot by ID.
 * @param {string} lotId
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const getLot = async (lotId, organizationId) => {
  const lot = await db('lots')
    .join('products', 'lots.product_id', 'products.id')
    .where({ 'lots.id': lotId, 'lots.organization_id': organizationId })
    .select(
      'lots.*',
      'products.name as product_name',
      'products.sku as product_sku',
      'products.default_uom as product_default_uom'
    )
    .first();

  if (!lot) {
    throw new AppError('Lot not found', 'NOT_FOUND', 404);
  }

  return lot;
};

/**
 * Update a lot.
 * @param {string} lotId
 * @param {Object} data
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const updateLot = async (lotId, data, organizationId) => {
  // Check if lot is voided
  const current = await db('lots').where({ id: lotId, organization_id: organizationId }).first();
  if (!current) throw new AppError('Lot not found', 'NOT_FOUND', 404);
  if (current.status === 'void') throw new AppError('Cannot update a voided lot', 'LOT_VOIDED', 400);
  if (current.status === 'recalled') throw new AppError('Cannot update a recalled lot', 'LOT_RECALLED', 400);

  const updateData = {};
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields to update', 'VALIDATION_ERROR', 422);
  }

  updateData.updated_at = db.fn.now();
  updateData.version = current.version + 1; // optimistic concurrency

  const [updated] = await db('lots')
    .where({ id: lotId, organization_id: organizationId })
    .update(updateData)
    .returning('*');

  return updated;
};

/**
 * Void a lot.
 * @param {string} lotId
 * @param {string} voidReason
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const voidLot = async (lotId, voidReason, organizationId) => {
  const current = await db('lots').where({ id: lotId, organization_id: organizationId }).first();
  if (!current) throw new AppError('Lot not found', 'NOT_FOUND', 404);
  if (current.status === 'void') throw new AppError('Lot is already voided', 'LOT_VOIDED', 400);

  const [voided] = await db('lots')
    .where({ id: lotId, organization_id: organizationId })
    .update({
      status: 'void',
      void_reason: voidReason,
      updated_at: db.fn.now(),
      version: current.version + 1,
    })
    .returning('*');

  return voided;
};

module.exports = {
  createLot,
  listLots,
  getLot,
  updateLot,
  voidLot,
};
