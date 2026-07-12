const db = require('../../db/knex');
const { v4: uuid } = require('uuid');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');

/**
 * Create a new location.
 * @param {Object} data - Validated location data (camelCase)
 * @param {string} organizationId - From JWT
 * @param {string} userId - From JWT
 * @returns {Promise<Object>} Created location
 */
const createLocation = async (data, organizationId, userId) => {
  const existingLocations = await db('locations')
    .where({ organization_id: organizationId, name: data.name });

  if (existingLocations.length > 0) {
    if (!data.gln && !data.addressLine1 && !data.city) {
      throw new AppError('A location with this name already exists. Please provide a GLN, Address Line 1, or City to differentiate them.', 'VALIDATION_ERROR', 409);
    }
    
    const exactMatch = existingLocations.find(loc => 
      (loc.gln || null) === (data.gln || null) &&
      (loc.address_line1 || null) === (data.addressLine1 || null) &&
      (loc.city || null) === (data.city || null)
    );

    if (exactMatch) {
      throw new AppError('A location with this exact name, GLN, Address, and City already exists.', 'VALIDATION_ERROR', 409);
    }
  }

  const [location] = await db('locations')
    .insert({
      id: uuid(),
      organization_id: organizationId,
      name: data.name,
      type: data.type,
      is_external: data.isExternal || false,
      address_line1: data.addressLine1 || null,
      address_line2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.postalCode || null,
      country: data.country || 'US',
      gln: data.gln || null,
      timezone: data.timezone || null,
      created_by: userId,
    })
    .returning('*');

  return location;
};

/**
 * List locations with pagination and filters.
 * @param {Object} params - Query params (page, limit, type, isExternal, isActive, search, sort, order)
 * @param {string} organizationId
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const listLocations = async (params, organizationId) => {
  const { page, limit, type, isExternal, isActive, search, sort, order } = params;

  const sortColumnMap = {
    name: 'name',
    createdAt: 'created_at',
    city: 'city',
    type: 'type',
  };

  let query = db('locations')
    .where({ organization_id: organizationId })
    .select('*')
    .orderBy(sortColumnMap[sort] || 'created_at', order || 'desc');

  if (type) {
    query = query.where({ type });
  }
  if (isExternal !== undefined) {
    query = query.where({ is_external: isExternal === 'true' });
  }
  if (isActive !== undefined) {
    query = query.where({ is_active: isActive === 'true' });
  } else {
    // Default: show only active
    query = query.where({ is_active: true });
  }
  if (search) {
    query = query.where(function () {
      this.whereILike('name', `%${search}%`)
        .orWhereILike('city', `%${search}%`)
        .orWhereILike('gln', `%${search}%`);
    });
  }

  return paginate(query, { page, limit });
};

/**
 * Get a single location by ID.
 * @param {string} locationId
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const getLocation = async (locationId, organizationId) => {
  const location = await db('locations')
    .where({ id: locationId, organization_id: organizationId })
    .first();

  if (!location) {
    throw new AppError('Location not found', 'NOT_FOUND', 404);
  }

  return location;
};

/**
 * Update a location.
 * @param {string} locationId
 * @param {Object} data - Validated update data (camelCase)
 * @param {string} organizationId
 * @returns {Promise<Object>} Updated location
 */
const updateLocation = async (locationId, data, organizationId) => {
  // Build update object only with provided fields
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.isExternal !== undefined) updateData.is_external = data.isExternal;
  if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1;
  if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.gln !== undefined) updateData.gln = data.gln;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields to update', 'VALIDATION_ERROR', 422);
  }

  if (data.name !== undefined || data.gln !== undefined || data.addressLine1 !== undefined || data.city !== undefined) {
    const current = await db('locations').where({ id: locationId, organization_id: organizationId }).first();
    if (!current) throw new AppError('Location not found', 'NOT_FOUND', 404);

    const newName = data.name !== undefined ? data.name : current.name;
    const newGln = data.gln !== undefined ? data.gln : current.gln;
    const newAddressLine1 = data.addressLine1 !== undefined ? data.addressLine1 : current.address_line1;
    const newCity = data.city !== undefined ? data.city : current.city;

    const existingLocations = await db('locations')
      .where({ organization_id: organizationId, name: newName })
      .whereNot({ id: locationId });

    if (existingLocations.length > 0) {
      if (!newGln && !newAddressLine1 && !newCity) {
        throw new AppError('A location with this name already exists. Please provide a GLN, Address Line 1, or City to differentiate them.', 'VALIDATION_ERROR', 409);
      }
      
      const exactMatch = existingLocations.find(loc => 
        (loc.gln || null) === (newGln || null) &&
        (loc.address_line1 || null) === (newAddressLine1 || null) &&
        (loc.city || null) === (newCity || null)
      );

      if (exactMatch) {
        throw new AppError('A location with this exact name, GLN, Address, and City already exists.', 'VALIDATION_ERROR', 409);
      }
    }
  }

  updateData.updated_at = db.fn.now();

  const [updated] = await db('locations')
    .where({ id: locationId, organization_id: organizationId })
    .update(updateData)
    .returning('*');

  if (!updated) {
    throw new AppError('Location not found', 'NOT_FOUND', 404);
  }

  return updated;
};

/**
 * Soft deactivate a location.
 * @param {string} locationId
 * @param {string} organizationId
 * @returns {Promise<Object>} Deactivated location
 */
const deactivateLocation = async (locationId, organizationId) => {
  const [deactivated] = await db('locations')
    .where({ id: locationId, organization_id: organizationId, is_active: true })
    .update({ is_active: false, updated_at: db.fn.now() })
    .returning('*');

  if (!deactivated) {
    throw new AppError('Location not found or already deactivated', 'NOT_FOUND', 404);
  }

  return deactivated;
};

module.exports = {
  createLocation,
  listLocations,
  getLocation,
  updateLocation,
  deactivateLocation,
};
