const db = require('../../db/knex');
const { paginate } = require('../../utils/pagination');

const getAuditLogs = async (query, organizationId) => {
  const { page, limit, action, entityType, entityId, actorId } = query;

  const q = db('audit_log')
    .where({ 'audit_log.organization_id': organizationId })
    .leftJoin('users', 'audit_log.actor_id', 'users.id')
    .select(
      'audit_log.*',
      'users.first_name as actor_first_name',
      'users.last_name as actor_last_name',
      'users.email as actor_email'
    )
    .orderBy('audit_log.created_at', 'desc');

  if (action) q.where('audit_log.action', action);
  if (entityType) q.where('audit_log.entity_type', entityType);
  if (entityId) q.where('audit_log.entity_id', entityId);
  if (actorId) q.where('audit_log.actor_id', actorId);

  return paginate(q, { page, limit });
};

module.exports = {
  getAuditLogs,
};
