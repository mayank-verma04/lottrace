const importsService = require('./service');
const apiResponse = require('../../utils/apiResponse');
const { uploadBuffer } = require('../../lib/storage');

/**
 * POST /imports — Upload CSV and create import job.
 * File comes via multer middleware (req.file).
 */
const createImport = async (req, res) => {
  const organizationId = req.user.organizationId;
  const userId = req.user.id;
  const { cte_type } = req.validatedBody;

  if (!req.file) {
    return apiResponse.error(res, 'CSV file is required', 'VALIDATION_ERROR', 422);
  }

  // Validate file extension
  const originalName = req.file.originalname || 'import.csv';
  if (!originalName.toLowerCase().endsWith('.csv')) {
    return apiResponse.error(res, 'Only CSV files are accepted', 'IMPORT_INVALID_FORMAT', 422);
  }

  // Validate file not empty
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return apiResponse.error(res, 'Uploaded file is empty', 'IMPORT_INVALID_FORMAT', 422);
  }

  // Upload to S3
  const storageKey = `imports/org_${organizationId}/${Date.now()}_${originalName.replace(/\s+/g, '_')}`;
  await uploadBuffer(storageKey, req.file.buffer, 'text/csv');

  // Create import record + enqueue job
  const importJob = await importsService.createImport({
    organizationId,
    userId,
    filename: originalName,
    storageKey,
    cteType: cte_type,
  });

  return apiResponse.created(res, importJob, 'Import created and queued for processing');
};

/**
 * GET /imports — List imports with pagination.
 */
const listImports = async (req, res) => {
  const organizationId = req.user.organizationId;
  const { page, limit, status, cteType } = req.validatedQuery || req.query;

  const result = await importsService.listImports(organizationId, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    status,
    cteType,
  });

  return apiResponse.paginated(res, result.data, result.pagination, 'Imports fetched successfully');
};

/**
 * GET /imports/:id — Get single import.
 */
const getImport = async (req, res) => {
  const organizationId = req.user.organizationId;
  const { id } = req.params;

  const result = await importsService.getImportById(organizationId, id);
  return apiResponse.success(res, result, 'Import fetched successfully');
};

/**
 * GET /imports/:importId/errors — Get paginated error list for an import.
 */
const getImportErrors = async (req, res) => {
  const organizationId = req.user.organizationId;
  const { importId } = req.params;
  const { page, limit } = req.validatedQuery || req.query;

  const result = await importsService.getImportErrors(organizationId, importId, {
    page: Number(page) || 1,
    limit: Number(limit) || 50,
  });

  return apiResponse.paginated(res, result.data, result.pagination, 'Import errors fetched successfully');
};

/**
 * GET /imports/template/:cteType — Download CSV template.
 */
const downloadTemplate = async (req, res) => {
  const { cteType } = req.validatedParams || req.params;

  const csv = importsService.generateTemplate(cteType);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${cteType}_import_template.csv"`);
  return res.send(csv);
};

module.exports = {
  createImport,
  listImports,
  getImport,
  getImportErrors,
  downloadTemplate,
};
