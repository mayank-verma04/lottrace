const apiResponse = require('../../utils/apiResponse');
const traceService = require('./trace.service');

const forwardTrace = async (req, res) => {
  const { lotId } = req.params;
  const result = await traceService.forwardTrace(lotId, req.organizationId);
  return apiResponse.success(res, result, 'Forward trace completed');
};

const backwardTrace = async (req, res) => {
  const { lotId } = req.params;
  const result = await traceService.backwardTrace(lotId, req.organizationId);
  return apiResponse.success(res, result, 'Backward trace completed');
};

const fullTrace = async (req, res) => {
  const { lotId } = req.params;
  const result = await traceService.fullTrace(lotId, req.organizationId);
  return apiResponse.success(res, result, 'Full trace completed');
};

module.exports = {
  forwardTrace,
  backwardTrace,
  fullTrace,
};
