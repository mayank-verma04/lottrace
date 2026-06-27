const reportsService = require('./reports.service');
const apiResponse = require('../../utils/apiResponse');
const { exportQueue } = require('../../jobs/queues');

const getComplianceGaps = async (req, res) => {
  const { page, limit } = req.query;
  const result = await reportsService.getComplianceGaps(req.user.organizationId, {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 50,
  });

  return apiResponse.paginated(res, result.data, result.meta, 'Compliance gaps retrieved');
};

const requestExport = async (req, res) => {
  const { format = 'csv' } = req.body;

  const job = await exportQueue.add('export-events', {
    organizationId: req.user.organizationId,
    userId: req.user.id,
    format,
  });

  return apiResponse.success(res, { jobId: job.id }, 'Export job started', 202);
};

module.exports = {
  getComplianceGaps,
  requestExport,
};
