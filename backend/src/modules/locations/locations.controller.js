const apiResponse = require('../../utils/apiResponse');
const locationsService = require('./locations.service');

const createLocation = async (req, res) => {
  const location = await locationsService.createLocation(req.validatedBody, req.organizationId, req.user.id);
  return apiResponse.created(res, location, 'Location created successfully');
};

const listLocations = async (req, res) => {
  const { data, pagination } = await locationsService.listLocations(req.validatedQuery, req.organizationId);
  return apiResponse.paginated(res, data, pagination, 'Locations fetched successfully');
};

const getLocation = async (req, res) => {
  const location = await locationsService.getLocation(req.params.locationId, req.organizationId);
  return apiResponse.success(res, location, 'Location fetched successfully');
};

const updateLocation = async (req, res) => {
  const location = await locationsService.updateLocation(req.params.locationId, req.validatedBody, req.organizationId);
  return apiResponse.success(res, location, 'Location updated successfully');
};

const deactivateLocation = async (req, res) => {
  const location = await locationsService.deactivateLocation(req.params.locationId, req.organizationId);
  return apiResponse.success(res, location, 'Location deactivated successfully');
};

module.exports = {
  createLocation,
  listLocations,
  getLocation,
  updateLocation,
  deactivateLocation,
};
