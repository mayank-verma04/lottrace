const crypto = require('crypto');
const db = require('../../db/knex');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');
const emailService = require('../../utils/email');

// Sort field mapping: camelCase API → snake_case DB
const SORT_MAP = {
  createdAt: 'created_at',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  role: 'role',
  status: 'status',
};

/**
 * List users in organization (paginated, filterable).
 * @param {string} organizationId
 * @param {{ page: number, limit: number, status?: string, role?: string, search?: string, sort: string, order: string }} params
 */
const listUsers = async (organizationId, params) => {
  let query = db('users')
    .where({ organization_id: organizationId })
    .select('id', 'first_name', 'last_name', 'email', 'role', 'status', 'last_login_at', 'created_at', 'updated_at')
    .orderBy(SORT_MAP[params.sort] || 'created_at', params.order);

  if (params.status) {
    query = query.where({ status: params.status });
  }

  if (params.role) {
    query = query.where({ role: params.role });
  }

  if (params.search) {
    const term = `%${params.search}%`;
    query = query.where(function () {
      this.whereILike('first_name', term)
        .orWhereILike('last_name', term)
        .orWhereILike('email', term);
    });
  }

  const result = await paginate(query, { page: params.page, limit: params.limit });

  return {
    data: result.data.map(formatUser),
    pagination: result.pagination,
  };
};

/**
 * Get single user by ID within organization.
 * Returns 404 for cross-tenant (never 403).
 * @param {string} organizationId
 * @param {string} userId
 */
const getUserById = async (organizationId, userId) => {
  const user = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .first();

  if (!user) {
    throw new AppError('User not found', 'NOT_FOUND', 404);
  }

  return formatUser(user);
};

/**
 * Invite a new user to the organization.
 * Creates user with status 'invited' and generates invite token.
 * @param {string} organizationId
 * @param {{ email: string, firstName: string, lastName: string, role: string }} data
 * @param {string} invitedBy - ID of user sending invite
 */
const inviteUser = async (organizationId, data, invitedBy) => {
  // Check duplicate email within org
  const existing = await db('users')
    .where({ email: data.email, organization_id: organizationId })
    .whereNot({ status: 'deactivated' })
    .first();

  if (existing) {
    throw new AppError('A user with this email already exists in this organization', 'DUPLICATE_ENTRY', 409);
  }

  // Generate invite token
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
  const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  const [user] = await db('users')
    .insert({
      organization_id: organizationId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      role: data.role,
      status: 'invited',
      invite_token_hash: inviteTokenHash,
      invite_expires_at: inviteExpiresAt,
    })
    .returning('*');

  const org = await db('organizations').where({ id: organizationId }).select('name').first();
  const organizationName = org ? org.name : 'LotTrace';

  await emailService.sendInviteEmail(data.email, inviteToken, organizationName);

  return formatUser(user);
};

/**
 * Update user (partial).
 * Prevents self-role-change and demoting last org_admin.
 * @param {string} organizationId
 * @param {string} userId
 * @param {{ firstName?: string, lastName?: string, role?: string }} data
 * @param {{ id: string, role: string }} actor - The user performing the update
 */
const updateUser = async (organizationId, userId, data, actor) => {
  const user = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .first();

  if (!user) {
    throw new AppError('User not found', 'NOT_FOUND', 404);
  }

  // Prevent changing own role
  if (data.role && actor.id === userId) {
    throw new AppError('Cannot change your own role', 'AUTH_FORBIDDEN', 403);
  }

  // Prevent demoting last org_admin
  if (data.role && user.role === 'org_admin' && data.role !== 'org_admin') {
    const adminCount = await db('users')
      .where({ organization_id: organizationId, role: 'org_admin' })
      .whereNot({ status: 'deactivated' })
      .count('id as count')
      .first();

    if (parseInt(adminCount.count, 10) <= 1) {
      throw new AppError('Cannot demote the last organization admin', 'AUTH_FORBIDDEN', 403);
    }
  }

  const updatePayload = {};
  if (data.firstName !== undefined) updatePayload.first_name = data.firstName;
  if (data.lastName !== undefined) updatePayload.last_name = data.lastName;
  if (data.role !== undefined) updatePayload.role = data.role;

  if (Object.keys(updatePayload).length === 0) {
    throw new AppError('No fields to update', 'VALIDATION_ERROR', 422);
  }

  updatePayload.updated_at = db.fn.now();

  const [updated] = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .update(updatePayload)
    .returning('*');

  return formatUser(updated);
};

