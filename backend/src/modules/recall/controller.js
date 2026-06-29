const service = require('./service');
const apiResponse = require('../../utils/apiResponse');
const { getPaginationParams } = require('../../utils/pagination');

const runSimulation = async (req, res) => {
  const sim = await service.runSimulation(req.user.organizationId, req.user.id, req.body);
  return apiResponse.success(res, sim, 'Recall simulation completed', 201);
};

const listSimulations = async (req, res) => {
  const pagination = getPaginationParams(req.query);
  const result = await service.listSimulations(req.user.organizationId, pagination);
  return apiResponse.success(res, result.data, 'Simulations retrieved', 200, {
    total: result.total,
    page: pagination.page,
    limit: pagination.limit
  });
};

const getSimulation = async (req, res) => {
  const sim = await service.getSimulation(req.user.organizationId, req.params.id);
  return apiResponse.success(res, sim, 'Simulation retrieved');
};

module.exports = {
  runSimulation,
  listSimulations,
  getSimulation
};
