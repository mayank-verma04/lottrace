const importsService = require('./service');
const apiResponse = require('../../utils/apiResponse');

const createImport = async (req, res) => {
  const { filename, storage_key, cte_type } = req.body;
  const organizationId = req.user.organizationId;
  const userId = req.user.id;

  const importJob = await importsService.createImport({
    organizationId,
    userId,
    filename,
    storage_key,
    cte_type,
  });

  return apiResponse.success(res, importJob, 201);
};

const listImports = async (req, res) => {
  const organizationId = req.user.organizationId;
  const { page, limit } = req.query;

  const results = await importsService.listImports(organizationId, { page, limit });
  return apiResponse.paginated(res, results.data, results.meta);
};

const getImport = async (req, res) => {
  const organizationId = req.user.organizationId;
  const { id } = req.params;

  const result = await importsService.getImportById(organizationId, id);
  return apiResponse.success(res, result);
};

module.exports = {
  createImport,
  listImports,
  getImport,
};
