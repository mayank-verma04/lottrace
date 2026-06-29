const db = require('../../db/knex');

const getStats = async (organizationId) => {
  const activeLotsRes = await db('lots').where({ organization_id: organizationId, status: 'active' }).count('id as count').first();
  const activeLocationsRes = await db('locations').where({ organization_id: organizationId, is_active: true }).count('id as count').first();
  const activeProductsRes = await db('products').where({ organization_id: organizationId, is_active: true }).count('id as count').first();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const eventsThisWeekRes = await db('events')
    .where({ organization_id: organizationId })
    .andWhere('event_datetime', '>=', sevenDaysAgo.toISOString())
    .count('id as count').first();
    
  const complianceGapsRes = await db('events')
    .where({ organization_id: organizationId, has_compliance_gaps: true, status: 'active' })
    .count('id as count').first();

  return {
    activeLots: parseInt(activeLotsRes.count, 10),
    activeLocations: parseInt(activeLocationsRes.count, 10),
    activeProducts: parseInt(activeProductsRes.count, 10),
    eventsThisWeek: parseInt(eventsThisWeekRes.count, 10),
    openComplianceGaps: parseInt(complianceGapsRes.count, 10),
  };
};

const getActivityFeed = async (organizationId) => {
  // Return latest 10 events
  const events = await db('events')
    .where({ organization_id: organizationId })
    .orderBy('created_at', 'desc')
    .limit(10);
  
  // Enrich with user name
  if (events.length > 0) {
    const userIds = [...new Set(events.map(e => e.recorded_by))];
    const users = await db('users').whereIn('id', userIds).select('id', 'first_name', 'last_name');
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    
    return events.map(e => ({
      ...e,
      recordedByName: userMap[e.recorded_by] ? `${userMap[e.recorded_by].first_name} ${userMap[e.recorded_by].last_name}` : 'Unknown'
    }));
  }
  return [];
};

module.exports = {
  getStats,
  getActivityFeed
};
