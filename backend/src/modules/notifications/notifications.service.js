const db = require('../../db/knex');
const { paginate } = require('../../utils/pagination');

const getNotifications = async (query, organizationId, userId) => {
  const { page, limit, unreadOnly } = query;

  const baseQuery = db('notifications')
    .where('organization_id', organizationId)
    .andWhere(function () {
      this.where('user_id', userId).orWhereNull('user_id');
    })
    .orderBy('created_at', 'desc');

  if (unreadOnly === 'true') {
    baseQuery.andWhere('is_read', false);
  }

  return paginate(baseQuery, { page, limit });
};

const markAsRead = async (id, organizationId, userId) => {
  // Only mark if it belongs to user or org-wide
  const updated = await db('notifications')
    .where('id', id)
    .andWhere('organization_id', organizationId)
    .andWhere(function () {
      this.where('user_id', userId).orWhereNull('user_id');
    })
    .update({ is_read: true })
    .returning('*');

  return updated[0];
};

const markAllAsRead = async (organizationId, userId) => {
  await db('notifications')
    .where('organization_id', organizationId)
    .andWhere('is_read', false)
    .andWhere(function () {
      this.where('user_id', userId).orWhereNull('user_id');
    })
    .update({ is_read: true });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
