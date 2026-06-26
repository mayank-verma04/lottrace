const db = require('../../db/knex');
const AppError = require('../../utils/AppError');

/**
 * Get organization by ID.
 * @param {string} organizationId
 * @returns {Promise<Object>}
 */
const getOrganization = async (organizationId) => {
  const org = await db('organizations').where({ id: organizationId }).first();
  if (!org) {
    throw new AppError('Organization not found', 'NOT_FOUND', 404);
  }
  return formatOrg(org);
};

/**
 * Update organization (partial).
 * @param {string} organizationId
 * @param {{ name?: string, timezoneDefault?: string, uomDefault?: string, customSettings?: object }} data
 * @returns {Promise<Object>}
 */
const updateOrganization = async (organizationId, data) => {
  const updatePayload = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.timezoneDefault !== undefined) updatePayload.timezone_default = data.timezoneDefault;
  if (data.uomDefault !== undefined) updatePayload.uom_default = data.uomDefault;
  if (data.customSettings !== undefined) updatePayload.custom_settings = JSON.stringify(data.customSettings);

  if (Object.keys(updatePayload).length === 0) {
    throw new AppError('No fields to update', 'VALIDATION_ERROR', 422);
  }

  updatePayload.updated_at = db.fn.now();

  const [updated] = await db('organizations')
    .where({ id: organizationId })
    .update(updatePayload)
    .returning('*');

  if (!updated) {
    throw new AppError('Organization not found', 'NOT_FOUND', 404);
  }

  return formatOrg(updated);
};

/**
 * Maps snake_case DB row to camelCase API response.
 * @param {Object} org
 * @returns {Object}
 */
const formatOrg = (org) => ({
  id: org.id,
  name: org.name,
  slug: org.slug,
  industryVertical: org.industry_vertical,
  planTier: org.plan_tier,
  status: org.status,
  timezoneDefault: org.timezone_default,
  uomDefault: org.uom_default,
  customSettings: org.custom_settings,
  createdAt: org.created_at,
  updatedAt: org.updated_at,
});

module.exports = {
  getOrganization,
  updateOrganization,
};
