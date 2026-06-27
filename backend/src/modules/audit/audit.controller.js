const apiResponse = require('../../utils/apiResponse');
const auditService = require('./audit.service');

const getAuditLogs = async (req, res) => {
  const { data, pagination } = await auditService.getAuditLogs(req.validatedQuery, req.organizationId);
  return apiResponse.paginated(res, data, pagination, 'Audit logs fetched successfully');
};

module.exports = {
  getAuditLogs,
};
