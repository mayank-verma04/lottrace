const db = require('../../db/knex');

const getComplianceGaps = async (organizationId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;

  const [countResult] = await db('events')
    .where({ organization_id: organizationId, has_compliance_gaps: true })
    .count('id as total');

  const total = parseInt(countResult.total, 10);

  const gaps = await db('events')
    .where({ organization_id: organizationId, has_compliance_gaps: true })
    .orderBy('event_datetime', 'desc')
    .limit(limit)
    .offset(offset)
    .select(
      'id',
      'event_type',
      'event_datetime',
      'location_id',
      'compliance_gaps',
      'kde_payload',
      'created_at'
    );

  return {
    data: gaps,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getComplianceGaps,
};
