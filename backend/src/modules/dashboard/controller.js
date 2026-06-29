const service = require('./service');
const apiResponse = require('../../utils/apiResponse');

const getStats = async (req, res) => {
  const stats = await service.getStats(req.user.organizationId);
  return apiResponse.success(res, stats, 'Dashboard stats retrieved');
};

const getActivityFeed = async (req, res) => {
  const feed = await service.getActivityFeed(req.user.organizationId);
  return apiResponse.success(res, feed, 'Recent activity retrieved');
};

module.exports = {
  getStats,
  getActivityFeed
};