/**
 * Deactivate a user. Prevents self-deactivation and deactivating last admin.
 * Revokes all refresh tokens.
 * @param {string} organizationId
 * @param {string} userId
 * @param {string} actorId - ID of user performing deactivation
 */
const deactivateUser = async (organizationId, userId, actorId) => {
  if (actorId === userId) {
    throw new AppError('Cannot deactivate your own account', 'AUTH_FORBIDDEN', 403);
  }

  const user = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .first();

  if (!user) {
    throw new AppError('User not found', 'NOT_FOUND', 404);
  }

  if (user.status === 'deactivated') {
    throw new AppError('User is already deactivated', 'CONFLICT', 409);
  }

  // Prevent deactivating last org_admin
  if (user.role === 'org_admin') {
    const adminCount = await db('users')
      .where({ organization_id: organizationId, role: 'org_admin' })
      .whereNot({ status: 'deactivated' })
      .count('id as count')
      .first();

    if (parseInt(adminCount.count, 10) <= 1) {
      throw new AppError('Cannot deactivate the last organization admin', 'AUTH_FORBIDDEN', 403);
    }
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('users')
      .where({ id: userId, organization_id: organizationId })
      .update({ status: 'deactivated', updated_at: trx.fn.now() })
      .returning('*');

    // Revoke all refresh tokens for this user
    await trx('refresh_tokens')
      .where({ user_id: userId })
      .update({ is_used: true });

    return formatUser(updated);
  });
};

/**
 * Reactivate a deactivated user.
 * @param {string} organizationId
 * @param {string} userId
 */
const reactivateUser = async (organizationId, userId) => {
  const user = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .first();

  if (!user) {
    throw new AppError('User not found', 'NOT_FOUND', 404);
  }

  if (user.status !== 'deactivated') {
    throw new AppError('Only deactivated users can be reactivated', 'CONFLICT', 409);
  }

  const [updated] = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .update({ status: 'active', updated_at: db.fn.now() })
    .returning('*');

  return formatUser(updated);
};

/**
 * Maps snake_case DB row to camelCase API response.
 * Excludes sensitive fields (password_hash, invite_token_hash).
 * @param {Object} user
 */
const formatUser = (user) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
  status: user.status,
  lastLoginAt: user.last_login_at,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

/**
 * Resend an invite for a pending (status='invited') user.
 * Generates a fresh token and extends expiry by 72h.
 * @param {string} organizationId
 * @param {string} userId
 */
const resendInvite = async (organizationId, userId) => {
  const user = await db('users')
    .where({ id: userId, organization_id: organizationId })
    .first();

  if (!user) {
    throw new AppError('User not found', 'NOT_FOUND', 404);
  }
  if (user.status !== 'invited') {
    throw new AppError('Only pending invitations can be resent', 'CONFLICT', 409);
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
  const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await db('users')
    .where({ id: userId })
    .update({ invite_token_hash: inviteTokenHash, invite_expires_at: inviteExpiresAt, updated_at: db.fn.now() });

  const org = await db('organizations').where({ id: organizationId }).select('name').first();
  await emailService.sendInviteEmail(user.email, inviteToken, org ? org.name : 'LotTrace');

  return formatUser(user);
};

module.exports = {
  listUsers,
  getUserById,
  inviteUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  resendInvite,
};
