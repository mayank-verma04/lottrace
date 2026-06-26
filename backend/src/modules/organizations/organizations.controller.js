const organizationsService = require('./organizations.service');
const apiResponse = require('../../utils/apiResponse');

const getMe = async (req, res) => {
  const org = await organizationsService.getOrganization(req.organizationId);
  return apiResponse.success(res, org, 'Organization fetched successfully');
};

const updateMe = async (req, res) => {
  const org = await organizationsService.updateOrganization(req.organizationId, req.validatedBody);
  return apiResponse.success(res, org, 'Organization updated successfully');
};

module.exports = {
  getMe,
  updateMe,
};
