const db = require('../../db/knex');
const { v4: uuid } = require('uuid');
const { importQueue } = require('../../jobs/queues');
const AppError = require('../../utils/AppError');
const { paginate } = require('../../utils/pagination');
const { uploadBuffer, generatePresignedDownloadUrl } = require('../../lib/storage');
const { stringify } = require('csv-stringify/sync');

// ─── CSV Template Columns per CTE Type ──────────────────────
const TEMPLATE_COLUMNS = {
  creation: [
    'traceability_lot_code',
    'product_name',
    'quantity',
    'uom',
    'location_name',
    'event_datetime',
    'notes',
  ],
  receiving: [
    'traceability_lot_code',
    'product_name',
    'quantity',
    'uom',
    'location_name',
    'event_datetime',
    'counterparty_name',
    'counterparty_lot_code',
    'notes',
  ],
  shipping: [
    'traceability_lot_code',
    'product_name',
    'quantity',
    'uom',
    'location_name',
    'event_datetime',
    'counterparty_name',
    'notes',
  ],
  transformation: [
    'output_lot_code',
    'output_product_name',
    'output_quantity',
    'output_uom',
    'input_lot_codes',
    'location_name',
    'event_datetime',
    'notes',
  ],
};

// ─── Example rows per CTE Type (for template download) ──────
const TEMPLATE_EXAMPLES = {
  creation: {
    traceability_lot_code: 'LOT-2024-001',
    product_name: 'Organic Spinach',
    quantity: '500',
    uom: 'kg',
    location_name: 'Main Farm',
    event_datetime: '2024-06-15T08:00:00.000Z',
    notes: 'Morning harvest',
  },
  receiving: {
    traceability_lot_code: 'LOT-2024-002',
    product_name: 'Organic Spinach',
    quantity: '480',
    uom: 'kg',
    location_name: 'Processing Plant',
    event_datetime: '2024-06-16T10:30:00.000Z',
    counterparty_name: 'Green Farms LLC',
    counterparty_lot_code: 'GF-LOT-887',
    notes: 'Received via refrigerated truck',
  },
  shipping: {
    traceability_lot_code: 'LOT-2024-003',
    product_name: 'Bagged Spinach 1lb',
    quantity: '200',
    uom: 'units',
    location_name: 'Distribution Center',
    event_datetime: '2024-06-17T14:00:00.000Z',
    counterparty_name: 'FreshMart Stores',
    notes: 'Shipped to East region',
  },
  transformation: {
    output_lot_code: 'LOT-2024-004',
    output_product_name: 'Bagged Spinach 1lb',
    output_quantity: '200',
    output_uom: 'units',
    input_lot_codes: 'LOT-2024-001,LOT-2024-002',
    location_name: 'Processing Plant',
    event_datetime: '2024-06-16T15:00:00.000Z',
    notes: 'Washed and packaged',
  },
};

/**
 * Create a new import record and enqueue BullMQ job.
 * File already uploaded to S3 by controller.
 */
const createImport = async ({ organizationId, userId, filename, storageKey, cteType }) => {
  const [newImport] = await db('imports')
    .insert({
      id: uuid(),
      organization_id: organizationId,
      created_by: userId,
      filename,
      storage_key: storageKey,
      cte_type: cteType,
      status: 'pending',
    })
    .returning('*');

  const job = await importQueue.add('process-import', {
    importId: newImport.id,
    organizationId,
    storageKey,
    cteType,
    userId,
  });

  await db('imports')
    .where('id', newImport.id)
    .update({ job_id: job.id });

  newImport.job_id = job.id;
  return newImport;
};

/**
 * List imports with pagination and filters.
 */
const listImports = async (organizationId, { page = 1, limit = 20, status, cteType }) => {
  let query = db('imports')
    .where('imports.organization_id', organizationId)
    .leftJoin('users', 'imports.created_by', 'users.id')
    .select(
      'imports.*',
      db.raw("users.first_name || ' ' || users.last_name as created_by_name")
    )
    .orderBy('imports.created_at', 'desc');

  if (status) {
    query = query.where('imports.status', status);
  }
  if (cteType) {
    query = query.where('imports.cte_type', cteType);
  }

  return paginate(query, { page, limit });
};

/**
 * Get single import by ID.
 */
const getImportById = async (organizationId, id) => {
  const importJob = await db('imports')
    .where({ 'imports.organization_id': organizationId, 'imports.id': id })
    .leftJoin('users', 'imports.created_by', 'users.id')
    .select(
      'imports.*',
      db.raw("users.first_name || ' ' || users.last_name as created_by_name")
    )
    .first();

  if (!importJob) {
    throw new AppError('Import not found', 'NOT_FOUND', 404);
  }

  return importJob;
};

/**
 * Get import errors. Errors stored as JSON array in S3 at error_report_key.
 * Returns paginated slice.
 */
const getImportErrors = async (organizationId, importId, { page = 1, limit = 50 }) => {
  const importJob = await db('imports')
    .where({ organization_id: organizationId, id: importId })
    .first();

  if (!importJob) {
    throw new AppError('Import not found', 'NOT_FOUND', 404);
  }

  if (!importJob.error_report_key) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false } };
  }

  // Download error report from S3
  const { s3 } = require('../../lib/storage');
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const env = require('../../config/env');

  const response = await s3.send(new GetObjectCommand({
    Bucket: env.S3_BUCKET || 'lottrace-dev',
    Key: importJob.error_report_key,
  }));

  const body = await response.Body.transformToString();
  const allErrors = JSON.parse(body);

  // Manual pagination over the array
  const total = allErrors.length;
  const offset = (page - 1) * limit;
  const data = allErrors.slice(offset, offset + limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Generate CSV template string for a given CTE type.
 */
const generateTemplate = (cteType) => {
  const columns = TEMPLATE_COLUMNS[cteType];
  if (!columns) {
    throw new AppError('Invalid CTE type for template', 'VALIDATION_ERROR', 422);
  }

  const example = TEMPLATE_EXAMPLES[cteType];
  const exampleRow = columns.map(col => example[col] || '');

  return stringify([exampleRow], {
    header: true,
    columns,
  });
};

module.exports = {
  createImport,
  listImports,
  getImportById,
  getImportErrors,
  generateTemplate,
  TEMPLATE_COLUMNS,
};
